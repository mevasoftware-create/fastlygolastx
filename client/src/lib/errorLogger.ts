import { trpc } from "./trpc";

export interface LogErrorOptions {
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  url?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an error to the backend
 * This function is safe to call - it won't throw errors
 */
export async function logError(error: Error | string, metadata?: Record<string, any>) {
  try {
    const errorMessage = typeof error === "string" ? error : error.message;
    const stackTrace = typeof error === "string" ? undefined : error.stack;
    const errorType = typeof error === "string" ? "Error" : error.name;

    // Get current URL
    const url = window.location.href;
    const userAgent = navigator.userAgent;

    // Don't block the UI - fire and forget
    fetch("/api/trpc/errorLogs.logFrontendError", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        errorType,
        errorMessage,
        stackTrace,
        url,
        userAgent,
        metadata,
      }),
      // Don't wait for response
      keepalive: true,
    }).catch((err) => {
      // Silently fail - we don't want error logging to break the app
      console.error("[ErrorLogger] Failed to log error:", err);
    });
  } catch (err) {
    // Silently fail
    console.error("[ErrorLogger] Failed to prepare error log:", err);
  }
}

/**
 * Log a network error
 */
export function logNetworkError(
  url: string,
  statusCode: number,
  errorMessage: string,
  metadata?: Record<string, any>
) {
  logError(new Error(errorMessage), {
    ...metadata,
    type: "NetworkError",
    url,
    statusCode,
  });
}

/**
 * Log a validation error
 */
export function logValidationError(field: string, message: string, metadata?: Record<string, any>) {
  logError(new Error(`Validation error: ${field} - ${message}`), {
    ...metadata,
    type: "ValidationError",
    field,
  });
}

/**
 * Log a user action error
 */
export function logUserActionError(action: string, error: Error | string, metadata?: Record<string, any>) {
  logError(error, {
    ...metadata,
    type: "UserActionError",
    action,
  });
}
