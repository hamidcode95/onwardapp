import { motion, useAnimation } from 'framer-motion';
import { useState, useMemo, useCallback } from 'react';

export type OlyState = 
  | 'neutral' 
  | 'working' 
  | 'success' 
  | 'active' 
  | 'finish' 
  | 'confirm' 
  | 'thinking' 
  | 'reveal' 
  | 'low_energy' 
  | 'high_energy';

interface BlobConfig {
  colors: [string, string, string];
  speed: number;
  complexity: number;
  glow: string;
  pulseScale: [number, number];
  eyeExpression: 'normal' | 'focused' | 'happy' | 'sleepy' | 'excited';
}

const STATE_CONFIGS: Record<OlyState, BlobConfig> = {
  neutral: {
    colors: ['hsl(150, 47%, 71%)', 'hsl(150, 40%, 55%)', 'hsl(160, 50%, 65%)'],
    speed: 6,
    complexity: 1,
    glow: 'hsla(150, 47%, 71%, 0.3)',
    pulseScale: [0.97, 1.03],
    eyeExpression: 'normal',
  },
  working: {
    colors: ['hsl(150, 60%, 50%)', 'hsl(140, 55%, 45%)', 'hsl(160, 65%, 55%)'],
    speed: 3,
    complexity: 1.5,
    glow: 'hsla(150, 60%, 50%, 0.4)',
    pulseScale: [0.95, 1.05],
    eyeExpression: 'focused',
  },
  active: {
    colors: ['hsl(150, 60%, 50%)', 'hsl(140, 55%, 45%)', 'hsl(160, 65%, 55%)'],
    speed: 3,
    complexity: 1.5,
    glow: 'hsla(150, 60%, 50%, 0.4)',
    pulseScale: [0.95, 1.05],
    eyeExpression: 'focused',
  },
  success: {
    colors: ['hsl(130, 65%, 60%)', 'hsl(50, 80%, 65%)', 'hsl(140, 70%, 55%)'],
    speed: 4,
    complexity: 1.2,
    glow: 'hsla(130, 65%, 60%, 0.5)',
    pulseScale: [0.93, 1.08],
    eyeExpression: 'happy',
  },
  finish: {
    colors: ['hsl(130, 65%, 60%)', 'hsl(50, 80%, 65%)', 'hsl(140, 70%, 55%)'],
    speed: 4,
    complexity: 1.2,
    glow: 'hsla(130, 65%, 60%, 0.5)',
    pulseScale: [0.93, 1.08],
    eyeExpression: 'happy',
  },
  confirm: {
    colors: ['hsl(180, 50%, 60%)', 'hsl(150, 45%, 65%)', 'hsl(170, 55%, 58%)'],
    speed: 5,
    complexity: 1,
    glow: 'hsla(180, 50%, 60%, 0.35)',
    pulseScale: [0.96, 1.04],
    eyeExpression: 'normal',
  },
  thinking: {
    colors: ['hsl(200, 55%, 60%)', 'hsl(180, 50%, 55%)', 'hsl(220, 45%, 65%)'],
    speed: 2.5,
    complexity: 2,
    glow: 'hsla(200, 55%, 60%, 0.4)',
    pulseScale: [0.94, 1.06],
    eyeExpression: 'focused',
  },
  reveal: {
    colors: ['hsl(280, 50%, 65%)', 'hsl(320, 45%, 60%)', 'hsl(260, 55%, 70%)'],
    speed: 3.5,
    complexity: 1.8,
    glow: 'hsla(280, 50%, 65%, 0.45)',
    pulseScale: [0.92, 1.1],
    eyeExpression: 'excited',
  },
  low_energy: {
    colors: ['hsl(150, 25%, 50%)', 'hsl(160, 20%, 45%)', 'hsl(140, 30%, 48%)'],
    speed: 8,
    complexity: 0.5,
    glow: 'hsla(150, 25%, 50%, 0.2)',
    pulseScale: [0.98, 1.02],
    eyeExpression: 'sleepy',
  },
  high_energy: {
    colors: ['hsl(80, 70%, 55%)', 'hsl(120, 65%, 50%)', 'hsl(60, 75%, 60%)'],
    speed: 2,
    complexity: 2.5,
    glow: 'hsla(80, 70%, 55%, 0.5)',
    pulseScale: [0.9, 1.12],
    eyeExpression: 'excited',
  },
};

