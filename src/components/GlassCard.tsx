import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function GlassCard({ 
  children, 
  className = '', 
  onClick,
  hover = true,
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        'glass-card rounded-lg p-4',
        hover && 'cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-primary/30',
        className
      )}
      onClick={onClick}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
