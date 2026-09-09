import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import type { NotificationAdapter, ScheduleNotificationOptions, BackgroundAlertsResult } from './types';

/**
 * Capacitor's LocalNotifications plugin requires a numeric id, but our
 * Time Anchors use UUID strings — this derives a stable positive 32-bit
 * integer from any string so the same anchor id always maps to the same
 * notification id (needed so cancelScheduled can find it again).
 */
function stableNumericId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export const nativeNotificationAdapter: NotificationAdapter = {
  platform: 'native',

  isSupported() {
    return true;
  },

  async requestPermission() {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  },

  async showNow(title: string, body: string) {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: stableNumericId(`${title}-${Date.now()}`),
          title,
          body,
          schedule: { at: new Date(Date.now() + 100) },
        },
      ],
    });
  },

  async scheduleAt({ id, title, body, at }: ScheduleNotificationOptions) {
    // A true OS-scheduled alarm-style notification — the Android system
    // itself wakes up and fires this at the given time, whether the app
    // is open, backgrounded, or fully killed. No server or cron needed.
    await LocalNotifications.schedule({
      notifications: [
        {
          id: stableNumericId(id),
          title,
          body,
          schedule: { at, allowWhileIdle: true },
          channelId: 'time_anchor',
        },
      ],
    });
  },

  async cancelScheduled(id: string) {
    await LocalNotifications.cancel({
      notifications: [{ id: stableNumericId(id) }],
    });
  },

  async enableBackgroundAlerts(_userId: string): Promise<BackgroundAlertsResult> {
    // TODO (Android/APK build): implement push-token registration.
    // 1. const perm = await PushNotifications.requestPermissions();
    //    if (perm.receive !== 'granted') return { ok: false, reason: 'denied' };
    // 2. await PushNotifications.register();
    // 3. PushNotifications.addListener('registration', (token) => {
    //      // send token.value + userId to a new `device_push_tokens` table
    //      // (separate from the web `push_subscriptions` table, since FCM
    //      // tokens and Web Push subscriptions are different shapes), then
    //      // extend send-time-anchor-push (or add a sibling function) to
    //      // send via FCM for rows that have a device token instead of a
    //      // Web Push subscription.
    //    });
    // Not actually needed for Time Anchor on native, since scheduleAt()
    // above already gives reliable OS-level delivery with no server
    // round-trip. This only matters if/when Onward adds *server-initiated*
    // native push (e.g. a coach message sent from elsewhere).
    void PushNotifications; // kept imported + type-checked for that future use
    return { ok: false, reason: 'unsupported' };
  },
};
