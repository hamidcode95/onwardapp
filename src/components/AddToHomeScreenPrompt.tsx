import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, PlusSquare, Download, Sparkles } from 'lucide-react';
import onwardLogo from '@/assets/onward-logo.png';
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-black/80 p-6 backdrop-blur-md"
        >
          <button
            onClick={dismiss}
            className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            aria-label="Dismiss"
          >
            <X size={22} />
          </button>

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="w-full max-w-sm text-center"
          >
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse-glow rounded-full blur-xl" />
                <img
                  src={onwardLogo}
                  alt="Onward"
                  className="relative h-28 w-28 rounded-3xl object-cover shadow-2xl"
                />
              </div>
            </div>

            <h2 className="mb-2 flex items-center justify-center gap-2 text-2xl font-bold text-foreground">
              <Sparkles size={22} className="text-primary" />
              Install Onward
            </h2>
            <p className="mb-8 text-muted-foreground">
              Get the full experience — reminders that reach you even when the app is closed.
            </p>

            {showIosInstructions ? (
              <div className="space-y-3">
                <div className="glass-card flex items-center gap-4 rounded-xl p-4 text-left">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Share size={18} />
                  </div>
                  <p className="text-sm text-foreground">
                    Tap the <span className="font-semibold">Share</span> button in Safari's toolbar
                  </p>
                </div>
                <div className="glass-card flex items-center gap-4 rounded-xl p-4 text-left">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <PlusSquare size={18} />
                  </div>
                  <p className="text-sm text-foreground">
                    Scroll down and choose <span className="font-semibold">Add to Home Screen</span>
                  </p>
                </div>
                <Button variant="secondary" onClick={dismiss} className="mt-4 w-full">
                  Got it
                </Button>
              </div>
            ) : (
              <Button size="lg" onClick={handleInstall} className="w-full neon-glow">
                <Download size={20} className="mr-2" />
                Install Now
              </Button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
