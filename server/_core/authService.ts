import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from './env';
import { getDb } from '../db';
import { users, businesses, couriers } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { sendEmail, getEmailVerificationTemplate, getWelcomeTemplate, getPasswordResetTemplate } from './emailService';

export interface AuthPayload {
  userId: number;
  email: string;
  role: string;
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
export function generateToken(payload: AuthPayload, expiresIn: string = '7d'): string {
  return jwt.sign(payload, ENV.jwtSecret as string, { expiresIn } as any);
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, ENV.jwtSecret) as AuthPayload;
  } catch (error) {
    console.error('[AuthService] Token verification failed:', error);
    return null;
  }
}

/**
 * Generate email verification token
 */
export function generateEmailVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Generate password reset token
 */
export function generatePasswordResetToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Register new user with email and password
 */
export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: 'user' | 'courier' | 'business' = 'user'
): Promise<{ userId: number; token: string; emailVerificationToken: string } | null> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[AuthService] Database not available');
      return null;
    }

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      console.error('[AuthService] User already exists:', email);
      return null;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    const emailVerificationToken = generateEmailVerificationToken();

    // Create user
    const result = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      role,
      loginMethod: 'email',
      emailVerified: false,
      emailVerificationToken,
      lastSignedIn: new Date(),
    });

    const userId = Number((result as any).insertId || 0);

    // Generate token
    const token = generateToken({
      userId,
      email,
      role,
    });

    console.log('[AuthService] User registered:', email);
    return { userId, token, emailVerificationToken };
  } catch (error) {
    console.error('[AuthService] Registration error:', error);
    return null;
  }
}

/**
 * Login user with email and password
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ userId: number; token: string; role: string; approvalStatus?: string } | null> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[AuthService] Database not available');
      return null;
    }

    // Find user
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (result.length === 0) {
      console.error('[AuthService] User not found:', email);
      return null;
    }

    const user = result[0];

    // Check password
    if (!user.password || !(await comparePassword(password, user.password))) {
      console.error('[AuthService] Invalid password for:', email);
      return null;
    }

    // Check email verification
    if (!user.emailVerified) {
      console.warn('[AuthService] Email not verified for:', email);
      // Still allow login but flag it
    }

    // Update last signed in
    await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // For business/courier users, fetch their approval status
    let approvalStatus: string | undefined;
    if (user.role === 'business') {
      const bizResult = await db.select({ status: businesses.status })
        .from(businesses).where(eq(businesses.userId, user.id)).limit(1);
      approvalStatus = bizResult[0]?.status ?? 'pending';
    } else if (user.role === 'courier') {
      const courierResult = await db.select({ status: couriers.status })
        .from(couriers).where(eq(couriers.userId, user.id)).limit(1);
      approvalStatus = courierResult[0]?.status ?? 'pending';
    }

    console.log('[AuthService] User logged in:', email, 'approvalStatus:', approvalStatus);
    return { userId: user.id, token, role: user.role, approvalStatus };
  } catch (error) {
    console.error('[AuthService] Login error:', error);
    return null;
  }
}

/**
 * Verify email with token
 */
export async function verifyEmail(email: string, token: string): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[AuthService] Database not available');
      return false;
    }

    // Find user
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (result.length === 0) {
      console.error('[AuthService] User not found:', email);
      return false;
    }

    const user = result[0];

    // Check token
    if (user.emailVerificationToken !== token) {
      console.error('[AuthService] Invalid email verification token');
      return false;
    }

    // Check token expiration (72 hours from createdAt)
    const emailVerificationExpiryHours = parseInt(process.env.EMAIL_VERIFICATION_EXPIRY_HOURS || '72');
    const tokenCreatedTime = user.createdAt?.getTime() || Date.now();
    const expirationTime = tokenCreatedTime + (emailVerificationExpiryHours * 60 * 60 * 1000);
    
    if (Date.now() > expirationTime) {
      console.error('[AuthService] Email verification token expired');
      return false;
    }

    // Update user
    await db.update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
      })
      .where(eq(users.id, user.id));

    console.log('[AuthService] Email verified:', email);
    return true;
  } catch (error) {
    console.error('[AuthService] Email verification error:', error);
    return false;
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<string | null> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[AuthService] Database not available');
      return null;
    }

    // Find user
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (result.length === 0) {
      console.error('[AuthService] User not found:', email);
      return null;
    }

    const user = result[0];
    const resetToken = generatePasswordResetToken();
    const passwordResetExpiryHours = parseInt(process.env.PASSWORD_RESET_EXPIRY_HOURS || '24');
    const resetExpires = new Date(Date.now() + passwordResetExpiryHours * 60 * 60 * 1000);

    // Update user
    await db.update(users)
      .set({
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      })
      .where(eq(users.id, user.id));

    console.log('[AuthService] Password reset requested:', email);
    return resetToken;
  } catch (error) {
    console.error('[AuthService] Password reset request error:', error);
    return null;
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(
  email: string,
  token: string,
  newPassword: string
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[AuthService] Database not available');
      return false;
    }

    // Find user
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (result.length === 0) {
      console.error('[AuthService] User not found:', email);
      return false;
    }

    const user = result[0];

    // Check token
    if (user.passwordResetToken !== token) {
      console.error('[AuthService] Invalid password reset token');
      return false;
    }

    // Check expiration
    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      console.error('[AuthService] Password reset token expired');
      return false;
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user
    await db.update(users)
      .set({
        password: hashedPassword,
      })
      .where(eq(users.id, user.id));

    console.log('[AuthService] Password reset:', email);
    return true;
  } catch (error) {
    console.error('[AuthService] Password reset error:', error);
    return false;
  }
}

/**
 * Create or update user from Google OAuth
 */
export async function upsertGoogleUser(
  email: string,
  name: string,
  googleId: string
): Promise<{ userId: number; token: string; role: string } | null> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[AuthService] Database not available');
      return null;
    }

    // Find user by email
    let user = null;
    const emailResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (emailResult.length > 0) {
      user = emailResult[0];
    }

    if (!user) {
      // Create new user
      const result = await db.insert(users).values({
        email,
        name,
        loginMethod: 'google',
        role: 'user',
        lastSignedIn: new Date(),
      });
      const userId = Number((result as any).insertId || 0);

      // Get the created user
      const newUserResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      user = newUserResult[0];
    } else {
      // Update existing user
      await db.update(users)
        .set({
          loginMethod: 'google',
          lastSignedIn: new Date(),
        })
        .where(eq(users.id, user.id));
    }

    if (!user) {
      return null;
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    console.log('[AuthService] Google user upserted:', email);
    return { userId: user.id, token, role: user.role };
  } catch (error) {
    console.error('[AuthService] Google upsert error:', error);
    return null;
  }
}
