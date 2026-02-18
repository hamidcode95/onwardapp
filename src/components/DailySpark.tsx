import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { X } from 'lucide-react';

const ADHD_TIPS = [
  "🧠 Your brain isn't broken — it's a Ferrari engine with bicycle brakes. Let's tune it up!",
  "⏰ Set a timer for just 5 minutes. Starting is the hardest part — momentum does the rest.",
  "📝 Write it down NOW. Your working memory is for creating, not storing.",
  "🎧 Put on your focus playlist. Music is your brain's secret turbo button.",
  "🧘 Take 3 deep breaths. Oxygen is free productivity fuel.",
  "🎯 Pick ONE thing. Not three, not five. Just one. You can do one thing.",
  "💪 You did hard things before. Your Success Archive proves it. Check it out!",
  "🌊 Feeling overwhelmed? Brain Dump it all out. Empty mind = clear mind.",
  "🏆 Celebrate tiny wins. Finished a sub-task? That's worth a fist pump! 👊",
  "🔄 Stuck? Switch tasks for 10 minutes. A fresh angle beats staring.",
];

interface DailySparkProps {
  show: boolean;
  onDismiss: () => void;
}

export function DailySpark({ show, onDismiss }: DailySparkProps) {
  const [tip] = useState(() => ADHD_TIPS[Math.floor(Math.random() * ADHD_TIPS.length)]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-full z-30 w-64"
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="glass-card rounded-xl p-3 relative neon-glow">
            <button
              onClick={onDismiss}
              className="absolute top-1 right-1 text-muted-foreground hover:text-foreground p-1"
            >
              <X size={14} />
            </button>
            <p className="text-xs text-foreground leading-relaxed pr-4">
              {tip}
            </p>
            {/* Speech bubble tail */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0"
              style={{
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid var(--glass-border)',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
