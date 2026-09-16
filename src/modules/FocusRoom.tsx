import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Crown } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { ModuleHeader } from '@/components/ModuleHeader';
import { Oly, OlyState } from '@/components/Oly';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { usePremium } from '@/hooks/usePremium';
import { UpgradeModal } from '@/components/UpgradeModal';
import { ScrollPicker } from '@/components/ScrollPicker';
import type { FocusSession } from '@/hooks/useFocusSession';

interface FocusRoomProps {
  onBack: () => void;
  session: FocusSession | null;
  onStart: (label: string, totalSeconds: number) => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

const TIMER_OPTION_KEYS: { key: string; minutes: number }[] = [
  { key: 'sprint15', minutes: 15 },
  { key: 'deepWork25', minutes: 25 },
  { key: 'epic45', minutes: 45 },
];

const HOURS = Array.from({ length: 13 }, (_, i) => i); // 0–12
const SIXTY = Array.from({ length: 60 }, (_, i) => i);

export function FocusRoom({ onBack, session, onStart, onPause, onResume, onReset }: FocusRoomProps) {
  const { t } = useTranslation();
  const { isPremium, refresh: refreshPremium } = usePremium();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [customSeconds, setCustomSeconds] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const isRunning = session?.status === 'running';
  const isComplete = session?.status === 'completed';

  // Ticks only to refresh the displayed countdown — it never decides how
  // much time has actually elapsed. That's always `endAt - Date.now()`,
  // which is why a throttled/suspended tab can't drift the timer.
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Immediate resync when the tab/app becomes visible again, rather than
  // waiting up to a second for the next tick.
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
    if (!session) return 0;
    if (session.status === 'running' && session.endAt !== null) return Math.max(0, session.endAt - now);
    if (session.remainingWhenPausedMs !== null) return session.remainingWhenPausedMs;
    return session.status === 'completed' ? 0 : session.totalSeconds * 1000;
  })();
  const timeLeft = Math.ceil(timeLeftMs / 1000);

  const totalSeconds = session?.totalSeconds ?? 0;
  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;

  const getOlyState = (): OlyState => {
    if (isComplete) return 'finish';
    if (isRunning) return 'active';
    return 'neutral';
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const mm = m.toString().padStart(2, '0');
    const ss = s.toString().padStart(2, '0');
    // Only show the hours segment when a custom session actually needs it.
    return h > 0 ? `${h.toString().padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`;
  };

  const startPreset = (label: string, minutes: number) => {
    setShowCustomPicker(false);
    onStart(label, minutes * 60);
    setNow(Date.now());
  };

  const startCustomTimer = () => {
    const total = customHours * 3600 + customMinutes * 60 + customSeconds;
    if (total <= 0) return;
    setShowCustomPicker(false);
    onStart(t('focusRoom.customLabel'), total);
    setNow(Date.now());
  };

  const togglePause = () => {
    if (isRunning) onPause();
    else {
      onResume();
      setNow(Date.now());
    }
  };

  const completedMinutes = session ? Math.max(1, Math.round(session.totalSeconds / 60)) : 0;

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
          showRing={session !== null}
          ringProgress={progress}
        />
      </div>

      {/* Timer Display */}
      {session && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-6"
        >
          <div className="text-5xl font-bold text-primary neon-text mb-2">
            {formatTime(timeLeft)}
          </div>
          <div className="text-muted-foreground">
            {session.label}
          </div>
        </motion.div>
      )}

      {/* Timer Selection or Controls */}
      {!session ? (
        <div className="space-y-3">
          <p className="text-center text-muted-foreground mb-4">
            {t('focusRoom.chooseSession')}
          </p>
          {TIMER_OPTION_KEYS.map(({ key, minutes }) => (
            <GlassCard
              key={key}
              onClick={() => startPreset(t(`focusRoom.${key}`), minutes)}
              className="text-center"
            >
              <span className="font-semibold text-lg">{t(`focusRoom.${key}`)}</span>
            </GlassCard>
          ))}

          {/* Custom timer — the Pro-gated option. Free users see the card
              with a crown and get the upgrade modal; Pro users expand an
              h/m/s picker with no duration cap. */}
          {!isPremium ? (
            <GlassCard onClick={() => setShowUpgradeModal(true)} className="text-center opacity-70">
              <div className="flex items-center justify-center gap-2">
                <span className="font-semibold text-lg">{t('focusRoom.customTimer')}</span>
                <Crown size={16} className="text-[hsl(45,90%,55%)]" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t('focusRoom.proOnly')}</p>
            </GlassCard>
          ) : !showCustomPicker ? (
            <GlassCard onClick={() => setShowCustomPicker(true)} className="text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="font-semibold text-lg">{t('focusRoom.customTimer')}</span>
                <Crown size={16} className="text-[hsl(45,90%,55%)]" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t('focusRoom.customTimerPro')}</p>
            </GlassCard>
          ) : (
            <GlassCard hover={false}>
              <div className="mb-3 flex items-center justify-center gap-2">
                <span className="font-semibold">{t('focusRoom.customTimer')}</span>
                <Crown size={16} className="text-[hsl(45,90%,55%)]" />
              </div>
              <div className="mb-4 flex items-center justify-center gap-2">
                <ScrollPicker values={HOURS} value={customHours} onChange={setCustomHours} label={t('focusRoom.hours')} />
                <span className="mt-5 text-xl font-bold text-muted-foreground">:</span>
                <ScrollPicker values={SIXTY} value={customMinutes} onChange={setCustomMinutes} label={t('focusRoom.minutes')} />
                <span className="mt-5 text-xl font-bold text-muted-foreground">:</span>
                <ScrollPicker values={SIXTY} value={customSeconds} onChange={setCustomSeconds} label={t('focusRoom.seconds')} />
              </div>
              <Button
                className="w-full neon-glow"
                onClick={startCustomTimer}
                disabled={customHours === 0 && customMinutes === 0 && customSeconds === 0}
              >
                {t('focusRoom.startCustom')}
              </Button>
            </GlassCard>
          )}
        </div>
      ) : (
        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            variant="outline"
            onClick={onReset}
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
              {t('focusRoom.focusedFor', { minutes: completedMinutes })}
            </p>
          </GlassCard>
        </motion.div>
      )}

      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onVerified={refreshPremium}
      />
    </div>
  );
}
