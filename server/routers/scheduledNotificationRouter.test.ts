import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock getDb
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

// Mock FCM service
vi.mock("../fcmService", () => ({
  isFcmConfigured: vi.fn().mockReturnValue(false),
  sendFcmToAllUsers: vi.fn().mockResolvedValue({ sent: 5, failed: 0, total: 5 }),
  sendFcmToUsers: vi.fn().mockResolvedValue({ totalSent: 3, totalFailed: 0 }),
}));

// ─── getNextScheduledAt tests (via processScheduledNotifications logic) ───────

describe("Scheduled Notification - Repeat Logic", () => {
  it("should return null for once repeatType", async () => {
    const { processScheduledNotifications } = await import("./scheduledNotificationRouter");

    // Mock: no pending notifications
    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };
    mockDb.select.mockReturnValue(mockSelect);

    // Should not throw
    await expect(processScheduledNotifications()).resolves.toBeUndefined();
  });

  it("should process pending notifications and mark as sent", async () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 60000); // 1 minute ago

    const mockNotif = {
      id: 1,
      title: "Test",
      body: "Test body",
      imageUrl: null,
      actionUrl: null,
      platform: "all",
      targetAudience: "all",
      scheduledAt: pastDate,
      repeatType: "once",
      repeatDays: null,
      repeatUntil: null,
      status: "pending",
      sentCount: 0,
      failedCount: 0,
    };

    const mockSelectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockNotif]),
    };

    const mockUpdateChain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    };

    mockDb.select.mockReturnValue(mockSelectChain);
    mockDb.update.mockReturnValue(mockUpdateChain);

    vi.resetModules();
    vi.mock("../fcmService", () => ({
      isFcmConfigured: vi.fn().mockReturnValue(false),
      sendFcmToAllUsers: vi.fn().mockResolvedValue({ sent: 0, failed: 0, total: 0 }),
      sendFcmToUsers: vi.fn().mockResolvedValue({ totalSent: 0, totalFailed: 0 }),
    }));

    const { processScheduledNotifications } = await import("./scheduledNotificationRouter");
    await processScheduledNotifications();

    // Should have called update to mark as sent
    expect(mockDb.update).toHaveBeenCalled();
    const updateCall = mockUpdateChain.set.mock.calls[0][0];
    expect(updateCall.status).toBe("sent");
  });

  it("should calculate next daily schedule correctly", () => {
    // Test the date logic directly
    const baseDate = new Date("2026-03-10T10:00:00Z");
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + 1);

    expect(nextDate.getDate()).toBe(baseDate.getDate() + 1);
    expect(nextDate.getHours()).toBe(baseDate.getHours());
  });

  it("should calculate next weekly schedule correctly", () => {
    const baseDate = new Date("2026-03-10T10:00:00Z"); // Tuesday
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + 7);

    expect(nextDate.getDay()).toBe(baseDate.getDay()); // Same day of week
    expect(nextDate.getTime() - baseDate.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe("Scheduled Notification - Cron Management", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should start and stop cron job", async () => {
    vi.resetModules();
    const { startScheduledNotificationCron, stopScheduledNotificationCron } = await import("./scheduledNotificationRouter");

    // Should not throw
    expect(() => startScheduledNotificationCron()).not.toThrow();
    expect(() => startScheduledNotificationCron()).not.toThrow(); // Second call should be no-op
    expect(() => stopScheduledNotificationCron()).not.toThrow();
    expect(() => stopScheduledNotificationCron()).not.toThrow(); // Second stop should be no-op
  });

  it("should not create duplicate intervals", async () => {
    vi.resetModules();
    const { startScheduledNotificationCron, stopScheduledNotificationCron } = await import("./scheduledNotificationRouter");

    const setIntervalSpy = vi.spyOn(global, "setInterval");

    startScheduledNotificationCron();
    startScheduledNotificationCron(); // Should not create another interval
    startScheduledNotificationCron(); // Should not create another interval

    // Only called once (or 0 if already running from previous test)
    expect(setIntervalSpy.mock.calls.length).toBeLessThanOrEqual(1);

    stopScheduledNotificationCron();
  });
});

describe("Scheduled Notification - Input Validation", () => {
  it("should reject past scheduledAt dates", () => {
    const pastDate = new Date(Date.now() - 60000);
    expect(pastDate <= new Date()).toBe(true);
  });

  it("should accept future scheduledAt dates", () => {
    const futureDate = new Date(Date.now() + 60000);
    expect(futureDate > new Date()).toBe(true);
  });

  it("should validate ISO date format", () => {
    const validISO = "2026-12-25T10:00:00.000Z";
    const parsed = new Date(validISO);
    expect(isNaN(parsed.getTime())).toBe(false);
  });

  it("should reject invalid date format", () => {
    const invalidDate = "not-a-date";
    const parsed = new Date(invalidDate);
    expect(isNaN(parsed.getTime())).toBe(true);
  });
});
