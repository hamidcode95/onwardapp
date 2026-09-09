import type { NotificationAdapter, ScheduleNotificationOptions, BackgroundAlertsResult } from './types';
import { isPushSupported, subscribeToPush } from '@/lib/push';

export const webNotificationAdapter: NotificationAdapter = {
  platform: 'web',

  isSupported() {
    return 'Notification' in window;
  },

  async requestPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const result = await Notification.requestPermission();
    return result === 'granted';
  },

  async showNow(title: string, body: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon-192.png', badge: '/icon-192.png' });
    }
  },

  async scheduleAt(_options: ScheduleNotificationOptions) {
    // No-op by design on web: the Time Anchor is mirrored to Supabase
    // (see src/lib/anchorSync.ts) and send-time-anchor-push fires the
    // real Web Push at the right time. This method exists so calling
    // code doesn't need an if/else on platform.
  },

  async cancelScheduled(_id: string) {
    // Same as above — cancellation on web happens by updating/deleting
    // the Supabase row (see anchorSync.ts), not through this adapter.
  },

  async enableBackgroundAlerts(userId: string): Promise<BackgroundAlertsResult> {
    if (!isPushSupported()) return { ok: false, reason: 'unsupported' };
    const result = await subscribeToPush(userId);
    if (result.ok) return { ok: true };
    return { ok: false, reason: 'reason' in result ? result.reason : 'unsupported' };
  },
};
