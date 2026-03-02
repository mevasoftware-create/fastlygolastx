/**
 * SEO Middleware - COMPLETELY DISABLED
 * Manus auto-generated SEO injection is fully disabled.
 * Custom SEO is handled by the site itself (react-helmet-async etc.)
 */
import { Request, Response, NextFunction } from "express";

export function seoMiddleware(req: Request, res: Response, next: NextFunction) {
  next();
}
