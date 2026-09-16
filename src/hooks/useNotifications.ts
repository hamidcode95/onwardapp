import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface MessagePair { title: string; body: string }

function getRandomMessage(messages: MessagePair[]) {
  return messages[Math.floor(Math.random() * messages.length)];
}

const SETTINGS_KEY = 'onward-notification-settings';

export interface NotificationSettings {
  motivationEnabled: boolean;
  focusRemindersEnabled: boolean;
  motivationIntervalMin: number; // minutes
  focusReminderIntervalMin: number; // minutes
}

const DEFAULT_SETTINGS: NotificationSettings = {
  motivationEnabled: true,
  focusRemindersEnabled: true,
  motivationIntervalMin: 20,
  focusReminderIntervalMin: 45,
};

export function loadNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // Corrupt or unreadable localStorage — fall back to defaults.
  }
  return DEFAULT_SETTINGS;
}

export function saveNotificationSettings(settings: NotificationSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

import { notifications } from '@/lib/notifications';

export function useNotifications() {
  const { t } = useTranslation();

  const requestPermission = useCallback(async () => {
    return notifications.requestPermission();
  }, []);

  const sendPushNotification = useCallback((title: string, body: string) => {
    notifications.showNow(title, body);
  }, []);

  const sendToast = useCallback((title: string, body: string, type: 'info' | 'success' | 'warning' = 'info') => {
    switch (type) {
      case 'success': toast.success(title, { description: body }); break;
      case 'warning': toast.warning(title, { description: body }); break;
      default: toast(title, { description: body });
    }
  }, []);

  const notify = useCallback((title: string, body: string, type: 'info' | 'success' | 'warning' = 'info') => {
    sendToast(title, body, type);
    // Always fire the system notification too, not just when the tab is
    // hidden. The old `if (document.hidden)` guard was self-defeating:
    // these are driven by setInterval, which browsers throttle or suspend
    // precisely when the tab IS hidden — so the branch that was supposed
    // to deliver a real notification almost never ran, and reminders
    // appeared to be toast-only/decorative. Sonner's toast is harmless
    // when the app is in the foreground, and the system notification is
    // what makes the reminder reachable when it isn't.
    sendPushNotification(title, body);
  }, [sendToast, sendPushNotification]);

  const notifyTaskComplete = useCallback(() => {
    const messages = t('toasts.taskComplete', { returnObjects: true }) as MessagePair[];
    const msg = getRandomMessage(messages);
    notify(msg.title, msg.body, 'success');
  }, [notify, t]);

  const notifyFocusComplete = useCallback((minutes: number) => {
    const title = t('toasts.focusSessionCompleteTitle');
    const body = t('toasts.focusSessionCompleteBody', { minutes });
    notify(title, body, 'success');
    sendPushNotification(title, body);
  }, [notify, sendPushNotification, t]);

  const stopAllReminders = useCallback(() => {
    focusDueAtRef.current = null;
    motivationDueAtRef.current = null;
  }, []);

  // Reminders are driven by a due-timestamp compared against the wall
  // clock, not by trusting setInterval to have fired on schedule. A
  // backgrounded/throttled tab used to mean a 20-minute reminder might
  // arrive an hour late (or never); now the ticker below simply checks
  // "is now past due?" every 15s, and a resync on visibilitychange makes
  // a returning user get anything that came due while they were away.
  const motivationDueAtRef = useRef<number | null>(null);
  const focusDueAtRef = useRef<number | null>(null);

  const startMotivationLoop = useCallback((intervalMin?: number) => {
    const settings = loadNotificationSettings();
    if (!settings.motivationEnabled) { motivationDueAtRef.current = null; return; }
    const mins = intervalMin ?? settings.motivationIntervalMin;
    motivationDueAtRef.current = Date.now() + mins * 60 * 1000;
  }, []);

  const startFocusReminders = useCallback((intervalMin?: number) => {
    const settings = loadNotificationSettings();
    if (!settings.focusRemindersEnabled) { focusDueAtRef.current = null; return; }
    const mins = intervalMin ?? settings.focusReminderIntervalMin;
    focusDueAtRef.current = Date.now() + mins * 60 * 1000;
  }, []);

  // Single ticker serving both reminder kinds.
  useEffect(() => {
    const check = () => {
      const now = Date.now();
      const settings = loadNotificationSettings();

      if (settings.motivationEnabled && motivationDueAtRef.current !== null && now >= motivationDueAtRef.current) {
        const messages = t('toasts.motivational', { returnObjects: true }) as MessagePair[];
        const msg = getRandomMessage(messages);
        notify(msg.title, msg.body);
        motivationDueAtRef.current = now + settings.motivationIntervalMin * 60 * 1000;
      }

      if (settings.focusRemindersEnabled && focusDueAtRef.current !== null && now >= focusDueAtRef.current) {
        const messages = t('toasts.focusReminders', { returnObjects: true }) as MessagePair[];
        const msg = getRandomMessage(messages);
        notify(msg.title, msg.body, 'warning');
        focusDueAtRef.current = now + settings.focusReminderIntervalMin * 60 * 1000;
      }
    };

    const ticker = setInterval(check, 15 * 1000);
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(ticker);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [notify, t]);

  const applySettings = useCallback((settings: NotificationSettings) => {
    saveNotificationSettings(settings);
    stopAllReminders();
    if (settings.motivationEnabled) startMotivationLoop(settings.motivationIntervalMin);
    if (settings.focusRemindersEnabled) startFocusReminders(settings.focusReminderIntervalMin);
  }, [stopAllReminders, startMotivationLoop, startFocusReminders]);

  return {
    requestPermission,
    notify,
    notifyTaskComplete,
    notifyFocusComplete,
    startMotivationLoop,
    startFocusReminders,
    stopAllReminders,
    applySettings,
    sendToast,
  };
}
