import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { ModuleHeader } from '@/components/ModuleHeader';
import { Oly, OlyState } from '@/components/Oly';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface FocusRoomProps {
  onBack: () => void;
  onComplete?: (minutes: number) => void;
}

type TimerOption = { label: string; minutes: number };

const TIMER_OPTION_KEYS: { key: string; minutes: number }[] = [
  { key: 'sprint15', minutes: 15 },
  { key: 'deepWork25', minutes: 25 },
  { key: 'epic45', minutes: 45 },
];

export function FocusRoom({ onBack, onComplete }: FocusRoomProps) {
  const { t } = useTranslation();
  const TIMER_OPTIONS: TimerOption[] = TIMER_OPTION_KEYS.map(({ key, minutes }) => ({
    label: t(`focusRoom.${key}`),
    minutes,
  }));

  const [selectedTimer, setSelectedTimer] = useState<TimerOption | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Source of truth for "how much time is left" is always a wall-clock
  // timestamp, never a decrementing counter. `endAt` is when the running
  // session will finish; `remainingWhenPausedMs` is a frozen snapshot taken
  // the moment the user pauses. Neither depends on the JS interval below
  // having actually fired on schedule — a throttled/suspended tab (locked
  // phone, backgrounded browser) just means `now` jumps forward by more
  // than a second next time the interval (or a resume) ticks, and the
  // remaining time recalculated from `endAt` is still correct.
  const [endAt, setEndAt] = useState<number | null>(null);
  const [remainingWhenPausedMs, setRemainingWhenPausedMs] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const completedFiredRef = useRef(false);

  // Ticks only to refresh the displayed countdown — it never decides how
  // much time has actually elapsed. That's always `endAt - Date.now()`.
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Force an immediate resync (rather than waiting up to 1s for the next
  // tick) whenever the tab/app becomes visible again — this is what makes
  // "resume after the timer already expired in the background" behave
  // correctly instead of briefly showing stale time.
  useEffect(() => {
    const resync = () => {
      if (document.visibilityState === 'visible') setNow(Date.now());
    };
    document.addEventListener('visibilitychange', resync);
    window.addEventListener('focus', resync);
    return () => {
      document.removeEventListener('visibilitychange', resync);
      window.removeEventListener('focus', resync);
    };
  }, []);

  const timeLeftMs = (() => {
    if (!selectedTimer) return 0;
    if (isRunning && endAt !== null) return Math.max(0, endAt - now);
    if (remainingWhenPausedMs !== null) return remainingWhenPausedMs;
    return selectedTimer.minutes * 60 * 1000;
  })();
  const timeLeft = Math.ceil(timeLeftMs / 1000);

  const totalSeconds = selectedTimer ? selectedTimer.minutes * 60 : 0;
  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;

  const getOlyState = (): OlyState => {
    if (isComplete) return 'finish';
    if (isRunning) return 'active';
    return 'neutral';
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleComplete = useCallback((minutes: number) => {
    setIsRunning(false);
    setIsComplete(true);
    setEndAt(null);
    // Completion always goes through the app's notification layer
    // (see useNotifications -> src/lib/notifications) — FocusRoom itself
    // never touches a platform notification API directly.
    onComplete?.(minutes);
  }, [onComplete]);

  const startTimer = (option: TimerOption) => {
    setSelectedTimer(option);
    setRemainingWhenPausedMs(null);
    setIsComplete(false);
    completedFiredRef.current = false;
    setEndAt(Date.now() + option.minutes * 60 * 1000);
    setIsRunning(true);
    setNow(Date.now());
  };

  const pauseTimer = () => {
    if (endAt === null) return;
    setRemainingWhenPausedMs(Math.max(0, endAt - Date.now()));
    setEndAt(null);
    setIsRunning(false);
  };

  const resumeTimer = () => {
    if (remainingWhenPausedMs === null) return;
    setEndAt(Date.now() + remainingWhenPausedMs);
    setRemainingWhenPausedMs(null);
    setIsRunning(true);
    setNow(Date.now());
  };

  const togglePause = () => {
    if (isRunning) pauseTimer();
    else resumeTimer();
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsComplete(false);
    setSelectedTimer(null);
    setEndAt(null);
    setRemainingWhenPausedMs(null);
    completedFiredRef.current = false;
  };

  // The only place completion is decided: `now` caught up to `endAt`.
  // Guarded by a ref (not just `isComplete` state) so a rapid double-tick
  // right at the boundary can never fire the completion callback twice.
  useEffect(() => {
    if (!isRunning || endAt === null || isComplete) return;
    if (now >= endAt && !completedFiredRef.current && selectedTimer) {
      completedFiredRef.current = true;
      handleComplete(selectedTimer.minutes);
    }
  }, [now, isRunning, endAt, isComplete, selectedTimer, handleComplete]);

  return (
    <div className="min-h-screen p-4">
      <ModuleHeader
        title={t('dashboard.modules.focus.title')}
        description={t('dashboard.modules.focus.description')}
        onBack={onBack}
      />

      {/* Oly with Progress Ring */}
      <div className="flex justify-center mb-8">
        <Oly 
          state={getOlyState()} 
          size={140} 
          showRing={selectedTimer !== null}
          ringProgress={progress}
        />
      </div>

      {/* Timer Display */}
      {selectedTimer && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-6"
        >
          <div className="text-5xl font-bold text-primary neon-text mb-2">
            {formatTime(timeLeft)}
          </div>
          <div className="text-muted-foreground">
            {selectedTimer.label}
          </div>
        </motion.div>
      )}

      {/* Timer Selection or Controls */}
      {!selectedTimer ? (
        <div className="space-y-3">
          <p className="text-center text-muted-foreground mb-4">
            {t('focusRoom.chooseSession')}
          </p>
          {TIMER_OPTIONS.map((option) => (
            <GlassCard
              key={option.minutes}
              onClick={() => startTimer(option)}
              className="text-center"
            >
              <span className="font-semibold text-lg">{option.label}</span>
            </GlassCard>
          ))}
        </div>
      ) : (
        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            variant="outline"
            onClick={resetTimer}
            className="glass-card border-border"
          >
            <RotateCcw size={20} className="mr-2" />
            {t('focusRoom.reset')}
          </Button>
          {!isComplete && (
            <Button
              size="lg"
              onClick={togglePause}
              className="neon-glow"
            >
              {isRunning ? <Pause size={20} className="mr-2" /> : <Play size={20} className="mr-2" />}
              {isRunning ? t('focusRoom.pause') : t('focusRoom.resume')}
            </Button>
          )}
        </div>
      )}

      {/* Completion Message */}
      {isComplete && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mt-6"
        >
          <GlassCard className="neon-glow" hover={false}>
            <h3 className="text-xl font-bold text-primary mb-2">{t('focusRoom.sessionComplete')}</h3>
            <p className="text-muted-foreground">
              {t('focusRoom.focusedFor', { minutes: selectedTimer?.minutes })}
            </p>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}