// Generate organic blob path using sine waves with randomized offsets
function generateBlobPath(seed: number, complexity: number, radius: number): string {
  const points = 8;
  const angleStep = (Math.PI * 2) / points;
  const coords: [number, number][] = [];

  for (let i = 0; i < points; i++) {
    const angle = i * angleStep;
    const offset = Math.sin(seed + i * complexity * 1.7) * (radius * 0.15)
      + Math.cos(seed * 0.7 + i * 2.3) * (radius * 0.1);
    const r = radius + offset;
    coords.push([
      radius + 10 + r * Math.cos(angle),
      radius + 10 + r * Math.sin(angle),
    ]);
  }

  // Build smooth cubic bezier curve through points
  let d = `M ${coords[0][0]},${coords[0][1]} `;
  for (let i = 0; i < coords.length; i++) {
    const curr = coords[i];
    const next = coords[(i + 1) % coords.length];
    const prev = coords[(i - 1 + coords.length) % coords.length];
    const nextNext = coords[(i + 2) % coords.length];

    const cp1x = curr[0] + (next[0] - prev[0]) / 4;
    const cp1y = curr[1] + (next[1] - prev[1]) / 4;
    const cp2x = next[0] - (nextNext[0] - curr[0]) / 4;
    const cp2y = next[1] - (nextNext[1] - curr[1]) / 4;

    d += `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next[0]},${next[1]} `;
  }
  d += 'Z';
  return d;
}

interface OlyProps {
  state?: OlyState;
  size?: number;
  className?: string;
  showRing?: boolean;
  ringProgress?: number;
  onClick?: () => void;
}

