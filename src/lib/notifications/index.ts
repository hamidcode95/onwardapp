import type { NotificationAdapter } from './types';
import { webNotificationAdapter } from './webAdapter';
import { nativeNotificationAdapter } from './nativeAdapter';

function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

/**
 * The single notification entry point for the whole app. Resolves once,
 * at load time, to whichever adapter matches how the app is running —
 * a browser tab or the future Capacitor-wrapped Android app.
 */
export const notifications: NotificationAdapter = isNativePlatform()
  ? nativeNotificationAdapter
  : webNotificationAdapter;

export type { NotificationAdapter, ScheduleNotificationOptions, BackgroundAlertsResult } from './types';
