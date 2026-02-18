import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface FeatherCounterProps {
  count: number;
}

interface Sparkle {
  id: string;
  x: number;
}

export function FeatherCounter({ count }: FeatherCounterProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [prevCount, setPrevCount] = useState(count);

  useEffect(() => {
    if (count > prevCount) {
      const newSparkles = Array.from({ length: 3 }, () => ({
        id: crypto.randomUUID(),
        x: Math.random() * 40 - 20,
      }));
      setSparkles(prev => [...prev, ...newSparkles]);
      setTimeout(() => {
        setSparkles(prev => prev.filter(s => !newSparkles.find(ns => ns.id === s.id)));
      }, 1000);
    }
    setPrevCount(count);
  }, [count, prevCount]);

  return (
    <motion.div
      className="fixed top-4 right-4 z-50 glass-card rounded-full px-4 py-2 flex items-center gap-2 neon-glow"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AnimatePresence>
        {sparkles.map(sparkle => (
          <motion.span
            key={sparkle.id}
            className="absolute text-lg pointer-events-none"
            initial={{ opacity: 1, y: 0, x: sparkle.x }}
            animate={{ opacity: 0, y: -40 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ top: 0 }}
          >
            🪶
          </motion.span>
        ))}
      </AnimatePresence>
      <motion.span
        key={count}
        className="text-lg"
        initial={{ scale: 1.4 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        🪶
      </motion.span>
      <motion.span
        key={`count-${count}`}
        className="font-bold text-primary text-sm"
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
      >
        {count}
      </motion.span>
    </motion.div>
  );
}