export function Oly({ 
  state = 'neutral', 
  size = 120, 
  className = '',
  showRing = false,
  ringProgress = 0,
  onClick,
}: OlyProps) {
  const config = STATE_CONFIGS[state];
  const radius = size / 2 - 10;
  const svgSize = size + 20;
  const center = svgSize / 2;
  const blobControls = useAnimation();
  const [isBouncing, setIsBouncing] = useState(false);

  const handleClick = useCallback(() => {
    if (isBouncing) return;
    setIsBouncing(true);
    blobControls.start({
      scale: [1, 1.25, 0.85, 1.1, 0.95, 1],
      rotate: [0, -8, 10, -5, 3, 0],
      transition: { duration: 0.6, ease: 'easeOut' },
    }).then(() => setIsBouncing(false));
    onClick?.();
  }, [isBouncing, blobControls, onClick]);

  // Generate multiple blob path keyframes for morphing
  const blobPaths = useMemo(() => {
    const paths: string[] = [];
    for (let i = 0; i < 4; i++) {
      paths.push(generateBlobPath(i * 2.5, config.complexity, radius));
    }
    paths.push(paths[0]); // loop back
    return paths;
  }, [config.complexity, radius]);

  const ringSize = size + 40;
  const ringStrokeWidth = 4;
  const ringRadius = (ringSize - ringStrokeWidth) / 2;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = circumference - (ringProgress / 100) * circumference;

  // Eye positions
  const eyeOffsetX = radius * 0.22;
  const eyeOffsetY = -radius * 0.1;
  const eyeSize = radius * 0.08;

  const renderEyes = () => {
    const leftX = center - eyeOffsetX;
    const rightX = center + eyeOffsetX;
    const y = center + eyeOffsetY;

    switch (config.eyeExpression) {
      case 'happy':
        return (
          <>
            <motion.path
              d={`M ${leftX - eyeSize * 1.5} ${y} Q ${leftX} ${y - eyeSize * 2.5} ${leftX + eyeSize * 1.5} ${y}`}
              stroke="hsl(var(--background))"
              strokeWidth={eyeSize * 0.7}
              strokeLinecap="round"
              fill="none"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.path
              d={`M ${rightX - eyeSize * 1.5} ${y} Q ${rightX} ${y - eyeSize * 2.5} ${rightX + eyeSize * 1.5} ${y}`}
              stroke="hsl(var(--background))"
              strokeWidth={eyeSize * 0.7}
              strokeLinecap="round"
              fill="none"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </>
        );
      case 'focused':
        return (
          <>
            <motion.circle cx={leftX} cy={y} r={eyeSize} fill="hsl(var(--background))"
              animate={{ r: [eyeSize, eyeSize * 0.7, eyeSize] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.circle cx={rightX} cy={y} r={eyeSize} fill="hsl(var(--background))"
              animate={{ r: [eyeSize, eyeSize * 0.7, eyeSize] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </>
        );
      case 'sleepy':
        return (
          <>
            <motion.line
              x1={leftX - eyeSize} y1={y} x2={leftX + eyeSize} y2={y}
              stroke="hsl(var(--background))" strokeWidth={eyeSize * 0.6} strokeLinecap="round"
              animate={{ opacity: [0.6, 0.4, 0.6] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.line
              x1={rightX - eyeSize} y1={y} x2={rightX + eyeSize} y2={y}
              stroke="hsl(var(--background))" strokeWidth={eyeSize * 0.6} strokeLinecap="round"
              animate={{ opacity: [0.6, 0.4, 0.6] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </>
        );
      case 'excited':
        return (
          <>
            <motion.circle cx={leftX} cy={y} r={eyeSize * 1.3} fill="hsl(var(--background))"
              animate={{ scale: [1, 1.2, 1], y: [0, -2, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <motion.circle cx={rightX} cy={y} r={eyeSize * 1.3} fill="hsl(var(--background))"
              animate={{ scale: [1, 1.2, 1], y: [0, -2, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          </>
        );
      default: // normal - blink
        return (
          <>
            <motion.circle cx={leftX} cy={y} r={eyeSize} fill="hsl(var(--background))"
              animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
              transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
            />
            <motion.circle cx={rightX} cy={y} r={eyeSize} fill="hsl(var(--background))"
              animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
              transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
            />
          </>
        );
    }
  };

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center cursor-pointer select-none ${className}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4 }}
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
    >
      {showRing && (
        <svg
          className="absolute"
          width={ringSize}
          height={ringSize}
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringRadius}
            stroke="hsl(var(--muted))"
            strokeWidth={ringStrokeWidth}
            fill="none"
          />
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringRadius}
            stroke="hsl(var(--primary))"
            strokeWidth={ringStrokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{ filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.5))' }}
          />
        </svg>
      )}

      <motion.div
        animate={isBouncing ? undefined : { scale: config.pulseScale }}
        transition={{
          duration: config.speed * 0.8,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
      >
      <motion.div animate={blobControls}>
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
          <defs>
            <radialGradient id={`blob-grad-${state}`} cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor={config.colors[1]} />
              <stop offset="50%" stopColor={config.colors[0]} />
              <stop offset="100%" stopColor={config.colors[2]} />
            </radialGradient>
            <filter id={`blob-glow-${state}`}>
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feFlood floodColor={config.glow} result="color" />
              <feComposite in="color" in2="blur" operator="in" result="shadow" />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <motion.path
            d={blobPaths[0]}
            fill={`url(#blob-grad-${state})`}
            filter={`url(#blob-glow-${state})`}
            animate={{ d: blobPaths }}
            transition={{
              duration: config.speed,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Inner highlight blob */}
          <motion.ellipse
            cx={center - radius * 0.15}
            cy={center - radius * 0.2}
            rx={radius * 0.3}
            ry={radius * 0.2}
            fill="white"
            opacity={0.12}
            animate={{
              rx: [radius * 0.3, radius * 0.35, radius * 0.3],
              ry: [radius * 0.2, radius * 0.15, radius * 0.2],
            }}
            transition={{ duration: config.speed * 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {renderEyes()}
        </svg>
      </motion.div>
      </motion.div>
    </motion.div>
  );
}
