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

export function useNotifications() {
  const focusReminderRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const motivationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }, []);

  // Send browser push notification
  const sendPushNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.png',
        badge: '/favicon.png',
      });
    }
  }, []);

  // In-app toast notification
  const sendToast = useCallback((title: string, body: string, type: 'info' | 'success' | 'warning' = 'info') => {
    switch (type) {
      case 'success':
        toast.success(title, { description: body });
        break;
      case 'warning':
        toast.warning(title, { description: body });
        break;
      default:
        toast(title, { description: body });
    }
  }, []);

  // Notify both in-app and push
  const notify = useCallback((title: string, body: string, type: 'info' | 'success' | 'warning' = 'info') => {
    sendToast(title, body, type);
    if (document.hidden) {
      sendPushNotification(title, body);
    }
  }, [sendToast, sendPushNotification]);

  // Task completion notification
  const notifyTaskComplete = useCallback(() => {
    const msg = getRandomMessage(TASK_COMPLETE_MESSAGES);
    notify(msg.title, msg.body, 'success');
  }, [notify]);

  // Focus session complete notification
  const notifyFocusComplete = useCallback((minutes: number) => {
    notify('🎉 جلسه فوکوس تمام شد!', `${minutes} دقیقه تمرکز کردی! آفرین!`, 'success');
    sendPushNotification('🎉 جلسه فوکوس تمام شد!', `${minutes} دقیقه تمرکز کردی! آفرین!`);
  }, [notify, sendPushNotification]);

  // Random motivation (sends every ~20 min when app is open)
  const startMotivationLoop = useCallback(() => {
    if (motivationRef.current) return;
    motivationRef.current = setInterval(() => {
      const msg = getRandomMessage(MOTIVATION_MESSAGES);
      notify(msg.title, msg.body);
    }, 20 * 60 * 1000); // every 20 minutes
  }, [notify]);

  // Focus reminders (sends every ~45 min)
  const startFocusReminders = useCallback(() => {
    if (focusReminderRef.current) return;
    focusReminderRef.current = setInterval(() => {
      const msg = getRandomMessage(FOCUS_REMINDERS);
      notify(msg.title, msg.body, 'warning');
    }, 45 * 60 * 1000); // every 45 minutes
  }, [notify]);

  const stopAllReminders = useCallback(() => {
    if (focusReminderRef.current) { clearInterval(focusReminderRef.current); focusReminderRef.current = null; }
    if (motivationRef.current) { clearInterval(motivationRef.current); motivationRef.current = null; }
  }, []);

  // Cleanup on unmount
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
    sendToast,
  };
}
