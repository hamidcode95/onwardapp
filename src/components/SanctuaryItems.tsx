import { motion } from 'framer-motion';

interface SanctuaryItemsProps {
  purchasedItems: string[];
  olySize: number;
}

function PlantSVG({ x, y }: { x: number; y: number }) {
  return (
    <motion.svg
      width="40" height="50" viewBox="0 0 40 50"
      className="absolute"
      style={{ left: x, top: y }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', delay: 0.2 }}
    >
      <ellipse cx="20" cy="45" rx="12" ry="5" fill="hsl(30, 40%, 35%)" />
      <rect x="14" y="30" width="12" height="18" rx="3" fill="hsl(25, 50%, 40%)" />
      <circle cx="20" cy="22" r="12" fill="hsl(140, 50%, 40%)" />
      <circle cx="14" cy="16" r="8" fill="hsl(145, 55%, 45%)" />
      <circle cx="26" cy="18" r="7" fill="hsl(135, 45%, 42%)" />
      <circle cx="20" cy="12" r="6" fill="hsl(150, 60%, 48%)" />
    </motion.svg>
  );
}

function LampSVG({ x, y }: { x: number; y: number }) {
  return (
    <motion.svg
      width="35" height="55" viewBox="0 0 35 55"
      className="absolute"
      style={{ left: x, top: y }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', delay: 0.3 }}
    >
      <rect x="15" y="20" width="5" height="30" rx="2" fill="hsl(40, 20%, 50%)" />
      <ellipse cx="17" cy="52" rx="10" ry="3" fill="hsl(40, 20%, 45%)" />
      <motion.path
        d="M5 22 Q17 -2 30 22 Z"
        fill="hsl(45, 80%, 65%)"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.ellipse
        cx="17" cy="10" rx="18" ry="12"
        fill="hsla(45, 80%, 65%, 0.15)"
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.svg>
  );
}

function MugSVG({ x, y }: { x: number; y: number }) {
  return (
    <motion.svg
      width="35" height="35" viewBox="0 0 35 35"
      className="absolute"
      style={{ left: x, top: y }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', delay: 0.1 }}
    >
      <rect x="5" y="10" width="18" height="20" rx="3" fill="hsl(20, 60%, 45%)" />
      <path d="M23 14 Q30 14 30 22 Q30 28 23 28" stroke="hsl(20, 60%, 45%)" strokeWidth="3" fill="none" />
      <motion.path
        d="M10 8 Q12 2 14 8 M15 6 Q17 0 19 6"
        stroke="hsla(0, 0%, 100%, 0.4)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        animate={{ y: [0, -3, 0], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.svg>
  );
}

export function SanctuaryItems({ purchasedItems, olySize }: SanctuaryItemsProps) {
  const offsetBase = olySize / 2 + 20;

  return (
    <>
      {purchasedItems.includes('plant') && (
        <PlantSVG x={-offsetBase - 10} y={offsetBase - 30} />
      )}
      {purchasedItems.includes('lamp') && (
        <LampSVG x={offsetBase + 5} y={offsetBase - 45} />
      )}
      {purchasedItems.includes('mug') && (
        <MugSVG x={-offsetBase + 20} y={offsetBase - 5} />
      )}
    </>
  );
}
