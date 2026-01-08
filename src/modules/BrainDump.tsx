import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { ModuleHeader } from '@/components/ModuleHeader';
import { Oly } from '@/components/Oly';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Thought {
  id: string;
  text: string;
  createdAt: Date;
}

interface BrainDumpProps {
  onBack: () => void;
  onMoveToShredder?: (text: string) => void;
}

export function BrainDump({ onBack, onMoveToShredder }: BrainDumpProps) {
  const [thoughts, setThoughts] = useState<Thought[]>(() => {
    const saved = localStorage.getItem('brain_dump_thoughts');
    return saved ? JSON.parse(saved) : [];
  });
  const [newThought, setNewThought] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const saveThoughts = (updated: Thought[]) => {
    setThoughts(updated);
    localStorage.setItem('brain_dump_thoughts', JSON.stringify(updated));
  };

  const addThought = () => {
    if (!newThought.trim()) return;
    const thought: Thought = {
      id: crypto.randomUUID(),
      text: newThought,
      createdAt: new Date(),
    };
    saveThoughts([thought, ...thoughts]);
    setNewThought('');
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 2000);
  };

  const deleteThought = (id: string) => {
    saveThoughts(thoughts.filter(t => t.id !== id));
  };

  const moveToShredder = (thought: Thought) => {
    if (onMoveToShredder) {
      onMoveToShredder(thought.text);
      deleteThought(thought.id);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <ModuleHeader
        title="Brain Dump"
        description="Empty your mind instantly"
        onBack={onBack}
      />

      <div className="flex justify-center mb-6">
        <Oly state={showConfirm ? 'confirm' : 'neutral'} size={100} />
      </div>

      {/* Quick Entry */}
      <GlassCard className="mb-6" hover={false}>
        <Textarea
          value={newThought}
          onChange={(e) => setNewThought(e.target.value)}
          placeholder="What's on your mind? Just dump it here..."
          className="bg-background/50 border-border min-h-[100px] resize-none"
        />
        <Button
          onClick={addThought}
          className="w-full mt-3 neon-glow"
          disabled={!newThought.trim()}
        >
          <Plus size={20} className="mr-2" />
          Dump It
        </Button>
      </GlassCard>

      {/* Saved Thoughts */}
      <div className="space-y-3">
        <AnimatePresence>
          {thoughts.map((thought) => (
            <motion.div
              key={thought.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
            >
              <GlassCard hover={false}>
                <p className="text-foreground mb-3">{thought.text}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {new Date(thought.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    {onMoveToShredder && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveToShredder(thought)}
                        className="text-xs"
                      >
                        <ArrowRight size={14} className="mr-1" />
                        To Shredder
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteThought(thought.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {thoughts.length === 0 && (
        <div className="text-center text-muted-foreground mt-4">
          <p>No thoughts saved yet. Start dumping!</p>
        </div>
      )}
    </div>
  );
}
