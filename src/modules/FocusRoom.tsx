import { useState, useEffect, useCallback } from 'react';
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
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

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

  const startTimer = (option: TimerOption) => {
    setSelectedTimer(option);
    setTimeLeft(option.minutes * 60);
    setIsRunning(true);
    setIsComplete(false);
  };

  const togglePause = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsComplete(false);
    setSelectedTimer(null);
    setTimeLeft(0);
  };

  const handleComplete = useCallback(() => {
    setIsRunning(false);
    setIsComplete(true);
    if (selectedTimer && onComplete) {
      onComplete(selectedTimer.minutes);
    }
  }, [selectedTimer, onComplete]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, handleComplete]);

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
