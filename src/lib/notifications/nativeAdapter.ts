import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import type { NotificationAdapter, ScheduleNotificationOptions, BackgroundAlertsResult } from './types';

const TIME_ANCHOR_CHANNEL_ID = 'time_anchor';

/**
 * Capacitor's LocalNotifications plugin requires a numeric id, but our
 * Time Anchors use UUID strings — this derives a stable positive 32-bit
 * integer from any string so the same anchor id always maps to the same
 * notification id (needed so cancelScheduled can find it again).
 *
 * Two things worth knowing about this hash, rather than pretending it's
 * perfect:
 * - Collisions are theoretically possible (it's a 32-bit hash of an
 *   unbounded string space), but for a personal reminder feature where a
 *   user realistically has dozens of anchors rather than tens of
 *   thousands, the odds are negligible. A per-device collision-checking
 *   registry would be real complexity added to solve a problem this
 *   feature doesn't actually have.
 * - `hash | 0` keeps every intermediate value within the signed 32-bit
 *   range, but `Math.abs(-2147483648)` (Int32.MIN_VALUE) evaluates to
 *   2147483648 in JS — one past the maximum valid signed 32-bit value
 *   Android notification IDs allow. That single input is clamped below
 *   instead of silently handing Android an out-of-range id.
 */
function stableNumericId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  if (hash === -2147483648) return 2147483647;
  return Math.abs(hash);
}

// ---------------------------------------------------------------------------
// Android notification channel (created once, lazily, before it's first
// needed — not on every render, and not at module load time either, since
// that would run even on Web where this module still gets bundled).
// ---------------------------------------------------------------------------
let timeAnchorChannelReady = false;

async function ensureTimeAnchorChannel(): Promise<void> {
  if (timeAnchorChannelReady) return;
  timeAnchorChannelReady = true;
  try {
    await LocalNotifications.createChannel({
      id: TIME_ANCHOR_CHANNEL_ID,
      name: 'Time Anchor Reminders',
      description: 'Alerts for your scheduled Time Anchors',
      importance: 4, // HIGH — heads-up alert, appropriate for a time-sensitive reminder
      visibility: 1, // PUBLIC — fine to show on the lock screen
    });
  } catch (err) {
    // createChannel is Android-only; on other platforms (or if it's
    // somehow called twice natively) this shouldn't block scheduling.
    timeAnchorChannelReady = false;
    console.warn('[notifications] Failed to create time_anchor channel:', err);
  }
}

// ---------------------------------------------------------------------------
// Exact alarm capability (Android 12+ requires the user to explicitly grant
// "Alarms & reminders" for an app to get exact-time delivery; without it,
// Android silently batches the notification into its normal Doze/App
// Standby windows instead of firing at the precise scheduled minute).
// ---------------------------------------------------------------------------
let exactAlarmPromptShownThisSession = false;

async function ensureExactAlarmCapability(): Promise<void> {
  try {
    const status = await LocalNotifications.checkExactNotificationSetting();
    if (status.exact_alarm === 'granted') return;

    console.warn(
      `[notifications] Exact alarms are not granted (state: ${status.exact_alarm}). ` +
        'This Time Anchor may fire later than its scheduled time — Android can batch ' +
        'it into its normal Doze/App Standby windows instead of an exact wake-up.',
    );

    // Ask at most once per app session. Re-opening Android's system
    // settings screen every single time a Time Anchor is scheduled would
    // be worse UX than an occasionally-late reminder.
    if (!exactAlarmPromptShownThisSession) {
      exactAlarmPromptShownThisSession = true;
      await LocalNotifications.changeExactNotificationSetting();
    }
  } catch (err) {
    // Android-only API; can throw on platforms/versions that don't support
    // it. Never let that block actually scheduling the notification.
    console.warn('[notifications] Could not check exact alarm setting:', err);
  }
}

// ---------------------------------------------------------------------------
// Notification tap handling — attached at most once, regardless of how many
// times onNotificationTap() below is called. Also covers the case where the
// tap itself is what launched/resumed the app: Capacitor buffers the
// triggering action and delivers it to the first listener registered after
// the plugin initializes, so attaching this eagerly (Index.tsx does so on
// mount) is enough — no separate "was the app cold-started by a tap?" check
// is needed.
// ---------------------------------------------------------------------------
let tapListenerAttached = false;
let currentTapCallback: ((data: Record<string, unknown>) => void) | null = null;

function attachTapListenerOnce(): void {
  if (tapListenerAttached) return;
  tapListenerAttached = true;
  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const data = action.notification.extra as Record<string, unknown> | undefined;
    if (data && currentTapCallback) currentTapCallback(data);
  });
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

  async scheduleAt({ id, title, body, at, data }: ScheduleNotificationOptions) {
    // A true OS-scheduled alarm-style notification — the Android system
    // itself wakes up and fires this at the given time, whether the app
    // is open, backgrounded, or fully killed. No server or cron needed.
    await ensureTimeAnchorChannel();
    await ensureExactAlarmCapability();
    await LocalNotifications.schedule({
      notifications: [
        {
          id: stableNumericId(id),
          title,
          body,
          schedule: { at, allowWhileIdle: true },
          channelId: TIME_ANCHOR_CHANNEL_ID,
          extra: data,
        },
      ],
    });
  },

  async cancelScheduled(id: string) {
    await LocalNotifications.cancel({
      notifications: [{ id: stableNumericId(id) }],
    });
  },

  async cancelAll() {
    await LocalNotifications.cancelAll();
  },

  onNotificationTap(callback) {
    currentTapCallback = callback;
    attachTapListenerOnce();
  },

  async enableBackgroundAlerts(_userId: string): Promise<BackgroundAlertsResult> {
    // TODO (next milestone): implement push-token registration.
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
