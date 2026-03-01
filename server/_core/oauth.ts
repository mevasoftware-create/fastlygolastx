import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

// OAuth routes are disabled - using email/password auth instead
export function registerOAuthRoutes(_app: Express) {
  // OAuth callback is not used in this version
  // Authentication is handled via email/password in authRouter.ts
}
