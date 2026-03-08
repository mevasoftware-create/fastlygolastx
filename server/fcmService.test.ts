import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("FCM Service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Set environment variables for tests
    process.env.FCM_PROJECT_ID = "fastlygo1";
    process.env.FCM_ACCESS_TOKEN = "test-access-token";
  });

  it("should return configured=true when FCM_ACCESS_TOKEN is set", async () => {
    const { isFcmConfigured } = await import("./fcmService");
    expect(isFcmConfigured()).toBe(true);
  });

  it("should return configured=false when FCM_ACCESS_TOKEN is not set", async () => {
    delete process.env.FCM_ACCESS_TOKEN;
    // Re-import to get fresh state
    vi.resetModules();
    const { isFcmConfigured } = await import("./fcmService");
    expect(isFcmConfigured()).toBe(false);
    // Restore
    process.env.FCM_ACCESS_TOKEN = "test-access-token";
  });

  it("should send FCM notification successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: "projects/fastlygo1/messages/12345" }),
    });

    vi.resetModules();
    const { sendFcmToToken } = await import("./fcmService");
    
    const result = await sendFcmToToken(
      "test-device-token",
      { title: "Test", body: "Test body" },
      "android"
    );

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://fcm.googleapis.com/v1/projects/fastlygo1/messages:send",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-access-token",
        }),
      })
    );
  });

  it("should handle invalid token error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({
        error: {
          message: "Requested entity was not found.",
          status: "UNREGISTERED",
        },
      }),
    });

    vi.resetModules();
    const { sendFcmToToken } = await import("./fcmService");
    
    const result = await sendFcmToToken(
      "invalid-device-token",
      { title: "Test", body: "Test body" },
      "android"
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("TOKEN_INVALID:");
  });

  it("should handle auth expired error (401)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          message: "Request had invalid authentication credentials.",
          status: "UNAUTHENTICATED",
        },
      }),
    });

    vi.resetModules();
    const { sendFcmToToken } = await import("./fcmService");
    
    const result = await sendFcmToToken(
      "some-device-token",
      { title: "Test", body: "Test body" },
      "android"
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("AUTH_EXPIRED:");
  });

  it("should return error when FCM_ACCESS_TOKEN is not configured", async () => {
    delete process.env.FCM_ACCESS_TOKEN;
    vi.resetModules();
    const { sendFcmToToken } = await import("./fcmService");
    
    const result = await sendFcmToToken(
      "some-device-token",
      { title: "Test", body: "Test body" },
      "android"
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("FCM_ACCESS_TOKEN not configured");
    
    // Restore
    process.env.FCM_ACCESS_TOKEN = "test-access-token";
  });
});
