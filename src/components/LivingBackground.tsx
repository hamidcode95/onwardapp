import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

function isDaytime(): boolean {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18;
}

export function LivingBackground() {
  const [daytime, setDaytime] = useState(isDaytime);

  useEffect(() => {
    const interval = setInterval(() => setDaytime(isDaytime()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (daytime) {
    return (
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 30%, hsla(150, 47%, 71%, 0.08) 0%, transparent 70%)',
          }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, hsla(150, 30%, 20%, 0.15) 0%, transparent 60%)',
        }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}
