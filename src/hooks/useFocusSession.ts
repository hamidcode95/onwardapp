import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'onward_focus_session';

export interface FocusSession {
  /** Label shown under the countdown (a preset name, or "Custom"). */
  label: string;
  /** Full session length, used for the progress ring. */
  totalSeconds: number;
  /** Wall-clock ms timestamp the session ends at; null while paused. */
  endAt: number | null;
  /** Frozen remaining ms captured at the moment of pausing; null while running. */
  remainingWhenPausedMs: number | null;
  status: 'running' | 'paused' | 'completed';
}

function loadSession(): FocusSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FocusSession;
  } catch {
    return null;
  }
}

/**
 * Owns the Focus Room session so it outlives the Focus Room screen.
 *
 * The session used to live in FocusRoom's own component state, which meant
 * navigating Back unmounted the component and silently killed a running
 * timer. Keeping it here (and in localStorage) means the only things that
 * stop a session are the user explicitly pausing/resetting it, or it
 * genuinely finishing — a Back tap, a refresh, or a browser restart all
 * leave it running, because remaining time is derived from the absolute
 * `endAt` timestamp rather than from any live interval.
 */
export function useFocusSession() {
  const [session, setSession] = useState<FocusSession | null>(loadSession);

  useEffect(() => {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  }, [session]);

  const start = useCallback((label: string, totalSeconds: number) => {
    setSession({
      label,
      totalSeconds,
      endAt: Date.now() + totalSeconds * 1000,
      remainingWhenPausedMs: null,
      status: 'running',
    });
  }, []);

  const pause = useCallback(() => {
    setSession((prev) => {
      if (!prev || prev.status !== 'running' || prev.endAt === null) return prev;
      return {
        ...prev,
        remainingWhenPausedMs: Math.max(0, prev.endAt - Date.now()),
        endAt: null,
        status: 'paused',
      };
    });
  }, []);

  const resume = useCallback(() => {
    setSession((prev) => {
      if (!prev || prev.status !== 'paused' || prev.remainingWhenPausedMs === null) return prev;
      return {
        ...prev,
        endAt: Date.now() + prev.remainingWhenPausedMs,
        remainingWhenPausedMs: null,
        status: 'running',
      };
    });
  }, []);

  const reset = useCallback(() => setSession(null), []);

  const markCompleted = useCallback(() => {
    setSession((prev) => (prev ? { ...prev, status: 'completed', endAt: null } : prev));
  }, []);

  return { session, start, pause, resume, reset, markCompleted };
}

/**
 * Watches the active session and fires `onComplete` once when it runs out,
 * from anywhere in the app — so a session finishing while the user is on
 * another screen still counts and still notifies.
 */
export function useFocusSessionCompletion(
  session: FocusSession | null,
  markCompleted: () => void,
  onComplete: (minutes: number) => void,
) {
  const firedForRef = useRef<number | null>(null);

  useEffect(() => {
    if (!session || session.status !== 'running' || session.endAt === null) return;

    const endAt = session.endAt;
    const minutes = Math.max(1, Math.round(session.totalSeconds / 60));

    const check = () => {
      if (Date.now() < endAt) return;
      // Keyed on endAt so a brand-new session (different endAt) can fire
      // again, but the same session can never fire twice.
      if (firedForRef.current === endAt) return;
      firedForRef.current = endAt;
      markCompleted();
      onComplete(minutes);
    };

    check();
    const ticker = setInterval(check, 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(ticker);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [session, markCompleted, onComplete]);
}
