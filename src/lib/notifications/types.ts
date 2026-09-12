/**
 * The rest of the app should only ever import `notifications` from
 * `@/lib/notifications` and talk to it through this interface. It never
 * touches the browser Notification API, service worker, or Capacitor
 * plugins directly — that keeps platform-specific code contained to a
 * single adapter file each.
 *
 * When the Android (APK) build is added via Capacitor, only
 * `nativeAdapter.ts` needs real implementation work — every screen and
 * hook that already calls `notifications.xxx()` keeps working unchanged.
 */

export interface ScheduleNotificationOptions {
  /** Stable id (e.g. the Time Anchor's id) so it can be cancelled/updated later. */
  id: string;
  title: string;
  body: string;
  /** When it should fire. */
  at: Date;
  /**
   * Arbitrary payload carried with the notification so the app can tell
   * what it was about when the user taps it later (e.g.
   * `{ type: 'time-anchor', anchorId }`). Not yet wired to an interaction
   * handler on native — see nativeAdapter.ts.
   */
  data?: Record<string, unknown>;
}

export type BackgroundAlertsResult =
  | { ok: true }
  | { ok: false; reason: 'unsupported' | 'denied' | string };

export interface NotificationAdapter {
  readonly platform: 'web' | 'native';

  isSupported(): boolean;

  /** Prompts the OS/browser permission dialog if needed. */
  requestPermission(): Promise<boolean>;

  /** Shows a notification immediately (used for in-app foreground alerts). */
  showNow(title: string, body: string): Promise<void>;

  /**
   * Schedules a notification for a future time.
   * - Web: best-effort — the real scheduling lives server-side (Supabase
   *   table + cron + Web Push), this call is a no-op hook kept for
   *   interface parity.
   * - Native: a true OS-scheduled local notification via Capacitor, which
   *   fires reliably even if the app was force-closed — no server or
   *   network needed.
   */
  scheduleAt(options: ScheduleNotificationOptions): Promise<void>;

  /** Cancels a previously scheduled notification by id. */
  cancelScheduled(id: string): Promise<void>;

  /**
   * Cancels every notification this adapter currently has scheduled.
   * Web: no-op — Web's real scheduling state lives server-side (the
   * `time_anchors` table), so "cancel all" there is a data operation
   * (delete/dismiss the rows), not a notification-layer one.
   * Native: cancels every pending local notification.
   */
  cancelAll(): Promise<void>;

  /**
   * Opts this device in to receive alerts for `userId` even when the app
   * isn't open. Web: subscribes to Web Push and stores it in Supabase.
   * Native: registers for push (FCM) — see nativeAdapter.ts TODOs.
   */
  enableBackgroundAlerts(userId: string): Promise<BackgroundAlertsResult>;
}
