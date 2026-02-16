import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

// Oly motivational messages
const MOTIVATION_MESSAGES = [
  { title: '🌟 Oly میگه:', body: 'داری عالی پیش میری! ادامه بده!' },
  { title: '💪 آفرین!', body: 'هر قدم کوچیک مهمه. تو فوق‌العاده‌ای!' },
  { title: '🧠 یادآوری Oly:', body: 'نفس عمیق بکش. تمرکز تو عالیه!' },
  { title: '🎯 فوکوس!', body: 'به هدفت نزدیک‌تر شدی!' },
  { title: '⭐ Oly بهت افتخار میکنه!', body: 'تو یکی از بهترین‌هایی!' },
  { title: '🚀 ادامه بده!', body: 'مسیرت درسته، فقط ادامه بده!' },
  { title: '🌿 استراحت یادت نره!', body: 'یه وقفه کوتاه ذهنت رو تازه میکنه.' },
  { title: '✨ لحظه درخشش!', body: 'الان بهترین زمان برای شروعه!' },
];

const FOCUS_REMINDERS = [
  { title: '⏰ وقت فوکوسه!', body: 'بیا یه جلسه تمرکز شروع کنیم.' },
  { title: '🎯 چالش فوکوس!', body: '15 دقیقه تمرکز = 1 برد بزرگ!' },
  { title: '🧘 آماده‌ای؟', body: 'Oly منتظرته برای یه Sprint فوکوس!' },
];

const TASK_COMPLETE_MESSAGES = [
  { title: '🎉 تسک تکمیل شد!', body: 'عالی بود! یه قدم دیگه جلو رفتی!' },
  { title: '✅ خوردیش!', body: 'این تسک رو له کردی! بعدی چیه؟' },
  { title: '🏆 برد!', body: 'Oly خوشحاله! ادامه بده!' },
];

function getRandomMessage(messages: { title: string; body: string }[]) {
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

export function useNotifications() {
  const focusReminderRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const motivationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }, []);

  const sendPushNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.png', badge: '/favicon.png' });
    }
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
    const msg = getRandomMessage(TASK_COMPLETE_MESSAGES);
    notify(msg.title, msg.body, 'success');
  }, [notify]);

  const notifyFocusComplete = useCallback((minutes: number) => {
    notify('🎉 جلسه فوکوس تمام شد!', `${minutes} دقیقه تمرکز کردی! آفرین!`, 'success');
    sendPushNotification('🎉 جلسه فوکوس تمام شد!', `${minutes} دقیقه تمرکز کردی! آفرین!`);
  }, [notify, sendPushNotification]);

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
      const msg = getRandomMessage(MOTIVATION_MESSAGES);
      notify(msg.title, msg.body);
    }, mins * 60 * 1000);
  }, [notify]);

  const startFocusReminders = useCallback((intervalMin?: number) => {
    if (focusReminderRef.current) clearInterval(focusReminderRef.current);
    const settings = loadNotificationSettings();
    if (!settings.focusRemindersEnabled) { focusReminderRef.current = null; return; }
    const mins = intervalMin ?? settings.focusReminderIntervalMin;
    focusReminderRef.current = setInterval(() => {
      const msg = getRandomMessage(FOCUS_REMINDERS);
      notify(msg.title, msg.body, 'warning');
    }, mins * 60 * 1000);
  }, [notify]);

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
