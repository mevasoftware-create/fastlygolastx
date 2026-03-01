import { getDb } from "./db";
import { errorLogs, InsertErrorLog } from "../drizzle/schema";

export interface LogErrorParams {
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  userId?: number;
  userEmail?: string;
  url?: string;
  userAgent?: string;
  source: "frontend" | "backend" | "api";
  severity?: "low" | "medium" | "high" | "critical";
  statusCode?: number;
  metadata?: Record<string, any>;
}

/**
 * Log an error to the database
 */
export async function logError(params: LogErrorParams): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[ErrorLogger] Database not available, error not logged:", params);
      return;
    }

    const errorLog: InsertErrorLog = {
      errorType: params.errorType,
      errorMessage: params.errorMessage,
      stackTrace: params.stackTrace,
      userId: params.userId,
      userEmail: params.userEmail,
      url: params.url,
      userAgent: params.userAgent,
      source: params.source,
      severity: params.severity || "medium",
      statusCode: params.statusCode,
      resolved: false,
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
    };

    await db.insert(errorLogs).values(errorLog);
    
    // Log critical errors to console as well
    if (params.severity === "critical") {
      console.error("[CRITICAL ERROR]", {
        type: params.errorType,
        message: params.errorMessage,
        url: params.url,
        userId: params.userId,
      });
    }
  } catch (error) {
    // Don't throw - we don't want error logging to break the app
    console.error("[ErrorLogger] Failed to log error:", error);
  }
}

/**
 * Log a tRPC error
 */
export async function logTRPCError(
  error: any,
  ctx: { user?: { id: number; email?: string | null } },
  path: string,
  input?: any
): Promise<void> {
  const errorType = error.code || error.name || "TRPCError";
  const statusCode = getStatusCodeFromTRPCError(error.code);
  
  await logError({
    errorType,
    errorMessage: error.message || "Unknown tRPC error",
    stackTrace: error.stack,
    userId: ctx.user?.id,
    userEmail: ctx.user?.email || undefined,
    url: `/api/trpc/${path}`,
    source: "api",
    severity: getSeverityFromStatusCode(statusCode),
    statusCode,
    metadata: {
      path,
      input: input ? JSON.stringify(input).substring(0, 1000) : undefined, // Limit size
      code: error.code,
    },
  });
}

/**
 * Log a frontend error
 */
export async function logFrontendError(params: {
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  url?: string;
  userAgent?: string;
  userId?: number;
  userEmail?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  await logError({
    ...params,
    source: "frontend",
    severity: "medium",
  });
}

/**
 * Helper to get HTTP status code from tRPC error code
 */
function getStatusCodeFromTRPCError(code?: string): number {
  const codeMap: Record<string, number> = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    TIMEOUT: 408,
    CONFLICT: 409,
    PRECONDITION_FAILED: 412,
    PAYLOAD_TOO_LARGE: 413,
    METHOD_NOT_SUPPORTED: 405,
    UNPROCESSABLE_CONTENT: 422,
    TOO_MANY_REQUESTS: 429,
    CLIENT_CLOSED_REQUEST: 499,
    INTERNAL_SERVER_ERROR: 500,
  };
  
  return code ? (codeMap[code] || 500) : 500;
}

/**
 * Helper to determine severity from status code
 */
function getSeverityFromStatusCode(statusCode: number): "low" | "medium" | "high" | "critical" {
  if (statusCode >= 500) return "critical";
  if (statusCode >= 400 && statusCode < 500) return "medium";
  return "low";
}
