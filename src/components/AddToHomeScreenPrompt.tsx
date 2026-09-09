import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, PlusSquare, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isIos, isInStandaloneMode } from '@/lib/push';

const DISMISS_KEY = 'onward_a2hs_dismissed_at';
const DISMISS_DAYS = 14;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function AddToHomeScreenPrompt() {
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isInStandaloneMode()) return;

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_DAYS) return;
    }

    if (isIos()) {
      setShowIosInstructions(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShowIosInstructions(false);
    setDeferredPrompt(null);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const visible = showIosInstructions || Boolean(deferredPrompt);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-md rounded-2xl border border-white/10 bg-background/95 p-4 shadow-2xl backdrop-blur-xl"
        >
          <button
            onClick={dismiss}
            className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>

          {showIosInstructions ? (
            <div className="pr-6">
              <p className="mb-2 font-semibold text-foreground">
                Get reminders even when the app is closed
              </p>
              <p className="mb-3 text-sm leading-6 text-muted-foreground">
                Add Onward to your Home Screen: tap the{' '}
                <Share size={14} className="mx-1 inline align-text-bottom" />
                Share button below, then{' '}
                <PlusSquare size={14} className="mx-1 inline align-text-bottom" />
                choose "Add to Home Screen".
              </p>
              <Button size="sm" variant="secondary" onClick={dismiss}>
                Got it
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 pr-6">
              <div>
                <p className="font-semibold text-foreground">Install Onward</p>
                <p className="text-sm text-muted-foreground">Reminders arrive even when the app is closed</p>
              </div>
              <Button size="sm" onClick={handleInstall} className="shrink-0">
                <Download size={16} className="mr-1" />
                Install
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
