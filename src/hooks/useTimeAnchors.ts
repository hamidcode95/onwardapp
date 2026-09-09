import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { TimeAnchor } from '@/hooks/useAppState';
import { playOlyNudge } from '@/lib/sound';

const FEATHER_REWARD_ON_TIME = 5;

interface UseTimeAnchorsParams {
  timeAnchors: TimeAnchor[];
  markTimeAnchorFired: (id: string) => void;
  dismissTimeAnchor: (id: string) => void;
  addFeathers: (amount: number) => void;
  notify: (title: string, body: string, type?: 'info' | 'success' | 'warning') => void;
}

export function useTimeAnchors({
  timeAnchors,
  markTimeAnchorFired,
  dismissTimeAnchor,
  addFeathers,
  notify,
}: UseTimeAnchorsParams) {
  const [now, setNow] = useState(() => Date.now());
  const firingRef = useRef<Set<string>>(new Set());

  // Tick every second to drive the countdown display
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Active anchors: not dismissed yet
  const pendingAnchors = useMemo(
    () => timeAnchors.filter(a => !a.dismissed),
    [timeAnchors]
  );

  // The anchor that is currently ringing (fired but not dismissed)
  const activeAlarm = useMemo(
    () => pendingAnchors.find(a => a.fired) ?? null,
    [pendingAnchors]
  );

  // The next upcoming anchor for the countdown banner
  const nextAnchor = useMemo(() => {
    const upcoming = pendingAnchors
      .filter(a => !a.fired)
      .sort((a, b) => new Date(a.targetTime).getTime() - new Date(b.targetTime).getTime());
    return upcoming[0] ?? null;
  }, [pendingAnchors]);

  const timeLeftMs = nextAnchor
    ? Math.max(0, new Date(nextAnchor.targetTime).getTime() - now)
    : 0;

  // Check for anchors whose time has come
  useEffect(() => {
    pendingAnchors.forEach(anchor => {
      if (anchor.fired || firingRef.current.has(anchor.id)) return;
      const dueTime = new Date(anchor.targetTime).getTime();
      if (dueTime <= now) {
        firingRef.current.add(anchor.id);
        markTimeAnchorFired(anchor.id);
        playOlyNudge();
        notify('⏰ Oly nudged you!', anchor.label, 'warning');
      }
    });
  }, [pendingAnchors, now, markTimeAnchorFired, notify]);

  const dismissAlarm = useCallback(
    (id: string, onTime: boolean) => {
      dismissTimeAnchor(id);
      firingRef.current.delete(id);
      if (onTime) {
        addFeathers(FEATHER_REWARD_ON_TIME);
        notify('🪶 Nice!', `+${FEATHER_REWARD_ON_TIME} feathers for catching your Anchor in time!`, 'success');
      }
    },
    [dismissTimeAnchor, addFeathers, notify]
  );

  return {
    pendingAnchors,
    activeAlarm,
    nextAnchor,
    timeLeftMs,
    dismissAlarm,
  };
}
