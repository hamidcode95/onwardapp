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
  } catch {}
  return DEFAULT_SETTINGS;
}

export function saveNotificationSettings(settings: NotificationSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

import { notifications } from '@/lib/notifications';

export function useNotifications() {
  const { t } = useTranslation();
  const focusReminderRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const motivationRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    if (document.hidden) sendPushNotification(title, body);
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
    if (focusReminderRef.current) { clearInterval(focusReminderRef.current); focusReminderRef.current = null; }
    if (motivationRef.current) { clearInterval(motivationRef.current); motivationRef.current = null; }
  }, []);

  const startMotivationLoop = useCallback((intervalMin?: number) => {
    if (motivationRef.current) clearInterval(motivationRef.current);
    const settings = loadNotificationSettings();
    if (!settings.motivationEnabled) { motivationRef.current = null; return; }
    const mins = intervalMin ?? settings.motivationIntervalMin;
    motivationRef.current = setInterval(() => {
      const messages = t('toasts.motivational', { returnObjects: true }) as MessagePair[];
      const msg = getRandomMessage(messages);
      notify(msg.title, msg.body);
    }, mins * 60 * 1000);
  }, [notify, t]);

  const startFocusReminders = useCallback((intervalMin?: number) => {
    if (focusReminderRef.current) clearInterval(focusReminderRef.current);
    const settings = loadNotificationSettings();
    if (!settings.focusRemindersEnabled) { focusReminderRef.current = null; return; }
    const mins = intervalMin ?? settings.focusReminderIntervalMin;
    focusReminderRef.current = setInterval(() => {
      const messages = t('toasts.focusReminders', { returnObjects: true }) as MessagePair[];
      const msg = getRandomMessage(messages);
      notify(msg.title, msg.body, 'warning');
    }, mins * 60 * 1000);
  }, [notify, t]);

  const applySettings = useCallback((settings: NotificationSettings) => {
    saveNotificationSettings(settings);
    stopAllReminders();
    if (settings.motivationEnabled) startMotivationLoop(settings.motivationIntervalMin);
    if (settings.focusRemindersEnabled) startFocusReminders(settings.focusReminderIntervalMin);
  }, [stopAllReminders, startMotivationLoop, startFocusReminders]);

  useEffect(() => {
    return () => stopAllReminders();
  }, [stopAllReminders]);

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
