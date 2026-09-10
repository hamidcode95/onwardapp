import { useState } from 'react';
import { motion } from 'framer-motion';
import { Battery, Coffee, Zap, Moon, Sparkles, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { ModuleHeader } from '@/components/ModuleHeader';
import { Oly, OlyState } from '@/components/Oly';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useAI } from '@/hooks/useAI';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

interface MindScannerProps {
  onBack: () => void;
}

interface Recommendation {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function MindScanner({ onBack }: MindScannerProps) {
  const { t } = useTranslation();
  const [energyLevel, setEnergyLevel] = useState([50]);
  const [aiSuggestion, setAiSuggestion] = useState<{
    suggestion: string;
    reason: string;
    emoji: string;
  } | null>(null);
  const { isLoading, suggestActivity } = useAI();

  const getOlyState = (): OlyState => {
    if (isLoading) return 'working';
    return energyLevel[0] < 40 ? 'neutral' : 'success';
  };

  const getRecommendations = (t: TFunction): Recommendation[] => {
    const level = energyLevel[0];
    const r = (key: string) => ({
      title: t(`mindScanner.recommendations.${key}.title`),
      description: t(`mindScanner.recommendations.${key}.description`),
    });

    if (level < 25) {
      return [
        { icon: <Moon size={20} />, ...r('rest') },
        { icon: <Coffee size={20} />, ...r('gentleFuel') },
      ];
    } else if (level < 50) {
      return [
        { icon: <Coffee size={20} />, ...r('microTasks') },
        { icon: <Battery size={20} />, ...r('brainDump') },
      ];
    } else if (level < 75) {
      return [
        { icon: <Zap size={20} />, ...r('deepWork') },
        { icon: <Battery size={20} />, ...r('taskShredding') },
      ];
    } else {
      return [
        { icon: <Zap size={20} />, ...r('epicMode') },
        { icon: <Battery size={20} />, ...r('bigGoals') },
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
    if (level < 25) return t('mindScanner.energyLabels.low');
    if (level < 50) return t('mindScanner.energyLabels.moderate');
    if (level < 75) return t('mindScanner.energyLabels.good');
    return t('mindScanner.energyLabels.full');
  };

  const getAISuggestion = async () => {
    setAiSuggestion(null);
    const result = await suggestActivity(energyLevel[0]);
    if (result) {
      setAiSuggestion(result);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <ModuleHeader
        title={t('dashboard.modules.scanner.title')}
        description={t('dashboard.modules.scanner.description')}
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
            <span>{t('mindScanner.empty')}</span>
            <span>{t('mindScanner.full')}</span>
          </div>
          <Slider
            value={energyLevel}
            onValueChange={(value) => {
              setEnergyLevel(value);
              setAiSuggestion(null);
            }}
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

      {/* AI Suggestion Button */}
      <Button
        onClick={getAISuggestion}
        disabled={isLoading}
        className="w-full mb-4 neon-glow"
        size="lg"
      >
        {isLoading ? (
          <Loader2 className="mr-2 animate-spin" size={20} />
        ) : (
          <Sparkles className="mr-2" size={20} />
        )}
        {t('mindScanner.getAiSuggestion')}
      </Button>

      {/* AI Suggestion Result */}
      {aiSuggestion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <GlassCard hover={false} className="neon-glow">
            <div className="text-center">
              <span className="text-4xl mb-3 block">{aiSuggestion.emoji}</span>
              <h4 className="font-bold text-primary text-lg mb-2">
                {aiSuggestion.suggestion}
              </h4>
              <p className="text-sm text-muted-foreground">
                {aiSuggestion.reason}
              </p>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Recommendations */}
      <h3 className="text-lg font-semibold mb-3 text-foreground">
        {t('mindScanner.quickRecommendations')}
      </h3>
      <div className="space-y-3">
        {getRecommendations(t).map((rec, index) => (
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
