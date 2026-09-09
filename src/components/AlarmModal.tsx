import { motion, AnimatePresence } from 'framer-motion';
import { Oly } from '@/components/Oly';
import { Button } from '@/components/ui/button';
import { TimeAnchor } from '@/hooks/useAppState';
import { useTranslation } from 'react-i18next';

interface AlarmModalProps {
  anchor: TimeAnchor | null;
  onDismiss: () => void;
}

export function AlarmModal({ anchor, onDismiss }: AlarmModalProps) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {anchor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 text-center shadow-2xl backdrop-blur-xl"
          >
            <div className="flex justify-center mb-4">
              <Oly state="alert" size={110} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              ⏰ {t('timeAnchor.alarm.timesUp')}
            </h3>
            <p className="text-muted-foreground mb-6">{anchor.label}</p>
            <Button size="lg" className="w-full neon-glow" onClick={onDismiss}>
              {t('timeAnchor.alarm.focusNow')}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
