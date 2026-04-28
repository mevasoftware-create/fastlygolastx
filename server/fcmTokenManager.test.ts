/**
 * FCM Token Manager Test
 * FCM_SERVICE_ACCOUNT_JSON secret'ının doğru yapılandırıldığını ve
 * Google Auth'tan token alınabildiğini doğrular.
 */

import { describe, it, expect } from "vitest";
import { getFcmAccessToken, getFcmTokenStatus, isFcmAvailable } from "./fcmTokenManager";

describe("FCM Token Manager", () => {
  it("FCM_SERVICE_ACCOUNT_JSON veya FCM_ACCESS_TOKEN mevcut olmalı", () => {
    const available = isFcmAvailable();
    expect(available).toBe(true);
  });

  it("FCM token durumu configured olmalı", async () => {
    const status = await getFcmTokenStatus();
    expect(status.configured).toBe(true);
    expect(status.method).not.toBe("none");
  });

  it("Service Account JSON varsa method service_account olmalı", async () => {
    if (process.env.FCM_SERVICE_ACCOUNT_JSON) {
      const status = await getFcmTokenStatus();
      expect(status.method).toBe("service_account");
    }
  });

  it("FCM access token alınabilmeli (null olmamalı)", async () => {
    const token = await getFcmAccessToken();
    expect(token).not.toBeNull();
    expect(typeof token).toBe("string");
    expect(token!.length).toBeGreaterThan(10);
  });
});
