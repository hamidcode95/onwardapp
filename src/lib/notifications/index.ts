import { Capacitor } from '@capacitor/core';
import type { NotificationAdapter } from './types';
import { webNotificationAdapter } from './webAdapter';
import { nativeNotificationAdapter } from './nativeAdapter';

/**
 * The single notification entry point for the whole app. Resolves once,
 * at load time, to whichever adapter matches how the app is running —
 * a browser tab/PWA, or the Capacitor-wrapped Android app.
 */
export const notifications: NotificationAdapter = Capacitor.isNativePlatform()
  ? nativeNotificationAdapter
  : webNotificationAdapter;

export type { NotificationAdapter, ScheduleNotificationOptions, BackgroundAlertsResult } from './types';
