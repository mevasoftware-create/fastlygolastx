import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { apiDocsRouter } from "./apiDocsRouter";
import { authRouter } from "./routers/authRouter";
import { businessRouter } from "./routers/businessRouter";
import { notificationRouter } from "./routers/notificationRouter";
import { earningsRouter } from "./routers/earningsRouter";
import { categoryRouter } from "./routers/categoryRouter";
import { areaRouter } from "./routers/areaRouter";
import { userRouter } from "./routers/userRouter";
import { courierRouter } from "./routers/courierRouter";
import { ratingRouter } from "./routers/ratingRouter";
import { favoriteAddressRouter } from "./routers/favoriteAddressRouter";
import { couponRouter } from "./routers/couponRouter";
import { pushNotificationRouter } from "./routers/pushNotificationRouter";
import { trackingRouter } from "./routers/trackingRouter";
import { referralRouter } from "./routers/referralRouter";
import { adminRouter } from "./routers/adminRouter";
import { mobileAppRouter } from "./routers/mobileAppRouter";
import { imageRouter } from "./routers/imageRouter";
import { errorLogRouter } from "./errorLogRouter";
import { pagesRouter } from "./routers/pagesRouter";
import { scheduledNotificationRouter } from "./routers/scheduledNotificationRouter";


import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import bcryptjs from "bcryptjs";
import * as db from "./db";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";
import { users, orders, businesses, couriers, pricingConfig, paymentRequests, notifications } from "../drizzle/schema";
import { sql, eq, desc, and, gte, lte } from "drizzle-orm";
import { calculatePrice, calculateDistance as calcDist, estimateDeliveryTime, isPeakHour } from "./pricing";

// Helper to generate order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `RT-${timestamp}-${random}`.toUpperCase();
}

// Use improved distance calculation from pricing module
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const distanceKm = calcDist(lat1, lon1, lat2, lon2);
  return Math.round(distanceKm * 1000); // Return in meters
}

// Helper to calculate pricing with vehicle type, priority, and package size
async function calculatePricing(
  distance: number, 
  scenario: string = "A",
  vehicleType: string = "any",
  packageSize: string = "medium",
  priority: string = "normal"
) {
  const config = await db.getPricingConfig(scenario);
  let baseFee: number;
  let perKmFee: number;
  
  if (!config) {
    // Default pricing if config not found
    baseFee = scenario === "A" ? 400 : scenario === "B" ? 350 : 300; // in cents
    perKmFee = scenario === "A" ? 70 : scenario === "B" ? 60 : 50; // in cents per km
  } else {
    baseFee = config.baseFee;
    perKmFee = config.perKmFee;
  }
  
  const distanceFee = Math.round((distance / 1000) * perKmFee);
  
  // Vehicle type multiplier
  let vehicleFee = 0;
  if (vehicleType === "car") {
    vehicleFee = 150; // +1.50 EUR for car
  } else if (vehicleType === "motorcycle") {
    vehicleFee = 50; // +0.50 EUR for motorcycle
  } else if (vehicleType === "bicycle") {
    vehicleFee = 0; // No extra fee for bicycle
  }
  
  
  // Package size fee
  let packageSizeFee = 0;
  if (packageSize === "large") {
    packageSizeFee = 100; // +1.00 EUR for large package
  } else if (packageSize === "medium") {
    packageSizeFee = 50; // +0.50 EUR for medium package
  }
  
  // Calculate subtotal before priority multiplier
  const subtotal = baseFee + distanceFee + vehicleFee + packageSizeFee;
  
  // Priority multiplier
  let priorityMultiplier = 1.0;
  let priorityFee = 0;
  if (priority === "urgent") {
    priorityMultiplier = 1.5; // +50% for urgent
    priorityFee = Math.round(subtotal * 0.5);
  } else if (priority === "fast") {
    priorityMultiplier = 1.25; // +25% for fast
    priorityFee = Math.round(subtotal * 0.25);
  }
  
  // Dynamic pricing based on courier availability and peak hours
  let surgeFee = 0;
  let surgeMultiplier = 1.0;
  let surgeReason = "";
  
  try {
    // First check for manual surge config (highest priority)
    const manualSurge = await db.getActiveSurgeConfig();
    if (manualSurge && manualSurge.multiplier) {
      surgeMultiplier = parseFloat(manualSurge.multiplier.toString());
      surgeReason = manualSurge.reason || manualSurge.name;
      surgeFee = Math.round((subtotal * priorityMultiplier) * (surgeMultiplier - 1));
    } else {
      // Fallback to automatic surge based on courier availability
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error('Database not available');
      
      // Get available couriers count (approved and available)
      const availableCouriersResult = await dbInstance
        .select({ count: sql<number>`count(*)` })
        .from(couriers)
        .where(and(
          eq(couriers.status, "active"),
          eq(couriers.isAvailable, true)
        ));
      
      // Get total active couriers count (all approved couriers)
      const activeCouriersResult = await dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(couriers)
      .where(eq(couriers.status, "active"));
    
      const availableCount = Number(availableCouriersResult[0]?.count || 0);
      const activeCount = Number(activeCouriersResult[0]?.count || 0);
      
      // Calculate availability ratio
      const availabilityRatio = activeCount > 0 ? availableCount / activeCount : 0.5;
      
      // Check if it's peak hour (11:00-14:00 or 18:00-21:00)
      const currentHour = new Date().getHours();
      const isPeakHour = (currentHour >= 11 && currentHour < 14) || (currentHour >= 18 && currentHour < 21);
      
      // Apply surge pricing based on availability and peak hours
      if (availabilityRatio < 0.2) {
        // Very low availability: +30% surge
        surgeMultiplier = 1.3;
        surgeReason = "Very low courier availability";
      } else if (availabilityRatio < 0.4) {
        // Low availability: +15% surge
        surgeMultiplier = 1.15;
        surgeReason = "Low courier availability";
      } else if (availabilityRatio > 0.7 && !isPeakHour) {
        // High availability during off-peak: -10% discount
        surgeMultiplier = 0.9;
        surgeReason = "High courier availability discount";
      }
      
      // Additional peak hour surge (+10%)
      if (isPeakHour && surgeMultiplier >= 1.0) {
        surgeMultiplier += 0.1;
        surgeReason = surgeReason ? `${surgeReason} + Peak hour` : "Peak hour";
      }
      
      // Calculate surge fee
      if (surgeMultiplier !== 1.0) {
        surgeFee = Math.round((subtotal * priorityMultiplier) * (surgeMultiplier - 1));
      }
    }
  } catch (error) {
    console.error('Error calculating surge pricing:', error);
    // Continue with no surge pricing on error
  }
  
  const totalFee = Math.round((subtotal * priorityMultiplier) * surgeMultiplier);
  
  return {
    baseFee,
    distanceFee,
    vehicleFee,
    packageSizeFee,
    priorityFee,
    surgeFee,
    surgeMultiplier,
    surgeReason,
    totalFee,
    commissionRate: config?.commissionRate || (scenario === "C" ? 18 : undefined),
  };
}

