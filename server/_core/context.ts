import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import * as authService from "./authService";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  isMobileApp: boolean;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  
  // Detect mobile app requests by User-Agent header
  const userAgent = opts.req.headers['user-agent'] || '';
  const isMobileApp = /RTransfer|FastlyGo|Mobile|Android|iPhone|iPad|Expo/.test(userAgent);

  try {
    // Try Authorization header first (for localStorage-based auth)
    const authHeader = opts.req.headers.authorization;
    console.log('[Context] Authorization header:', authHeader ? 'present' : 'missing');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('[Context] Token from header:', token.substring(0, 20) + '...');
      const payload = authService.verifyToken(token);
      console.log('[Context] Token payload:', payload);
      
      if (payload && payload.userId) {
        const foundUser = await db.getUserById(payload.userId);
        user = foundUser || null;
        console.log('[Context] User from token:', user ? user.email : 'not found');
      }
    }
    
    // Fallback to cookie-based auth if no Authorization header
    if (!user) {
      const sessionToken = opts.req.cookies[COOKIE_NAME];
      
      if (sessionToken) {
        const payload = authService.verifyToken(sessionToken);
        
        if (payload && payload.userId) {
          const foundUser = await db.getUserById(payload.userId);
          user = foundUser || null;
        }
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    isMobileApp,
  };
}
