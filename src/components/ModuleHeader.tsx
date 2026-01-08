import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface ModuleHeaderProps {
  title: string;
  description?: string;
  onBack: () => void;
}

export function ModuleHeader({ title, description, onBack }: ModuleHeaderProps) {
  return (
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4"
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>
      <h1 className="text-2xl font-bold text-foreground neon-text">{title}</h1>
      {description && (
        <p className="text-muted-foreground mt-1">{description}</p>
      )}
    </motion.div>
  );
}
