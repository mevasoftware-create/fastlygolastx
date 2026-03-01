import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import * as authService from "../_core/authService";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { mobileRouter } from "./mobileRouter";
import { sendEmail, getEmailVerificationTemplate, getPasswordResetTemplate } from "../_core/emailService";
import { sendPasswordResetEmail, sendPasswordResetSuccessEmail } from "../_core/email";
import { shouldSendEmail, logEmailAttempt, getEmailConfig } from "../_core/emailOptimization";

// Helper functions for sending emails
async function sendVerificationEmailHelper(email: string, name: string, verificationLink: string) {
  const html = getEmailVerificationTemplate(name, verificationLink);
  await sendEmail({
    to: email,
    subject: 'FastlyGo - Email Doğrulama',
    html,
  });
}

export const authRouter = router({
  /**
   * Get current user info
   */
  me: publicProcedure.query(opts => {
    const user = opts.ctx.user;
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone || null,
      avatarUrl: user.avatarUrl || null,
      approved: user.role === 'courier' || user.role === 'business' ? true : undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastSignedIn: user.lastSignedIn,
    };
  }),

  /**
   * Logout
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  /**
   * Register new user with email and password
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email('Geçerli email gerekli').toLowerCase(),
        password: z.string().min(8, 'Şifre en az 8 karakter olmalı'),
        name: z.string().min(2, 'Ad en az 2 karakter olmalı'),
        role: z.enum(["user", "courier", "business"]).default("user"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await authService.registerUser(
        input.email,
        input.password,
        input.name,
        input.role
      );

      if (!result) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Kayıt başarısız. Email zaten kullanılıyor olabilir.",
        });
      }

      // Send verification email only (removed duplicate welcome email)
      const frontendUrl = process.env.VITE_FRONTEND_URL || 'https://fastlygo.mk';
      const verificationLink = `${frontendUrl}/verify-email?email=${encodeURIComponent(input.email)}&token=${result.emailVerificationToken}`;
      
      // Check if we should send verification email (rate limiting)
      const config = getEmailConfig('verification');
      const shouldSend = shouldSendEmail(input.email, 'verification', { ...config, isMobileApp: ctx.isMobileApp });
      
      if (shouldSend.should) {
        try {
          await sendVerificationEmailHelper(
            input.email,
            input.name,
            verificationLink
          );
          logEmailAttempt(input.email, 'verification', 'sent');
        } catch (error) {
          console.error('[Auth] Failed to send verification email:', error);
          logEmailAttempt(input.email, 'verification', 'failed', String(error));
        }
      } else {
        console.warn('[Auth] Skipping verification email:', shouldSend.reason);
      }

      return {
        success: true,
        userId: result.userId,
        token: result.token,
        message: "Kayıt başarılı! Lütfen email adresinizi doğrulayın.",
      };
    }),

  /**
   * Login with email and password
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email('Geçerli email gerekli').toLowerCase(),
        password: z.string().min(1, 'Şifre gerekli'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await authService.loginUser(input.email, input.password);

      if (!result) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Giriş başarısız. Email veya şifre yanlış. Lütfen kontrol edin.",
        });
      }

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      console.log('[Auth] Setting cookie:', COOKIE_NAME, 'with options:', cookieOptions);
      ctx.res.cookie(COOKIE_NAME, result.token, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      });
      console.log('[Auth] Cookie set successfully for user:', result.userId, 'role:', result.role);

      return {
        success: true,
        userId: result.userId,
        role: result.role,
        token: result.token,
        approvalStatus: result.approvalStatus,
      };
    }),

  /**
   * Verify email with token
   */
  verifyEmail: publicProcedure
    .input(
      z.object({
        email: z.string().min(1, 'Email gerekli').toLowerCase(),
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const success = await authService.verifyEmail(input.email, input.token);

      if (!success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email doğrulama başarısız. Token geçersiz veya süresi dolmuş.",
        });
      }

      return { success: true, message: "Email başarıyla doğrulandı!" };
    }),

  /**
   * Request password reset
   */
  forgotPassword: publicProcedure
    .input(z.object({ 
      email: z.string().min(1, 'Email gerekli').toLowerCase(),
      language: z.enum(['en', 'tr', 'mk', 'sq']).optional().default('en')
    }))
    .mutation(async ({ input, ctx }) => {
      const resetToken = await authService.requestPasswordReset(input.email);

      if (!resetToken) {
        // Return error if email not found
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Bu email adresi ile kayıtlı kullanıcı bulunamadı.',
        });
      }

      // Send password reset email with rate limiting
      const frontendUrl = process.env.VITE_FRONTEND_URL || 'https://fastlygo.mk';
      const resetUrl = `${frontendUrl}/reset-password?email=${encodeURIComponent(input.email)}&token=${resetToken}`;
      
      // Check if we should send password reset email (rate limiting)
      const config = getEmailConfig('password_reset');
      const shouldSend = shouldSendEmail(input.email, 'password_reset', { ...config, isMobileApp: ctx.isMobileApp });
      
      if (shouldSend.should) {
        try {
          const emailSent = await sendPasswordResetEmail(input.email, resetToken, resetUrl, input.language);
          if (emailSent) {
            logEmailAttempt(input.email, 'password_reset', 'sent');
          } else {
            logEmailAttempt(input.email, 'password_reset', 'failed', 'Email service returned false');
          }
        } catch (error) {
          console.error('[Auth] Failed to send password reset email:', error);
          logEmailAttempt(input.email, 'password_reset', 'failed', String(error));
        }
      } else {
        console.warn('[Auth] Skipping password reset email:', shouldSend.reason);
      }

      return {
        success: true,
        message: "Şifre sıfırlama linki email adresinize gönderildi.",
      };
    }),

  /**
   * Reset password with token
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        email: z.string().min(1, 'Email gerekli').toLowerCase(),
        token: z.string(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const success = await authService.resetPassword(
        input.email,
        input.token,
        input.newPassword
      );

      if (!success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Şifre sıfırlama başarısız. Token geçersiz veya süresi dolmuş.",
        });
      }

      // Send success email with rate limiting
      const config = getEmailConfig('password_reset_success');
      const shouldSend = shouldSendEmail(input.email, 'password_reset_success', { ...config, isMobileApp: ctx.isMobileApp });
      
      if (shouldSend.should) {
        try {
          await sendPasswordResetSuccessEmail(input.email);
          logEmailAttempt(input.email, 'password_reset_success', 'sent');
        } catch (error) {
          console.error('[Auth] Failed to send password reset success email:', error);
          logEmailAttempt(input.email, 'password_reset_success', 'failed', String(error));
        }
      } else {
        console.warn('[Auth] Skipping password reset success email:', shouldSend.reason);
      }

      return { success: true, message: "Şifreniz başarıyla sıfırlandı!" };
    }),

  /**
   * Google OAuth login/register
   */
  googleLogin: publicProcedure
    .input(
      z.object({
        email: z.string().min(1, 'Email gerekli').toLowerCase(),
        name: z.string(),
        googleId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await authService.upsertGoogleUser(
        input.email,
        input.name,
        input.googleId
      );

      if (!result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Google giriş başarısız.",
        });
      }

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      console.log('[Auth] Setting cookie:', COOKIE_NAME, 'with options:', cookieOptions);
      ctx.res.cookie(COOKIE_NAME, result.token, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      });
      console.log('[Auth] Cookie set successfully for user:', result.userId, 'role:', result.role);

      return {
        success: true,
        userId: result.userId,
        role: result.role,
        token: result.token,
      };
    }),

  mobile: mobileRouter,
});
