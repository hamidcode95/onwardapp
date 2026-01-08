import { motion } from 'framer-motion';

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

const OLY_VIDEOS: Record<OlyState, string> = {
  neutral: 'https://files.catbox.moe/1x8pav.mp4',
  working: 'https://files.catbox.moe/qbgj18.mp4',
  success: 'https://files.catbox.moe/njevvc.mp4',
  active: 'https://files.catbox.moe/qbgj18.mp4',
  finish: 'https://files.catbox.moe/njevvc.mp4',
  confirm: 'https://files.catbox.moe/h3936t.mp4',
  thinking: 'https://files.catbox.moe/qbgj18.mp4', // placeholder
  reveal: 'https://files.catbox.moe/njevvc.mp4', // placeholder
  low_energy: 'https://files.catbox.moe/1x8pav.mp4', // placeholder
  high_energy: 'https://files.catbox.moe/njevvc.mp4',
};

interface OlyProps {
  state?: OlyState;
  size?: number;
  className?: string;
  showRing?: boolean;
  ringProgress?: number;
}

export function Oly({ 
  state = 'neutral', 
  size = 120, 
  className = '',
  showRing = false,
  ringProgress = 0,
}: OlyProps) {
  const videoUrl = OLY_VIDEOS[state];
  const ringSize = size + 20;
  const strokeWidth = 4;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (ringProgress / 100) * circumference;

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center ${className}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {showRing && (
        <svg
          className="absolute"
          width={ringSize}
          height={ringSize}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background ring */}
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress ring */}
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            stroke="hsl(var(--primary))"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.5))',
            }}
          />
        </svg>
      )}
      <div
        className="relative rounded-full overflow-hidden animate-float"
        style={{ 
          width: size, 
          height: size,
          mixBlendMode: 'screen',
        }}
      >
        <video
          key={videoUrl}
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ mixBlendMode: 'screen' }}
        />
      </div>
    </motion.div>
  );
}
