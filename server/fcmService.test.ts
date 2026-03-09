import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock fcmTokenManager
vi.mock("./fcmTokenManager", () => ({
  getFcmAccessToken: vi.fn().mockResolvedValue("test-access-token"),
  isFcmAvailable: vi.fn().mockReturnValue(true),
  getFcmTokenStatus: vi.fn().mockResolvedValue({
    configured: true,
    method: "manual_token",
    tokenValid: true,
    expiresIn: null,
  }),
  initFcmTokenManager: vi.fn().mockResolvedValue(undefined),
}));

describe("FCM Service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Set environment variables for tests
    process.env.FCM_PROJECT_ID = "fastlygo1";
    process.env.FCM_ACCESS_TOKEN = "test-access-token";

    // Re-apply mocks after reset
    const { getFcmAccessToken, isFcmAvailable } = require("./fcmTokenManager");
    (getFcmAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue("test-access-token");
    (isFcmAvailable as ReturnType<typeof vi.fn>).mockReturnValue(true);
  });

  it("should return configured=true when FCM is available", async () => {
    const { isFcmConfigured } = await import("./fcmService");
    expect(isFcmConfigured()).toBe(true);
  });

  it("should return configured=false when FCM is not available", async () => {
    const { isFcmAvailable } = await import("./fcmTokenManager");
    (isFcmAvailable as ReturnType<typeof vi.fn>).mockReturnValue(false);

    vi.resetModules();
    vi.mock("./fcmTokenManager", () => ({
      getFcmAccessToken: vi.fn().mockResolvedValue(null),
      isFcmAvailable: vi.fn().mockReturnValue(false),
      getFcmTokenStatus: vi.fn().mockResolvedValue({ configured: false, method: "none", tokenValid: false, expiresIn: null }),
      initFcmTokenManager: vi.fn().mockResolvedValue(undefined),
    }));
    const { isFcmConfigured } = await import("./fcmService");
    expect(isFcmConfigured()).toBe(false);
  });

  it("should send FCM notification successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: "projects/fastlygo1/messages/12345" }),
    });

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

  it("should handle invalid token error (UNREGISTERED)", async () => {
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

    const { sendFcmToToken } = await import("./fcmService");

    const result = await sendFcmToToken(
      "some-device-token",
      { title: "Test", body: "Test body" },
      "android"
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("AUTH_EXPIRED:");
  });

  it("should return error when FCM access token is null", async () => {
    const { getFcmAccessToken } = await import("./fcmTokenManager");
    (getFcmAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const { sendFcmToToken } = await import("./fcmService");

    const result = await sendFcmToToken(
      "some-device-token",
      { title: "Test", body: "Test body" },
      "android"
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("FCM not configured (no access token)");
  });

  it("should build correct message payload for iOS", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: "projects/fastlygo1/messages/12345" }),
    });

    const { sendFcmToToken } = await import("./fcmService");

    await sendFcmToToken(
      "ios-device-token",
      { title: "iOS Test", body: "iOS body", imageUrl: "https://example.com/img.png" },
      "ios"
    );

    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);

    expect(body.message.apns).toBeDefined();
    expect(body.message.apns.headers["apns-priority"]).toBe("10");
    expect(body.message.notification.image).toBe("https://example.com/img.png");
  });

  it("should build correct message payload for Android", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: "projects/fastlygo1/messages/12345" }),
    });

    const { sendFcmToToken } = await import("./fcmService");

    await sendFcmToToken(
      "android-device-token",
      { title: "Android Test", body: "Android body", data: { orderId: "123" } },
      "android"
    );

    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);

    expect(body.message.android).toBeDefined();
    expect(body.message.android.priority).toBe("high");
    expect(body.message.data.orderId).toBe("123");
  });
});

describe("FCM Token Manager", () => {
  it("should report configured=true when FCM_ACCESS_TOKEN is set", async () => {
    process.env.FCM_ACCESS_TOKEN = "test-token-123";
    delete process.env.FCM_SERVICE_ACCOUNT_JSON;

    vi.resetModules();
    const { isFcmAvailable } = await import("./fcmTokenManager");
    expect(isFcmAvailable()).toBe(true);
  });

  it("should report configured=false when no token is set", async () => {
    delete process.env.FCM_ACCESS_TOKEN;
    delete process.env.FCM_SERVICE_ACCOUNT_JSON;

    vi.resetModules();
    const { isFcmAvailable } = await import("./fcmTokenManager");
    expect(isFcmAvailable()).toBe(false);
  });

  it("should return token status with method=manual_token", async () => {
    process.env.FCM_ACCESS_TOKEN = "manual-token-abc";
    delete process.env.FCM_SERVICE_ACCOUNT_JSON;

    vi.resetModules();
    const { getFcmTokenStatus } = await import("./fcmTokenManager");
    const status = await getFcmTokenStatus();

    expect(status.configured).toBe(true);
    expect(status.method).toBe("manual_token");
    expect(status.tokenValid).toBe(true);
  });
});
