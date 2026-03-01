import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

/**
 * Rate Limit Configuration for RTransfer API
 * 
 * This module provides flexible rate limiting for different endpoints and user types.
 * - Development: More lenient limits for testing
 * - Production: Stricter limits for security
 * - Authenticated users: Higher limits
 * - Anonymous users: Lower limits
 */

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Custom error handler for rate limit exceeded
 */
const rateLimitHandler = (req: Request, res: Response) => {
  // Get rate limit info from headers
  const limit = res.getHeader("RateLimit-Limit") || "unknown";
  const remaining = res.getHeader("RateLimit-Remaining") || "0";
  const resetHeader = res.getHeader("RateLimit-Reset");
  
  // Calculate retry after time
  const resetTime = resetHeader ? new Date(Number(resetHeader) * 1000) : new Date(Date.now() + 60000);
  const retryAfter = Math.ceil((resetTime.getTime() - Date.now()) / 1000);
  
  // Set additional headers for better client handling
  res.setHeader("Retry-After", String(retryAfter));
  res.setHeader("X-RateLimit-Limit", String(limit));
  res.setHeader("X-RateLimit-Remaining", String(remaining));
  res.setHeader("X-RateLimit-Reset", resetTime.toISOString());
  
  // Log rate limit violation for monitoring
  console.log(`[Rate Limit] 429 response for ${req.method} ${req.path} - IP: ${req.ip} - Limit: ${limit}`);
  
  res.status(429).json({
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests. Please wait before trying again.",
      retryAfter,
      limit: Number(limit),
      remaining: Number(remaining),
      resetAt: resetTime.toISOString(),
      documentation: "https://fastlygo.mk/api-docs#rate-limiting",
    },
  });
};

/**
 * Skip rate limiting for successful requests
 * Only count failed requests to prevent abuse
 */
const skipSuccessfulRequests = true;

/**
 * Default rate limit for all tRPC endpoints
 * Development: 10000 requests per minute (very high)
 * Production: 10000 requests per minute (very high)
 */
export const defaultRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10000, // Very high limit - almost unlimited
  message: "Rate limit exceeded. Please wait a moment.",
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: rateLimitHandler,
  skipSuccessfulRequests,
  keyGenerator: (req) => ipKeyGenerator(req.ip || req.socket.remoteAddress || ''), // Use proper IPv6 handling
});

/**
 * Higher rate limit for authenticated users
 * Development: 20000 requests per minute (very high)
 * Production: 20000 requests per minute (very high)
 */
export const authenticatedRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20000, // Very high limit for authenticated users
  message: "Rate limit exceeded. Please wait a moment.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests,
  keyGenerator: (req) => ipKeyGenerator(req.ip || req.socket.remoteAddress || ''), // Use proper IPv6 handling
  skip: (req: Request) => {
    // Only apply to authenticated requests
    return !req.headers.authorization;
  },
});

/**
 * Strict rate limit for sensitive endpoints (login, register, etc.)
 * Development: 1000 requests per minute (high)
 * Production: 1000 requests per minute (high)
 */
export const strictRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // High limit even for sensitive endpoints
  message: "Too many attempts. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: false, // Count all requests for sensitive endpoints
  keyGenerator: (req) => ipKeyGenerator(req.ip || req.socket.remoteAddress || ''), // Use proper IPv6 handling
});

/**
 * Lenient rate limit for frequently accessed endpoints (e.g., orders.getMyOrders)
 * Development: 50000 requests per minute (extremely high)
 * Production: 50000 requests per minute (extremely high)
 */
export const lenientRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50000, // Extremely high limit for frequently accessed endpoints
  message: "Rate limit exceeded. Please wait a moment.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests,
  keyGenerator: (req) => ipKeyGenerator(req.ip || req.socket.remoteAddress || ''), // Use proper IPv6 handling
});

/**
 * Conditional rate limiter that applies different limits based on authentication
 */
export const conditionalRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const isAuthenticated = !!req.headers.authorization;
  
  if (isAuthenticated) {
    return authenticatedRateLimit(req, res, next);
  } else {
    return defaultRateLimit(req, res, next);
  }
};

/**
 * Log rate limit info for debugging
 */
export const logRateLimitInfo = () => {
  console.log("[Rate Limit] Configuration (Very High Limits):");
  console.log(`  - Environment: ${isDevelopment ? "Development" : "Production"}`);
  console.log(`  - Default: 10,000 req/min`);
  console.log(`  - Authenticated: 20,000 req/min`);
  console.log(`  - Lenient: 50,000 req/min`);
  console.log(`  - Strict: 1,000 req/min`);
};
