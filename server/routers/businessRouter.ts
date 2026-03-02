import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { businesses, users } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import bcryptjs from "bcryptjs";

export const businessRouter = router({
  register: publicProcedure
    .input(
      z.object({
        businessName: z.string().min(1, "İşletme adı gerekli"),
        contactPerson: z.string().optional(),
        businessType: z.enum(["restaurant", "market", "pharmacy", "retail"]).default("restaurant"),
        address: z.string().min(1, "Adres gerekli"),
        phone: z.string().min(1, "Telefon gerekli"),
        taxNumber: z.string().optional(),
        email: z.string().email("Geçerli email adresi girin").optional().or(z.literal("")),
        password: z.string().min(8, "Şifre en az 8 karakter olmalı").optional().or(z.literal("")),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        let userId: number;
        let businessEmail: string;
        
        // If user is already logged in, use their account
        if (ctx.user) {
          userId = ctx.user.id;
          businessEmail = ctx.user.email || input.email || "";
          
          console.log('[Business] User is logged in:', { userId, email: businessEmail });
          
          // Check if user already has a business profile
          const existingBusiness = await db.select().from(businesses).where(eq(businesses.userId, userId)).limit(1);
          console.log('[Business] Existing business check:', { count: existingBusiness.length });
          if (existingBusiness.length > 0) {
            console.log('[Business] User already has business:', existingBusiness[0]);
            throw new Error("Zaten işletme başvurunuz mevcut. Lütfen mevcut başvurunuzun durumunu kontrol edin.");
          }
        } else {
          // Create new user account for business registration
          if (!input.email || !input.password) {
            throw new Error("Email ve şifre gerekli");
          }
          
          businessEmail = input.email;
          
          // Check if email already exists
          console.log('[Business] Checking email:', input.email);
          const existingUser = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
          console.log('[Business] Existing user check result:', { count: existingUser.length, exists: existingUser.length > 0 });
          if (existingUser.length > 0) {
            console.log('[Business] Email already exists:', input.email);
            throw new Error("Bu email adresi zaten kullanılıyor");
          }
          console.log('[Business] Email is available:', input.email);
          
          // Hash password
          const hashedPassword = await bcryptjs.hash(input.password, 10);
          
          // Create user account - use raw SQL to get insertId properly
          const userResult = await db.insert(users).values({
            email: input.email,
            password: hashedPassword,
            name: input.contactPerson || input.businessName,
            role: "business",
            loginMethod: "email",
            createdAt: sql`NOW()`,
            updatedAt: sql`NOW()`,
            lastSignedIn: sql`NOW()`,
          });
          
          // Get the last inserted user ID from database
          const newUser = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
          if (!newUser.length) throw new Error("Kullanıcı oluşturulamadı");
          userId = newUser[0].id;
        }
        
        // Create business profile with pending status
        const result = await db.insert(businesses).values({
          userId: Number(userId),
          businessName: input.businessName,
          contactPerson: input.contactPerson || null,
          email: businessEmail,
          address: input.address,
          phone: input.phone,
          taxNumber: input.taxNumber || null,
          status: "inactive",
          balance: 0,
          totalDebt: 0,
          isVerified: false,
          createdAt: sql`NOW()`,
          updatedAt: sql`NOW()`,
        });

        return {
          success: true,
          message: "Başvurunuz alındı. Kısa sürede onaylanacaktır.",
          businessId: userId,
        };
      } catch (error) {
        console.error("[Business] Registration error:", error);
        if (error instanceof Error) {
          throw new Error(error.message);
        }
        throw new Error("Başvuru kaydedilemedi");
      }
    }),

  getPending: protectedProcedure.query(async ({ ctx }) => {
    // Admin kontrolü
    if (ctx.user?.role !== "admin") {
      throw new Error("Admin access required");
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      const pending = await db.select().from(businesses).where(eq(businesses.status, "inactive"));
      return pending;
    } catch (error) {
      console.error("[Business] Get pending error:", error);
      throw new Error("Beklemede olan işletmeler alınamadı");
    }
  }),

  approve: protectedProcedure
    .input(z.object({ businessId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        await db.update(businesses)
          .set({ status: "active" })
          .where(eq(businesses.id, input.businessId));

        return { success: true, message: "İşletme onaylandı" };
      } catch (error) {
        console.error("[Business] Approve error:", error);
        throw new Error("İşletme onaylanamadı");
      }
    }),

  reject: protectedProcedure
    .input(z.object({ businessId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        await db.update(businesses)
          .set({ status: "inactive" })
          .where(eq(businesses.id, input.businessId));

        return { success: true, message: "İşletme reddedildi" };
      } catch (error) {
        console.error("[Business] Reject error:", error);
        throw new Error("İşletme reddedilemedi");
      }
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    // Admin kontrolü
    if (ctx.user?.role !== "admin") {
      throw new Error("Admin access required");
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      const all = await db.select().from(businesses);
      return all;
    } catch (error) {
      console.error("[Business] Get all error:", error);
      throw new Error("İşletmeler alınamadı");
    }
  }),

  // Get business status
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      const business = await db.select().from(businesses).where(eq(businesses.userId, ctx.user.id)).limit(1);
      return business.length > 0 ? business[0] : null;
    } catch (error) {
      console.error("[Business] Get status error:", error);
      throw new Error("İşletme durumu alınamadı");
    }
  }),

  // Get business orders
  myOrders: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      // For now, return empty array - will be implemented with orders table
      return [];
    } catch (error) {
      console.error("[Business] Get orders error:", error);
      throw new Error("Siparişler alınamadı");
    }
  }),
});