export const appRouter = router({
  system: systemRouter,
  apiDocs: apiDocsRouter,
  auth: authRouter,
  business: businessRouter,
  notifications: notificationRouter,
  earnings: earningsRouter,
  categories: categoryRouter,
  areas: areaRouter,
  user: userRouter,
  // New modular routers for mobile API
  courierV2: courierRouter,
  ratings: ratingRouter,
  favoriteAddresses: favoriteAddressRouter,
  coupons: couponRouter,
  pushNotifications: pushNotificationRouter,
  locationTracking: trackingRouter,
  referrals: referralRouter,
  admin: adminRouter,
  mobileApp: mobileAppRouter,
  images: imageRouter,
  pages: pagesRouter,
  errorLogs: errorLogRouter,
  scheduledNotifications: scheduledNotificationRouter,


  
  // Public endpoints
  public: router({
    // Get public statistics for homepage
    stats: publicProcedure.query(async () => {
      const dbInstance = await getDb();
      if (!dbInstance) return {
        totalOrders: 15000,
        activeCustomers: 1000,
        activeCouriers: 50,
        completedToday: 120,
      };

      const totalOrders = await dbInstance.select({ count: sql<number>`count(*)` }).from(orders);
      const completedOrders = await dbInstance.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, 'delivered'));
      const totalUsers = await dbInstance.select({ count: sql<number>`count(*)` }).from(users);
      const activeCouriers = await dbInstance.select({ count: sql<number>`count(*)` }).from(couriers).where(eq(couriers.status, 'active'));
      
      // Orders completed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const completedToday = await dbInstance.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(sql`${orders.status} = 'delivered' AND ${orders.deliveredAt} >= ${today}`);

      return {
        totalOrders: Number(totalOrders[0]?.count || 0),
        completedOrders: Number(completedOrders[0]?.count || 0),
        activeCustomers: Number(totalUsers[0]?.count || 0),
        activeCouriers: Number(activeCouriers[0]?.count || 0),
        completedToday: Number(completedToday[0]?.count || 0),
      };
    }),

    // Get recent completed orders for homepage feed
    recentOrders: publicProcedure.query(async () => {
      const dbInstance = await getDb();
      if (!dbInstance) return [];

      const recentOrders = await dbInstance
        .select()
        .from(orders)
        .where(eq(orders.status, 'delivered'))
        .orderBy(desc(orders.deliveredAt))
        .limit(10);

      return recentOrders;
    }),

    // Get active couriers for homepage map (public endpoint)
    getActiveCouriers: publicProcedure.query(async () => {
      const dbInstance = await getDb();
      if (!dbInstance) return [];

      // Get all couriers with location data (no isAvailable filter)
      const activeCouriers = await dbInstance
        .select({
          id: couriers.id,
          vehicleType: couriers.vehicleType,
          currentLatitude: couriers.currentLatitude,
          currentLongitude: couriers.currentLongitude,
          isDemo: couriers.isDemo,
          isAvailable: couriers.isAvailable,
        })
        .from(couriers);

      return activeCouriers;
    }),
  }),
  
  session: router({
    // Check session status (for mobile)
    check: publicProcedure.query(({ ctx }) => {
      if (!ctx.user) {
        return {
          isValid: false,
          expiresAt: null,
        };
      }
      
      // Session is valid if user exists
      // In production, check actual session expiry from cookie/JWT
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days default
      
      return {
        isValid: true,
        expiresAt,
      };
    }),

    // Refresh session (for mobile)
    refresh: protectedProcedure.mutation(({ ctx }) => {
      // Session is automatically refreshed by the cookie middleware
      // Just return success with new expiry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      return {
        success: true,
        expiresAt,
      };
    }),

    // Get session token (for QR code / deep link)
    getToken: protectedProcedure.mutation(async ({ ctx }) => {
      // Generate a temporary token for mobile login
      const token = `${ctx.user.id}-${Date.now()}-${Math.random().toString(36).substring(2)}`;
      
      // In production, store this token in database with expiry
      // For now, we'll use a simple JWT-like structure
      const sessionToken = Buffer.from(JSON.stringify({
        userId: ctx.user.id,
        email: ctx.user.email,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      })).toString('base64');
      
      return {
        sessionToken,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      };
    }),

    // Login with token (for mobile)
    loginWithToken: publicProcedure
      .input(z.object({
        token: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Decode token
          const decoded = JSON.parse(Buffer.from(input.token, 'base64').toString());
          
          // Check expiry
          if (new Date(decoded.expiresAt) < new Date()) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Token expired" });
          }
          
          // Get user
          const user = await db.getUserById(decoded.userId);
          if (!user) {
            throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
          }
          
          // Set session cookie
          // Note: In production, you'd create a proper session here
          // For now, we rely on the OAuth callback to have already set the cookie
          
          return {
            success: true,
            user,
          };
        } catch (error) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
        }
      }),
  }),

  // Order management
  orders: router({
    // Create new order
    create: protectedProcedure
      .input(z.object({
        orderType: z.enum(["restaurant", "market", "pharmacy", "individual", "express"]),
        pickupAddress: z.string(),
        pickupLatitude: z.string().optional(),
        pickupLongitude: z.string().optional(),
        deliveryAddress: z.string(),
        deliveryLatitude: z.string().optional(),
        deliveryLongitude: z.string().optional(),
        vehicleType: z.enum(["bicycle", "motorcycle", "car", "any"]).default("any"),
        packageSize: z.enum(["small", "medium", "large"]).default("medium"),
        priority: z.enum(["normal", "fast", "urgent"]).default("normal"),
        packageDescription: z.string().optional(),
        specialInstructions: z.string().optional(),
        restaurantId: z.number().optional(),
        pricingScenario: z.enum(["A", "B", "C"]).default("A"),
        paymentType: z.enum(["sender_pays", "receiver_pays"]).default("sender_pays"),
        paymentMethod: z.enum(["cash", "card", "wallet"]).default("cash"),
        deliveryTimeType: z.enum(["now", "scheduled"]).default("now"),
        scheduledDeliveryDate: z.string().optional(), // ISO date string
        scheduledTimeSlot: z.string().optional(), // "14:00-15:00"
      }))
      .mutation(async ({ input, ctx }) => {
        const orderNumber = generateOrderNumber();
        
        // Calculate distance (simplified - use actual coordinates in production)
        let distance = 5000; // Default 5km
        if (input.pickupLatitude && input.pickupLongitude && 
            input.deliveryLatitude && input.deliveryLongitude) {
          distance = calculateDistance(
            parseFloat(input.pickupLatitude),
            parseFloat(input.pickupLongitude),
            parseFloat(input.deliveryLatitude),
            parseFloat(input.deliveryLongitude)
          );
        }
        
        // Calculate pricing with vehicle type, package size, and priority
        const pricing = await calculatePricing(
          distance, 
          input.pricingScenario,
          input.vehicleType,
          input.packageSize,
          input.priority
        );
        
        await db.createOrder({
          orderNumber,
          customerId: ctx.user.id,
          orderType: input.orderType,
          pickupAddress: input.pickupAddress,
          pickupLatitude: input.pickupLatitude,
          pickupLongitude: input.pickupLongitude,
          deliveryAddress: input.deliveryAddress,
          deliveryLatitude: input.deliveryLatitude,
          deliveryLongitude: input.deliveryLongitude,
          vehicleType: input.vehicleType,
          packageSize: input.packageSize,
          packageDescription: input.packageDescription,
          specialInstructions: input.specialInstructions,
          restaurantId: input.restaurantId,
          distance,
          baseFee: pricing.baseFee,
          distanceFee: pricing.distanceFee,
          totalFee: pricing.totalFee,
          calculatedPrice: pricing.totalFee, // System calculated price
          currentPrice: pricing.totalFee, // Start with calculated price
          pricingScenario: input.pricingScenario,
          commissionRate: pricing.commissionRate,
          status: "pending",
          paymentType: input.paymentType,
          paymentMethod: input.paymentMethod,
          paymentStatus: "pending",
          deliveryTimeType: input.deliveryTimeType,
          scheduledDeliveryDate: input.scheduledDeliveryDate ? new Date(input.scheduledDeliveryDate) : undefined,
          scheduledTimeSlot: input.scheduledTimeSlot,
        });
        
        // Get the created order to get its ID for notifications
        const dbInstance = await getDb();
        if (dbInstance) {
          const createdOrders = await dbInstance.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
          if (createdOrders.length > 0) {
            const { notifyAvailableCouriers } = await import("./_core/pushNotification");
            await notifyAvailableCouriers(createdOrders[0].id);
            
            // Send order confirmation email
            if (ctx.user.email) {
              const { sendOrderConfirmationEmail } = await import("./_core/email");
              await sendOrderConfirmationEmail(
                ctx.user.email,
                orderNumber,
                input.pickupAddress,
                input.deliveryAddress,
                pricing.totalFee / 100 // Convert to euros
              );
            }
          }
        }
        
        return { 
          success: true, 
          orderNumber,
          pricing: {
            baseFee: pricing.baseFee / 100, // Convert to euros
            distanceFee: pricing.distanceFee / 100,
            vehicleFee: pricing.vehicleFee / 100,
            packageSizeFee: pricing.packageSizeFee / 100,
            totalFee: pricing.totalFee / 100,
            distance: distance / 1000, // Convert to km
          }
        };
      }),

    // Get user's orders
    myOrders: protectedProcedure.query(async ({ ctx }) => {
      const orders = await db.getOrdersByCustomerId(ctx.user.id);
      
      // Add courier information to each order
      const ordersWithCourier = await Promise.all(orders.map(async (order) => {
        if (!order.courierId) return order;
        
        const courier = await db.getCourierByUserId(order.courierId);
        if (!courier) return order;
        
        const courierUser = await db.getUserById(courier.userId);
        return {
          ...order,
          courierName: courierUser?.name || null,
          courierPhone: courierUser?.phone || courier.phone || null,
          courierRating: courier.rating || 0,
          courierVehicleType: courier.vehicleType,
          courierVehiclePlate: courier.vehiclePlate || null,
          courierLatitude: courier.currentLatitude || null,
          courierLongitude: courier.currentLongitude || null,
        };
      }));
      
      return ordersWithCourier;
    }),

    // Get user's orders (alias for mobile app compatibility)
    getMyOrders: protectedProcedure.query(async ({ ctx }) => {
      const orders = await db.getOrdersByCustomerId(ctx.user.id);
      
      // Add courier information to each order
      const ordersWithCourier = await Promise.all(orders.map(async (order) => {
        if (!order.courierId) return order;
        
        const courier = await db.getCourierByUserId(order.courierId);
        if (!courier) return order;
        
        const courierUser = await db.getUserById(courier.userId);
        return {
          ...order,
          courierName: courierUser?.name || null,
          courierPhone: courierUser?.phone || courier.phone || null,
          courierRating: courier.rating || 0,
          courierVehicleType: courier.vehicleType,
          courierVehiclePlate: courier.vehiclePlate || null,
          courierLatitude: courier.currentLatitude || null,
          courierLongitude: courier.currentLongitude || null,
        };
      }));
      
      return ordersWithCourier;
    }),

    // Aliases for mobile app compatibility
    list: protectedProcedure.query(async ({ ctx }) => {
      const orders = await db.getOrdersByCustomerId(ctx.user.id);
      const ordersWithCourier = await Promise.all(orders.map(async (order) => {
        if (!order.courierId) return order;
        const courier = await db.getCourierByUserId(order.courierId);
        if (!courier) return order;
        const courierUser = await db.getUserById(courier.userId);
        return {
          ...order,
          courierName: courierUser?.name || null,
          courierPhone: courierUser?.phone || courier.phone || null,
          courierRating: courier.rating || 0,
          courierVehicleType: courier.vehicleType,
          courierVehiclePlate: courier.vehiclePlate || null,
          courierLatitude: courier.currentLatitude || null,
          courierLongitude: courier.currentLongitude || null,
        };
      }));
      return ordersWithCourier;
    }),

    getAll: protectedProcedure.query(async ({ ctx }) => {
      const orders = await db.getOrdersByCustomerId(ctx.user.id);
      const ordersWithCourier = await Promise.all(orders.map(async (order) => {
        if (!order.courierId) return order;
        const courier = await db.getCourierByUserId(order.courierId);
        if (!courier) return order;
        const courierUser = await db.getUserById(courier.userId);
        return {
          ...order,
          courierName: courierUser?.name || null,
          courierPhone: courierUser?.phone || courier.phone || null,
          courierRating: courier.rating || 0,
          courierVehicleType: courier.vehicleType,
          courierVehiclePlate: courier.vehiclePlate || null,
          courierLatitude: courier.currentLatitude || null,
          courierLongitude: courier.currentLongitude || null,
        };
      }));
      return ordersWithCourier;
    }),

    getOrders: protectedProcedure.query(async ({ ctx }) => {
      const orders = await db.getOrdersByCustomerId(ctx.user.id);
      const ordersWithCourier = await Promise.all(orders.map(async (order) => {
        if (!order.courierId) return order;
        const courier = await db.getCourierByUserId(order.courierId);
        if (!courier) return order;
        const courierUser = await db.getUserById(courier.userId);
        return {
          ...order,
          courierName: courierUser?.name || null,
          courierPhone: courierUser?.phone || courier.phone || null,
          courierRating: courier.rating || 0,
          courierVehicleType: courier.vehicleType,
          courierVehiclePlate: courier.vehiclePlate || null,
          courierLatitude: courier.currentLatitude || null,
          courierLongitude: courier.currentLongitude || null,
        };
      }));
      return ordersWithCourier;
    }),

    getUserOrders: protectedProcedure.query(async ({ ctx }) => {
      const orders = await db.getOrdersByCustomerId(ctx.user.id);
      const ordersWithCourier = await Promise.all(orders.map(async (order) => {
        if (!order.courierId) return order;
        const courier = await db.getCourierByUserId(order.courierId);
        if (!courier) return order;
        const courierUser = await db.getUserById(courier.userId);
        return {
          ...order,
          courierName: courierUser?.name || null,
          courierPhone: courierUser?.phone || courier.phone || null,
          courierRating: courier.rating || 0,
          courierVehicleType: courier.vehicleType,
          courierVehiclePlate: courier.vehiclePlate || null,
          courierLatitude: courier.currentLatitude || null,
          courierLongitude: courier.currentLongitude || null,
        };
      }));
      return ordersWithCourier;
    }),

    getCustomerOrders: protectedProcedure.query(async ({ ctx }) => {
      const orders = await db.getOrdersByCustomerId(ctx.user.id);
      const ordersWithCourier = await Promise.all(orders.map(async (order) => {
        if (!order.courierId) return order;
        const courier = await db.getCourierByUserId(order.courierId);
        if (!courier) return order;
        const courierUser = await db.getUserById(courier.userId);
        return {
          ...order,
          courierName: courierUser?.name || null,
          courierPhone: courierUser?.phone || courier.phone || null,
          courierRating: courier.rating || 0,
          courierVehicleType: courier.vehicleType,
          courierVehiclePlate: courier.vehiclePlate || null,
          courierLatitude: courier.currentLatitude || null,
          courierLongitude: courier.currentLongitude || null,
        };
      }));
      return ordersWithCourier;
    }),

    // Get order by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const order = await db.getOrderById(input.id);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }
        // Check if user has access to this order
        // Allow: admin, assigned courier, or customer
        const isAdmin = ctx.user.role === "admin";
        // Check if user is the assigned courier - courierId is courier.id, not userId
        let isAssignedCourier = false;
        if (order.courierId) {
          const courier = await db.getCourierByUserId(order.courierId);
          if (courier && courier.userId === ctx.user.id) {
            isAssignedCourier = true;
          }
        }
        const isCustomer = order.customerId === ctx.user.id;
        
        if (!isAdmin && !isAssignedCourier && !isCustomer) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        
        // Add courier information if courier is assigned
        let courierInfo = null;
        if (order.courierId) {
          const courier = await db.getCourierByUserId(order.courierId);
          if (courier) {
            const courierUser = await db.getUserById(courier.userId);
            courierInfo = {
              courierName: courierUser?.name || null,
              courierPhone: courierUser?.phone || courier.phone || null,
              courierRating: courier.rating || 0,
              courierVehicleType: courier.vehicleType,
              courierVehiclePlate: courier.vehiclePlate || null,
              courierLatitude: courier.currentLatitude || null,
              courierLongitude: courier.currentLongitude || null,
            };
          }
        }
        
        return {
          ...order,
          ...courierInfo,
        };
      }),

    // Get detailed order information with all related data
    getDetails: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const orderDetails = await db.getOrderDetailsById(input.id);
        if (!orderDetails) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }
        
        const { order } = orderDetails;
        
        // Check if user has access to this order
        const isAdmin = ctx.user.role === "admin";
        let isAssignedCourier = false;
        if (order.courierId) {
          const courier = await db.getCourierByUserId(order.courierId);
          if (courier && courier.userId === ctx.user.id) {
            isAssignedCourier = true;
          }
        }
        const isCustomer = order.customerId === ctx.user.id;
        
        if (!isAdmin && !isAssignedCourier && !isCustomer) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        
        return orderDetails;
      }),

    // Get order by order number (for public tracking links)
    getByOrderNumber: publicProcedure
      .input(z.object({ orderNumber: z.string() }))
      .query(async ({ input }) => {
        const dbInstance = await getDb();
        if (!dbInstance) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }
        
        const orderResult = await dbInstance.select().from(orders).where(eq(orders.orderNumber, input.orderNumber)).limit(1);
        if (orderResult.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }
        
        const order = orderResult[0];
        
        // Add courier information if courier is assigned
        let courierInfo = null;
        if (order.courierId) {
          const courier = await db.getCourierByUserId(order.courierId);
          if (courier) {
            const courierUser = await db.getUserById(courier.userId);
            courierInfo = {
              courierName: courierUser?.name || null,
              courierPhone: courierUser?.phone || courier.phone || null,
              courierRating: courier.rating || 0,
              courierVehicleType: courier.vehicleType,
              courierVehiclePlate: courier.vehiclePlate || null,
              courierLatitude: courier.currentLatitude || null,
              courierLongitude: courier.currentLongitude || null,
            };
          }
        }
        
        return {
          ...order,
          ...courierInfo,
        };
      }),

    // Cancel order
    cancel: protectedProcedure
      .input(z.object({ 
        orderId: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }
        
        // Check if user has access to cancel this order
        if (order.customerId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        
        // Only allow cancellation of pending or accepted orders
        if (order.status !== "pending" && order.status !== "accepted") {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Only pending or accepted orders can be cancelled" 
          });
        }
        
        await db.updateOrderStatus(input.orderId, "cancelled");
        
        // Notify courier if order was accepted
        if (order.courierId) {
          const courier = await db.getCourierByUserId(ctx.user.id);
          if (courier) {
            await db.createNotification({
              userId: courier.userId,
              title: "Sipariş İptal Edildi",
              message: `${order.orderNumber} numaralı sipariş müşteri tarafından iptal edildi.`,
              type: "order",
              relatedOrderId: input.orderId,
            });
          }
        }
        
        return { success: true, message: "Order cancelled successfully" };
      }),

    // Create rating for delivered order
    createRating: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }
        
        // Check if user is the customer of this order
        if (order.customerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only rate your own orders" });
        }
        
        // Check if order is delivered
        if (order.status !== "delivered") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You can only rate delivered orders" });
        }
        
        // Check if courier is assigned
        if (!order.courierId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No courier assigned to this order" });
        }
        
        // Check if rating already exists
        const existingRating = await db.getRatingByOrderId(input.orderId);
        if (existingRating) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You have already rated this order" });
        }
        
        // Create rating
        await db.createRating({
          orderId: input.orderId,
          customerId: ctx.user.id,
          courierId: order.courierId,
          rating: input.rating,
          comment: input.comment,
        });
        
        // Update courier's average rating
        const { average } = await db.getCourierAverageRating(order.courierId);
        const courier = await db.getCourierByUserId(order.courierId);
        if (courier) {
          const dbInstance = await db.getDb();
          if (dbInstance) {
            const { couriers } = await import('../drizzle/schema');
            await dbInstance.update(couriers).set({ rating: Math.round(average) }).where(eq(couriers.id, courier.id));
          }
        }
        
        return { success: true, message: "Rating submitted successfully" };
      }),

    // Check if order can be rated
    canRate: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input, ctx }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order || order.customerId !== ctx.user.id) {
          return { canRate: false, reason: "Order not found or access denied" };
        }
        
        if (order.status !== "delivered") {
          return { canRate: false, reason: "Order not delivered yet" };
        }
        
        if (!order.courierId) {
          return { canRate: false, reason: "No courier assigned" };
        }
        
        const existingRating = await db.getRatingByOrderId(input.orderId);
        if (existingRating) {
          return { canRate: false, reason: "Already rated", rating: existingRating };
        }
        
        return { canRate: true };
      }),

    // Get rating for an order
    getRating: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        const rating = await db.getRatingByOrderId(input.orderId);
        return rating || null;
      }),

    // Calculate price (alias for mobile app compatibility)
    calculatePrice: publicProcedure
      .input(z.object({
        pickupLatitude: z.union([z.number(), z.string()]).optional(),
        pickupLongitude: z.union([z.number(), z.string()]).optional(),
        deliveryLatitude: z.union([z.number(), z.string()]).optional(),
        deliveryLongitude: z.union([z.number(), z.string()]).optional(),
        vehicleType: z.enum(["bicycle", "motorcycle", "car", "any"]).optional(),
        packageSize: z.enum(["small", "medium", "large"]).optional(),
        priority: z.enum(["normal", "fast", "urgent"]).optional(),
        orderType: z.enum(["restaurant", "market", "pharmacy", "individual", "express"]).optional(),
      }).passthrough())
      .mutation(async ({ input }: { input: any }) => {
        // Parse coordinates - handle both number and string formats
        let pickupLat = typeof input.pickupLatitude === 'string' ? parseFloat(input.pickupLatitude) : input.pickupLatitude;
        let pickupLng = typeof input.pickupLongitude === 'string' ? parseFloat(input.pickupLongitude) : input.pickupLongitude;
        let deliveryLat = typeof input.deliveryLatitude === 'string' ? parseFloat(input.deliveryLatitude) : input.deliveryLatitude;
        let deliveryLng = typeof input.deliveryLongitude === 'string' ? parseFloat(input.deliveryLongitude) : input.deliveryLongitude;
        
        // Validate we have valid coordinates
        if (!pickupLat || !pickupLng || !deliveryLat || !deliveryLng || isNaN(pickupLat) || isNaN(pickupLng) || isNaN(deliveryLat) || isNaN(deliveryLng)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Geçerli koordinatlar gerekli: pickupLatitude, pickupLongitude, deliveryLatitude, deliveryLongitude",
          });
        }
        
        const distance = calculateDistance(
          pickupLat,
          pickupLng,
          deliveryLat,
          deliveryLng
        );
        
        // Determine pricing scenario based on order type
        let scenario = "A";
        if (input.orderType === "restaurant" || input.orderType === "market") {
          scenario = "B";
        } else if (input.orderType === "express") {
          scenario = "C";
        }
        
        const pricing = await calculatePricing(
          distance, 
          scenario,
          input.vehicleType || "any",
          input.packageSize || "medium",
          input.priority || "normal"
        );
        
        return {
          distance, // in meters
          baseFee: pricing.baseFee, // in cents
          distanceFee: pricing.distanceFee, // in cents
          totalFee: pricing.totalFee, // in cents
          pricingScenario: scenario as "A" | "B" | "C",
          estimatedDuration: Math.round(distance / 500 * 60), // rough estimate: 30km/h average speed
        };
      }),
  }),

  // Pricing
  pricing: router({
    // Calculate price estimate
    calculate: publicProcedure
      .input(z.object({
        pickupLatitude: z.number(),
        pickupLongitude: z.number(),
        deliveryLatitude: z.number(),
        deliveryLongitude: z.number(),
        vehicleType: z.enum(["bicycle", "motorcycle", "car", "any"]).optional(),
        packageSize: z.enum(["small", "medium", "large"]).optional(),
        priority: z.enum(["normal", "fast", "urgent"]).optional(),
        orderType: z.enum(["restaurant", "market", "pharmacy", "individual", "express"]).optional(),
      }))
      .query(async ({ input }) => {
        const distance = calculateDistance(
          input.pickupLatitude,
          input.pickupLongitude,
          input.deliveryLatitude,
          input.deliveryLongitude
        );
        
        // Determine pricing scenario based on order type
        let scenario = "A";
        if (input.orderType === "restaurant" || input.orderType === "market") {
          scenario = "B";
        } else if (input.orderType === "express") {
          scenario = "C";
        }
        
        const pricing = await calculatePricing(
          distance, 
          scenario,
          input.vehicleType || "any",
          input.packageSize || "medium",
          input.priority || "normal"
        );
        
        return {
          distance, // in meters
          baseFee: pricing.baseFee, // in cents
          distanceFee: pricing.distanceFee, // in cents
          totalFee: pricing.totalFee, // in cents
          pricingScenario: scenario as "A" | "B" | "C",
          estimatedDuration: Math.round(distance / 500 * 60), // rough estimate: 30km/h average speed
        };
      }),

    // Alias for mobile app compatibility
    calculatePrice: publicProcedure
      .input(z.object({
        pickupLatitude: z.union([z.number(), z.string()]).optional(),
        pickupLongitude: z.union([z.number(), z.string()]).optional(),
        deliveryLatitude: z.union([z.number(), z.string()]).optional(),
        deliveryLongitude: z.union([z.number(), z.string()]).optional(),
        vehicleType: z.enum(["bicycle", "motorcycle", "car", "any"]).optional(),
        packageSize: z.enum(["small", "medium", "large"]).optional(),
        priority: z.enum(["normal", "fast", "urgent"]).optional(),
        orderType: z.enum(["restaurant", "market", "pharmacy", "individual", "express"]).optional(),
      }).passthrough()) // Allow extra fields from mobile app
      .mutation(async ({ input }: { input: any }) => {
        // Parse coordinates - handle both number and string formats
        let pickupLat = typeof input.pickupLatitude === 'string' ? parseFloat(input.pickupLatitude) : input.pickupLatitude;
        let pickupLng = typeof input.pickupLongitude === 'string' ? parseFloat(input.pickupLongitude) : input.pickupLongitude;
        let deliveryLat = typeof input.deliveryLatitude === 'string' ? parseFloat(input.deliveryLatitude) : input.deliveryLatitude;
        let deliveryLng = typeof input.deliveryLongitude === 'string' ? parseFloat(input.deliveryLongitude) : input.deliveryLongitude;
        
        // Validate we have valid coordinates
        if (!pickupLat || !pickupLng || !deliveryLat || !deliveryLng || isNaN(pickupLat) || isNaN(pickupLng) || isNaN(deliveryLat) || isNaN(deliveryLng)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Geçerli koordinatlar gerekli: pickupLatitude, pickupLongitude, deliveryLatitude, deliveryLongitude",
          });
        }
        
        const distance = calculateDistance(
          pickupLat,
          pickupLng,
          deliveryLat,
          deliveryLng
        );
        
        // Determine pricing scenario based on order type
        let scenario = "A";
        if (input.orderType === "restaurant" || input.orderType === "market") {
          scenario = "B";
        } else if (input.orderType === "express") {
          scenario = "C";
        }
        
        const pricing = await calculatePricing(
          distance, 
          scenario,
          input.vehicleType || "any",
          input.packageSize || "medium",
          input.priority || "normal"
        );
        
        return {
          distance, // in meters
          baseFee: pricing.baseFee, // in cents
          distanceFee: pricing.distanceFee, // in cents
          totalFee: pricing.totalFee, // in cents
          pricingScenario: scenario as "A" | "B" | "C",
          estimatedDuration: Math.round(distance / 500 * 60), // rough estimate: 30km/h average speed
        };
      }),
  }),

  // Courier management
  courier: router({
    // Register as courier
    register: publicProcedure
      .input(z.object({
        phone: z.string(),
        gender: z.enum(["male", "female", "other"]).optional(),
        email: z.string().email().optional(),
        password: z.string().min(8).optional(),
        vehicleType: z.enum(["bicycle", "motorcycle", "car"]),
        vehiclePlate: z.string(),
        experience: z.string().optional(),
        availability: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        try {
          let userId: number;

          // If user is already logged in, use their account
          if (ctx.user) {
            userId = ctx.user.id;
            
            // Check if user already has a courier profile
            const existingCourier = await database.select().from(couriers).where(eq(couriers.userId, userId)).limit(1);
            if (existingCourier.length > 0) {
              throw new TRPCError({ code: "BAD_REQUEST", message: "Zaten kurye başvurunuz mevcut" });
            }
          } else {
            // User is not logged in, create new account
            if (!input.email || !input.password) {
              throw new TRPCError({ code: "BAD_REQUEST", message: "Email ve şifre gerekli" });
            }

            // Check if email already exists
            const existingUser = await database.select().from(users).where(eq(users.email, input.email)).limit(1);
            if (existingUser.length > 0) {
              throw new TRPCError({ code: "BAD_REQUEST", message: "Bu email adresi zaten kayıtlı. Lütfen giriş yapın." });
            }

            // Hash password
            const hashedPassword = await bcryptjs.hash(input.password, 10);
            
            // Create user account for courier
            await database.insert(users).values({
              email: input.email,
              password: hashedPassword,
              role: "user",
              loginMethod: "email",
              createdAt: new Date(),
              updatedAt: new Date(),
              lastSignedIn: new Date(),
            });

            // Get the inserted user ID
            const insertedUser = await database.select().from(users).where(eq(users.email, input.email)).limit(1);
            if (insertedUser.length === 0) {
              throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Kullanıcı oluşturulamadı" });
            }
            userId = insertedUser[0].id;
          }

          // Create courier profile
          await database.insert(couriers).values({
            userId: userId,
            phone: input.phone,
            gender: input.gender || null,
            vehicleType: input.vehicleType,
            vehiclePlate: input.vehiclePlate,
            experience: input.experience || null,
            availability: input.availability || null,
            status: "pending",
            isAvailable: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          
          return { success: true, message: "Başvurunuz alındı" };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("[Courier] Registration error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Başvuru kaydedilemedi" });
        }
      }),

    // Get courier status
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      // Allow any authenticated user to check courier status
      // Returns null if user is not a courier
      const courier = await db.getCourierByUserId(ctx.user.id);
      return courier || null;
    }),

    // Get pending orders for couriers
    pendingOrders: protectedProcedure.query(async ({ ctx }) => {
      const courier = await db.getCourierByUserId(ctx.user.id);
      if (!courier || courier.status !== 'active') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only approved couriers can access this" });
      }
      return await db.getPendingOrders();
    }),

    // Get available orders for couriers (alias for pendingOrders - mobile app compatibility)
    getAvailableOrders: protectedProcedure.query(async ({ ctx }) => {
      const courier = await db.getCourierByUserId(ctx.user.id);
      if (!courier || courier.status !== 'active') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only approved couriers can access this" });
      }
      const orders = await db.getPendingOrders();
      
      // Enrich orders with customer information
      return Promise.all(orders.map(async (order) => {
        const customer = await db.getUserById(order.customerId);
        return {
          ...order,
          customerName: customer?.name || null,
          customerPhone: customer?.phone || null,
        };
      }));
    }),

    // Accept order
    acceptOrder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Check if user is a courier
        const courier = await db.getCourierByUserId(ctx.user.id);
        if (!courier) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only couriers can accept orders" });
        }
        
        await db.assignCourierToOrder(input.orderId, courier.id);
        
        // Create notification for customer
        const order = await db.getOrderById(input.orderId);
        if (order) {
          await db.createNotification({
            userId: order.customerId,
            title: "Sipariş Kabul Edildi",
            message: `${order.orderNumber} numaralı siparişiniz kurye tarafından kabul edildi.`,
            type: "order",
            relatedOrderId: input.orderId,
          });
          
          // Send push notification and socket event
          const { notifyOrderStatusChange } = await import("./_core/pushNotification");
          const { emitToOrder, emitToUser } = await import("./_core/socket");
          
          await notifyOrderStatusChange(input.orderId, order.customerId, courier.userId, "accepted");
          emitToOrder(input.orderId, "order:statusUpdated", {
            orderId: input.orderId,
            status: "accepted",
            courierId: courier.id,
            timestamp: new Date(),
          });
          emitToUser(order.customerId, "order:courierAssigned", {
            orderId: input.orderId,
            courierId: courier.id,
            timestamp: new Date(),
          });
          
          // Send courier assigned email
          const customer = await db.getUserById(order.customerId);
          if (customer?.email) {
            const { sendCourierAssignedEmail } = await import("./_core/email");
            await sendCourierAssignedEmail(
              customer.email,
              order.orderNumber,
              ctx.user.name || "Kurye",
              ctx.user.phone || "-"
            );
          }
        }
        
        return { success: true };
      }),

    // Update order status
    updateStatus: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        status: z.enum(["picked_up", "in_transit", "delivered"]),
        pickupPhotoBase64: z.string().optional(),
        deliveryPhotoBase64: z.string().optional(),
        deliveryNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const courier = await db.getCourierByUserId(ctx.user.id);
        if (!courier) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only couriers can update order status" });
        }
        
        const order = await db.getOrderById(input.orderId);
        if (!order || order.courierId !== courier.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        
        // Photo is REQUIRED for picked_up status (pickup photo)
        if (input.status === "picked_up" && !input.pickupPhotoBase64) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Alış fotoğrafı zorunludur. Lütfen paketi aldığınıza dair fotoğraf yükleyin." });
        }
        
        // Photo is REQUIRED for delivered status (delivery photo)
        if (input.status === "delivered" && !input.deliveryPhotoBase64) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Teslimat fotoğrafı zorunludur. Lütfen teslimata dair fotoğraf yükleyin." });
        }
        
        // Upload photos to S3 if provided
        let pickupPhotoUrl: string | undefined;
        let deliveryPhotoUrl: string | undefined;
        
        if (input.pickupPhotoBase64) {
          try {
            const { storagePut } = await import('./storage');
            const base64Data = input.pickupPhotoBase64.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            const fileName = `pickup-photos/${order.orderNumber}-${Date.now()}.jpg`;
            const result = await storagePut(fileName, buffer, 'image/jpeg');
            pickupPhotoUrl = result.url;
            console.log(`[PhotoUpload] Pickup photo uploaded: ${pickupPhotoUrl}`);
          } catch (error) {
            console.error('[PhotoUpload] Failed to upload pickup photo:', error);
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Fotoğraf yüklenemedi" });
          }
        }
        
        if (input.deliveryPhotoBase64) {
          try {
            const { storagePut } = await import('./storage');
            const base64Data = input.deliveryPhotoBase64.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            const fileName = `delivery-photos/${order.orderNumber}-${Date.now()}.jpg`;
            const result = await storagePut(fileName, buffer, 'image/jpeg');
            deliveryPhotoUrl = result.url;
            console.log(`[PhotoUpload] Delivery photo uploaded: ${deliveryPhotoUrl}`);
          } catch (error) {
            console.error('[PhotoUpload] Failed to upload delivery photo:', error);
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Fotoğraf yüklenemedi" });
          }
        }
        
        await db.updateOrderStatus(input.orderId, input.status, {
          pickupPhotoUrl,
          deliveryPhotoUrl,
          deliveryNotes: input.deliveryNotes,
        });
        
        // Send push notification and socket event
        const { notifyOrderStatusChange } = await import("./_core/pushNotification");
        const { emitToOrder } = await import("./_core/socket");
        
        await notifyOrderStatusChange(input.orderId, order.customerId, courier.userId, input.status);
        emitToOrder(input.orderId, "order:statusUpdated", {
          orderId: input.orderId,
          status: input.status,
          timestamp: new Date(),
        });
        
        // If delivered, create earning record
        if (input.status === "delivered") {
          let amount = order.totalFee;
          let commissionAmount = 0;
          
          if (order.pricingScenario === "C" && order.commissionRate) {
            commissionAmount = Math.round(order.totalFee * (order.commissionRate / 100));
            amount = order.totalFee - commissionAmount;
          }
          
          await db.createEarning({
            courierId: courier.id,
            orderId: input.orderId,
            amount,
            pricingScenario: order.pricingScenario || "A",
            commissionAmount: commissionAmount > 0 ? commissionAmount : undefined,
          });
          
          // Update courier stats
          const courierData = await db.getCourierByUserId(ctx.user.id);
          if (courierData) {
            const database = await db.getDb();
            if (database) {
              const { couriers } = await import('../drizzle/schema');
              const { eq } = await import('drizzle-orm');
              await database.update(couriers)
                .set({ totalDeliveries: (courierData.totalDeliveries || 0) + 1 })
                .where(eq(couriers.id, courier.id));
            }
          }
        }
        
        // Notify customer
        await db.createNotification({
          userId: order.customerId,
          title: `Sipariş Durumu: ${input.status}`,
          message: `${order.orderNumber} numaralı siparişinizin durumu güncellendi.`,
          type: "delivery",
          relatedOrderId: input.orderId,
        });
        
        // Send delivery completed email
        if (input.status === "delivered") {
          const customer = await db.getUserById(order.customerId);
          if (customer?.email) {
            const { sendDeliveryCompletedEmail } = await import("./_core/email");
            await sendDeliveryCompletedEmail(customer.email, order.orderNumber);
          }
        }
        
        return { success: true };
      }),

    // Get courier's orders
    myOrders: protectedProcedure.query(async ({ ctx }) => {
      const courier = await db.getCourierByUserId(ctx.user.id);
      if (!courier) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only couriers can access this" });
      }
      return await db.getOrdersByCourierId(courier.id);
    }),

    // Get earnings
    myEarnings: protectedProcedure.query(async ({ ctx }) => {
      const courier = await db.getCourierByUserId(ctx.user.id);
      if (!courier) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only couriers can access this" });
      }
      const earnings = await db.getEarningsByCourierId(courier.id);
      const total = await db.getTotalEarningsByCourierId(courier.id);
      return { earnings, total: total / 100 }; // Convert to euros
    }),

    // Upload delivery photo
    uploadDeliveryPhoto: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        photoData: z.string(), // base64 encoded image
      }))
      .mutation(async ({ input, ctx }) => {
        const courier = await db.getCourierByUserId(ctx.user.id);
        if (!courier) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only couriers can upload photos" });
        }

        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }

        // Check if courier is assigned to this order
        if (order.courierId !== courier.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only upload photos for your own deliveries" });
        }

        // Check if order is delivered or in_transit
        if (order.status !== "delivered" && order.status !== "in_transit") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Can only upload photos for in-transit or delivered orders" });
        }

        // Convert base64 to buffer
        const base64Data = input.photoData.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');

        // Upload to S3
        const { storagePut } = await import('./storage');
        const fileName = `delivery-photos/${order.orderNumber}-${Date.now()}.jpg`;
        const { url } = await storagePut(fileName, buffer, 'image/jpeg');

        // Update order with photo URL
        const dbInstance = await db.getDb();
        if (dbInstance) {
          const { orders } = await import('../drizzle/schema');
          await dbInstance.update(orders)
            .set({ deliveryPhotoUrl: url })
            .where(eq(orders.id, input.orderId));
        }

        return { success: true, photoUrl: url };
      }),

    // Update location
    updateLocation: protectedProcedure
      .input(z.object({
        latitude: z.string(),
        longitude: z.string(),
        orderId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const courier = await db.getCourierByUserId(ctx.user.id);
        if (!courier) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only couriers can update location" });
        }
        await db.updateCourierLocation(courier.id, input.latitude, input.longitude);
        
        // Emit socket event for real-time tracking
        const { emitToOrder, emitToAdmins } = await import("./_core/socket");
        
        // Broadcast to admins
        emitToAdmins("courier:locationUpdated", {
          courierId: courier.id,
          userId: ctx.user.id,
          latitude: input.latitude,
          longitude: input.longitude,
          orderId: input.orderId,
          timestamp: new Date(),
        });
        
        // If order is specified, broadcast to customer
        if (input.orderId) {
          emitToOrder(input.orderId, "courier:locationUpdated", {
            courierId: courier.id,
            latitude: input.latitude,
            longitude: input.longitude,
            timestamp: new Date(),
          });
        }
        
        return { success: true };
      }),

    // Mark payment as collected
    markPaymentCollected: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        collectedAmount: z.number(), // in cents
      }))
      .mutation(async ({ input, ctx }) => {
        const courier = await db.getCourierByUserId(ctx.user.id);
        if (!courier) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only couriers can mark payment as collected" });
        }
        
        const order = await db.getOrderById(input.orderId);
        if (!order || order.courierId !== courier.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        
        // Update payment status
        const dbInstance = await db.getDb();
        if (dbInstance) {
          const { orders } = await import('../drizzle/schema');
          await dbInstance.update(orders)
            .set({
              paymentStatus: "collected",
              collectedAmount: input.collectedAmount,
              collectedAt: new Date(),
              collectedBy: courier.id,
            })
            .where(eq(orders.id, input.orderId));
        }
        
        // Notify customer
        await db.createNotification({
          userId: order.customerId,
          title: "Ödeme Alındı",
          message: `${order.orderNumber} numaralı siparişinizin ödemesi kurye tarafından alındı.`,
          type: "order",
          relatedOrderId: input.orderId,
        });
        
        return { success: true };
      }),

    // Toggle availability
    toggleAvailability: protectedProcedure
      .input(z.object({
        isAvailable: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        const courier = await db.getCourierByUserId(ctx.user.id);
        if (!courier) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only couriers can toggle availability" });
        }
        await db.updateCourierAvailability(courier.id, input.isAvailable);
        return { success: true, isAvailable: input.isAvailable };
      }),

    // Alias for app compatibility
    availableOrders: protectedProcedure.query(async ({ ctx }) => {
      const courier = await db.getCourierByUserId(ctx.user.id);
      if (!courier || courier.status !== 'active') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only approved couriers can access this" });
      }
      return await db.getPendingOrders();
    }),

    // Get courier profile
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const courier = await db.getCourierByUserId(ctx.user.id);
      // Return null explicitly if courier not found (tRPC requires non-undefined return)
      return courier || null;
    }),

    // Update payment information
    updatePaymentInfo: protectedProcedure
      .input(z.object({
        iban: z.string(),
        identityNumber: z.string(),
        identityType: z.enum(["tc", "passport"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const courier = await db.getCourierByUserId(ctx.user.id);
        if (!courier) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only couriers can update payment info" });
        }
        
        await db.updateCourierPaymentInfo(courier.id, {
          iban: input.iban,
          identityNumber: input.identityNumber,
          identityType: input.identityType,
        });
        
        return { success: true };
      }),

    // Get earnings summary
    getEarnings: protectedProcedure.query(async ({ ctx }) => {
      const courier = await db.getCourierByUserId(ctx.user.id);
      if (!courier) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only couriers can access earnings" });
      }
      
      const dbInstance = await db.getDb();
      if (!dbInstance) {
        return {
          daily: 0,
          weekly: 0,
          monthly: 0,
          total: 0,
          pending: 0,
        };
      }
      
      // Calculate earnings for different periods
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      
      // Get earnings from database
      const { earnings } = await import('../drizzle/schema');
      
      const dailyEarnings = await dbInstance.select({ total: sql<number>`SUM(amount)` })
        .from(earnings)
        .where(and(eq(earnings.courierId, courier.id), gte(earnings.createdAt, today)));
      
      const weeklyEarnings = await dbInstance.select({ total: sql<number>`SUM(amount)` })
        .from(earnings)
        .where(and(eq(earnings.courierId, courier.id), gte(earnings.createdAt, weekAgo)));
      
      const monthlyEarnings = await dbInstance.select({ total: sql<number>`SUM(amount)` })
        .from(earnings)
        .where(and(eq(earnings.courierId, courier.id), gte(earnings.createdAt, monthAgo)));
      
      const totalEarnings = await db.getTotalEarningsByCourierId(courier.id);
      
      // Get pending payment requests
      const { paymentRequests } = await import('../drizzle/schema');
      const pendingPayments = await dbInstance.select({ total: sql<number>`SUM(amount)` })
        .from(paymentRequests)
        .where(and(eq(paymentRequests.courierId, courier.id), eq(paymentRequests.status, 'pending')));
      
      return {
        daily: Number(dailyEarnings[0]?.total || 0),
        weekly: Number(weeklyEarnings[0]?.total || 0),
        monthly: Number(monthlyEarnings[0]?.total || 0),
        total: totalEarnings || 0,
        pending: Number(pendingPayments[0]?.total || 0),
      };
    }),

    // Get payment requests
    getPaymentRequests: protectedProcedure.query(async ({ ctx }) => {
      const courier = await db.getCourierByUserId(ctx.user.id);
      if (!courier) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only couriers can access payment requests" });
      }
      
      return await db.getPaymentRequestsByCourierId(courier.id);
    }),

    // Request payment
    requestPayment: protectedProcedure
      .input(z.object({
        amount: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const courier = await db.getCourierByUserId(ctx.user.id);
        if (!courier) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only couriers can request payment" });
        }
        
        // Check if IBAN is set
        if (!courier.iban) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Please add your IBAN first" });
        }
        
        // Check if identity is verified
        if (!courier.identityVerified) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Your identity must be verified first" });
        }
        
        // Create payment request
        await db.createPaymentRequest({
          courierId: courier.id,
          amount: input.amount,
          status: "pending",
        });
        
        return { success: true };
      }),

    // Set online status (for mobile app)
    setOnlineStatus: protectedProcedure
      .input(z.object({
        isOnline: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        const courier = await db.getCourierByUserId(ctx.user.id);
        if (!courier) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only couriers can set online status" });
        }
        
        // Update courier availability status
        const dbInstance = await db.getDb();
        if (!dbInstance) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }
        
        await dbInstance.update(couriers).set({
          isAvailable: input.isOnline,
          updatedAt: new Date(),
        }).where(eq(couriers.id, courier.id));
        
        // Socket.io real-time updates handled separately
        
        return { success: true };
      }),
  }),

  // Restaurant (legacy alias for backward compatibility with web)
  restaurant: router({
    // Create delivery request
    createDelivery: protectedProcedure
      .input(z.object({
        deliveryAddress: z.string(),
        deliveryLatitude: z.string().optional(),
        deliveryLongitude: z.string().optional(),
        packageDescription: z.string().optional(),
        specialInstructions: z.string().optional(),
        vehicleType: z.enum(["bicycle", "motorcycle", "car", "any"]).optional().default("any"),
        packageSize: z.enum(["small", "medium", "large"]).optional().default("medium"),
        priority: z.enum(["normal", "fast", "urgent"]).optional().default("normal"),
      }))
      .mutation(async ({ input, ctx }) => {
        const restaurant = await db.getRestaurantByUserId(ctx.user.id);
        if (!restaurant) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only businesses can create deliveries" });
        }
        
        const orderNumber = generateOrderNumber();
        
        // Use restaurant address as pickup
        const pickupLat = restaurant.latitude || "0";
        const pickupLon = restaurant.longitude || "0";
        
        let distance = 5000;
        if (input.deliveryLatitude && input.deliveryLongitude) {
          distance = calculateDistance(
            parseFloat(pickupLat),
            parseFloat(pickupLon),
            parseFloat(input.deliveryLatitude),
            parseFloat(input.deliveryLongitude)
          );
        }
        
        const pricing = await calculatePricing(
          distance, 
          "B", // Restaurants typically use scenario B
          input.vehicleType || "any",
          input.packageSize || "medium",
          input.priority || "normal"
        );
        
        await db.createOrder({
          orderNumber,
          customerId: ctx.user.id,
          restaurantId: restaurant.id,
          orderType: "restaurant",
          pickupAddress: restaurant.address,
          pickupLatitude: pickupLat,
          pickupLongitude: pickupLon,
          deliveryAddress: input.deliveryAddress,
          deliveryLatitude: input.deliveryLatitude,
          deliveryLongitude: input.deliveryLongitude,
          packageDescription: input.packageDescription,
          specialInstructions: input.specialInstructions,
          distance,
          baseFee: pricing.baseFee,
          distanceFee: pricing.distanceFee,
          totalFee: pricing.totalFee,
          pricingScenario: "B",
          status: "pending",
        });
        
        return { success: true, orderNumber };
      }),

    // Get restaurant's orders
    myOrders: protectedProcedure.query(async ({ ctx }) => {
      const restaurant = await db.getRestaurantByUserId(ctx.user.id);
      if (!restaurant) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only businesses can access this" });
      }
      return await db.getOrdersByRestaurantId(restaurant.id);
    }),

    // Update pricing config
    updatePricing: protectedProcedure
      .input(z.object({
        scenario: z.enum(["A", "B", "C"]),
        baseFee: z.number(),
        perKmFee: z.number(),
        commissionRate: z.number().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        await db.upsertPricingConfig({
          scenario: input.scenario,
          baseFee: Math.round(input.baseFee * 100), // Convert to cents
          perKmFee: Math.round(input.perKmFee * 100),
          commissionRate: input.commissionRate,
          description: input.description,
          isActive: true,
        });
        return { success: true };
      }),

    // Register new restaurant/business
    register: protectedProcedure
      .input(z.object({
        businessName: z.string(),
        contactPerson: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string(),
        address: z.string(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await getDb();
        if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        // Check if restaurant already exists for this user
        const existing = await dbInstance.select().from(businesses).where(eq(businesses.userId, ctx.user.id)).limit(1);
        if (existing.length > 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Business already registered for this user" });
        }

        await dbInstance.insert(businesses).values({
          userId: ctx.user.id,
          businessName: input.businessName,
          contactPerson: input.contactPerson || null,
          email: input.email || ctx.user.email,
          phone: input.phone,
          address: input.address,
          latitude: input.latitude || null,
          longitude: input.longitude || null,
           balance: 0,
          totalDebt: 0,
          status: "inactive",
        });
        return { success: true };
      }),
    // Get restaurant profilee
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const restaurant = await dbInstance.select().from(businesses).where(eq(businesses.userId, ctx.user.id)).limit(1);
      if (restaurant.length === 0) return null;
      return restaurant[0];
    }),

    // Get transaction history (deprecated - restaurantTransactions table removed)
    getTransactions: protectedProcedure.query(async () => {
      return [];
    }),

    // Get reports for date range
    getReports: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const dbInstance = await getDb();
        if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const restaurant = await dbInstance.select().from(businesses).where(eq(businesses.userId, ctx.user.id)).limit(1);
        if (restaurant.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Business not found" });
        }

        // Get orders in date range
        const orders = await db.getOrdersByRestaurantAndDateRange(
          restaurant[0].id,
          new Date(input.startDate),
          new Date(input.endDate)
        );

        // Calculate statistics
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, order) => sum + order.totalFee, 0);
        const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

        // Group by date
        const ordersByDate: Record<string, { count: number; total: number }> = {};
        orders.forEach(order => {
          const date = new Date(order.createdAt).toISOString().split('T')[0];
          if (!ordersByDate[date]) {
            ordersByDate[date] = { count: 0, total: 0 };
          }
          ordersByDate[date].count++;
          ordersByDate[date].total += order.totalFee;
        });

        return {
          totalOrders,
          totalSpent,
          avgOrderValue,
          ordersByDate,
          orders,
        };
      }),
  }),
});
export type AppRouter = typeof appRouter;
