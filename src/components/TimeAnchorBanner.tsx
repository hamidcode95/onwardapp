import { motion, AnimatePresence } from 'framer-motion';
import { AlarmClock } from 'lucide-react';
import { TimeAnchor } from '@/hooks/useAppState';

interface TimeAnchorBannerProps {
  anchor: TimeAnchor | null;
  timeLeftMs: number;
  onClick?: () => void;
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function TimeAnchorBanner({ anchor, timeLeftMs, onClick }: TimeAnchorBannerProps) {
  return (
    <AnimatePresence>
      {anchor && (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.3 }}
          onClick={onClick}
          className="sticky top-2 z-30 mx-auto mb-4 flex max-w-md cursor-pointer items-center gap-3 rounded-full border border-[hsl(150,47%,71%)]/40 bg-background/80 px-4 py-2 backdrop-blur-md shadow-[0_0_14px_hsla(150,47%,71%,0.25)]"
        >
          <AlarmClock size={18} className="shrink-0 text-primary" />
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span className="truncate text-sm text-foreground">{anchor.label}</span>
            <span className="whitespace-nowrap font-mono text-sm font-semibold text-primary">
              {formatCountdown(timeLeftMs)}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
