import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Star, Shuffle, Loader2, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { ModuleHeader } from '@/components/ModuleHeader';
import { Oly, OlyState } from '@/components/Oly';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAI } from '@/hooks/useAI';

interface Option {
  id: string;
  text: string;
  priority: number; // 1-3 stars
}

interface DecisionMakerProps {
  onBack: () => void;
}

export function DecisionMaker({ onBack }: DecisionMakerProps) {
  const [options, setOptions] = useState<Option[]>([]);
  const [newOption, setNewOption] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [result, setResult] = useState<Option | null>(null);
  const [aiReason, setAiReason] = useState<string | null>(null);
  const { isLoading, decideForMe } = useAI();

  const getOlyState = (): OlyState => {
    if (isThinking || isLoading) return 'working';
    if (result) return 'success';
    return 'neutral';
  };

  const addOption = () => {
    if (!newOption.trim()) return;
    setOptions([
      ...options,
      { id: crypto.randomUUID(), text: newOption, priority: 1 },
    ]);
    setNewOption('');
  };

  const deleteOption = (id: string) => {
    setOptions(options.filter(o => o.id !== id));
  };

  const setPriority = (id: string, priority: number) => {
    setOptions(options.map(o => 
      o.id === id ? { ...o, priority } : o
    ));
  };

  const makeDecision = () => {
    if (options.length === 0) return;

    setResult(null);
    setAiReason(null);
    setIsThinking(true);

    // Weighted random selection
    const weightedOptions: Option[] = [];
    options.forEach(opt => {
      for (let i = 0; i < opt.priority; i++) {
        weightedOptions.push(opt);
      }
    });

    // Animate thinking
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * weightedOptions.length);
      setResult(weightedOptions[randomIndex]);
      setIsThinking(false);
    }, 2000);
  };

  const makeAIDecision = async () => {
    if (options.length < 2) return;

    setResult(null);
    setAiReason(null);
    
    const aiResult = await decideForMe(options.map(o => ({ text: o.text, priority: o.priority })));
    
    if (aiResult) {
      // Find the matching option
      const chosen = options.find(o => 
        o.text.toLowerCase().includes(aiResult.choice.toLowerCase()) ||
        aiResult.choice.toLowerCase().includes(o.text.toLowerCase())
      ) || options[0];
      
      setResult(chosen);
      setAiReason(aiResult.reason);
    }
  };

  const resetDecision = () => {
    setResult(null);
    setAiReason(null);
  };

  return (
    <div className="min-h-screen p-4">
      <ModuleHeader
        title="Decision Maker"
        description="Let Oly choose your next move"
        onBack={onBack}
      />

      <div className="flex justify-center mb-6">
        <motion.div
          animate={isThinking ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.5, repeat: isThinking ? Infinity : 0 }}
        >
          <Oly state={getOlyState()} size={100} />
        </motion.div>
      </div>

      {/* Result Display */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="mb-6"
          >
            <GlassCard className="neon-glow text-center" hover={false}>
              <h3 className="text-sm text-muted-foreground mb-2">Oly says:</h3>
              <p className="text-2xl font-bold text-primary neon-text">{result.text}</p>
              {aiReason && (
                <p className="text-sm text-muted-foreground mt-2 italic">
                  "{aiReason}"
                </p>
              )}
              <Button
                variant="outline"
                onClick={resetDecision}
                className="mt-4"
              >
                <Shuffle size={16} className="mr-2" />
                Choose Again
              </Button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {!result && (
        <>
          {/* Add Option */}
          <GlassCard className="mb-4" hover={false}>
            <div className="flex gap-2">
              <Input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Add an option..."
                className="bg-background/50 border-border"
                onKeyDown={(e) => e.key === 'Enter' && addOption()}
              />
              <Button onClick={addOption} size="icon" className="shrink-0">
                <Plus size={20} />
              </Button>
            </div>
          </GlassCard>

          {/* Options List */}
          <div className="space-y-3 mb-6">
            <AnimatePresence>
              {options.map((option) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <GlassCard hover={false}>
                    <div className="flex items-center justify-between">
                      <span className="flex-1">{option.text}</span>
                      <div className="flex items-center gap-2">
                        {/* Priority Stars */}
                        <div className="flex">
                          {[1, 2, 3].map((star) => (
                            <button
                              key={star}
                              onClick={() => setPriority(option.id, star)}
                              className="p-1"
                            >
                              <Star
                                size={16}
                                className={star <= option.priority 
                                  ? 'fill-warning text-warning' 
                                  : 'text-muted-foreground'
                                }
                              />
                            </button>
                          ))}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteOption(option.id)}
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

          {/* Decision Buttons */}
          {options.length >= 2 && (
            <div className="space-y-3">
              <Button
                onClick={makeDecision}
                className="w-full neon-glow"
                size="lg"
                disabled={isThinking || isLoading}
              >
                {isThinking ? (
                  <Loader2 size={20} className="mr-2 animate-spin" />
                ) : (
                  <Shuffle size={20} className="mr-2" />
                )}
                {isThinking ? 'Oly is thinking...' : 'Random Pick'}
              </Button>
              
              <Button
                onClick={makeAIDecision}
                variant="outline"
                className="w-full"
                size="lg"
                disabled={isThinking || isLoading}
              >
                {isLoading ? (
                  <Loader2 size={20} className="mr-2 animate-spin" />
                ) : (
                  <Sparkles size={20} className="mr-2" />
                )}
                Let AI Decide
              </Button>
            </div>
          )}

          {options.length < 2 && (
            <p className="text-center text-muted-foreground">
              Add at least 2 options to let Oly decide
            </p>
          )}
        </>
      )}
    </div>
  );
}
