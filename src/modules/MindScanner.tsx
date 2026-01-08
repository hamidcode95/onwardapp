import { useState } from 'react';
import { motion } from 'framer-motion';
import { Battery, Coffee, Zap, Moon } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { ModuleHeader } from '@/components/ModuleHeader';
import { Oly, OlyState } from '@/components/Oly';
import { Slider } from '@/components/ui/slider';

interface MindScannerProps {
  onBack: () => void;
}

interface Recommendation {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function MindScanner({ onBack }: MindScannerProps) {
  const [energyLevel, setEnergyLevel] = useState([50]);

  const getOlyState = (): OlyState => {
    return energyLevel[0] < 40 ? 'low_energy' : 'high_energy';
  };

  const getRecommendations = (): Recommendation[] => {
    const level = energyLevel[0];

    if (level < 25) {
      return [
        { icon: <Moon size={20} />, title: 'Take a Rest', description: 'Your dopamine tank is low. Consider a short nap or break.' },
        { icon: <Coffee size={20} />, title: 'Gentle Fuel', description: 'Have some water or a light snack.' },
      ];
    } else if (level < 50) {
      return [
        { icon: <Coffee size={20} />, title: 'Micro-Tasks', description: 'Try the 15m Sprint in Focus Room for a quick win.' },
        { icon: <Battery size={20} />, title: 'Brain Dump', description: 'Clear your mind in Brain Dump to feel lighter.' },
      ];
    } else if (level < 75) {
      return [
        { icon: <Zap size={20} />, title: 'Deep Work', description: 'You\'re in a good zone! Try a 25m Deep Work session.' },
        { icon: <Battery size={20} />, title: 'Task Shredding', description: 'Great time to break down that big project.' },
      ];
    } else {
      return [
        { icon: <Zap size={20} />, title: 'Epic Mode', description: 'You\'re charged! Go for a 45m Epic focus session.' },
        { icon: <Battery size={20} />, title: 'Big Goals', description: 'Perfect time to tackle your most challenging task.' },
      ];
    }
  };

  const getEnergyColor = () => {
    const level = energyLevel[0];
    if (level < 25) return 'text-destructive';
    if (level < 50) return 'text-warning';
    return 'text-primary';
  };

  const getEnergyLabel = () => {
    const level = energyLevel[0];
    if (level < 25) return 'Low Energy';
    if (level < 50) return 'Moderate';
    if (level < 75) return 'Good';
    return 'Fully Charged!';
  };

  return (
    <div className="min-h-screen p-4">
      <ModuleHeader
        title="Mind Scanner"
        description="Check your mental fuel level"
        onBack={onBack}
      />

      <div className="flex justify-center mb-6">
        <Oly state={getOlyState()} size={100} />
      </div>

      {/* Energy Level Display */}
      <GlassCard className="mb-6" hover={false}>
        <div className="text-center mb-4">
          <motion.div
            key={energyLevel[0]}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className={`text-4xl font-bold ${getEnergyColor()}`}
          >
            {energyLevel[0]}%
          </motion.div>
          <p className={`text-sm ${getEnergyColor()}`}>{getEnergyLabel()}</p>
        </div>

        <div className="px-2">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Empty</span>
            <span>Full</span>
          </div>
          <Slider
            value={energyLevel}
            onValueChange={setEnergyLevel}
            max={100}
            step={5}
            className="w-full"
          />
        </div>

        {/* Battery Visual */}
        <div className="mt-4 flex justify-center">
          <div className="w-48 h-8 border-2 border-muted rounded-full relative overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary/50 to-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${energyLevel[0]}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </GlassCard>

      {/* Recommendations */}
      <h3 className="text-lg font-semibold mb-3 text-foreground">
        Oly's Recommendations
      </h3>
      <div className="space-y-3">
        {getRecommendations().map((rec, index) => (
          <motion.div
            key={rec.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard hover={false}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/20 text-primary">
                  {rec.icon}
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{rec.title}</h4>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
