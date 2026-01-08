import { motion } from 'framer-motion';
import { Trophy, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { ModuleHeader } from '@/components/ModuleHeader';
import { Oly } from '@/components/Oly';

interface SuccessArchiveProps {
  onBack: () => void;
  totalFocusMinutes: number;
  tasksCompleted: number;
}

interface Badge {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  unlocked: boolean;
}

export function SuccessArchive({ onBack, totalFocusMinutes, tasksCompleted }: SuccessArchiveProps) {
  const focusHours = Math.floor(totalFocusMinutes / 60);

  const badges: Badge[] = [
    {
      id: 'first_focus',
      icon: <Clock size={24} />,
      title: 'First Focus',
      description: 'Complete your first focus session',
      unlocked: totalFocusMinutes > 0,
    },
    {
      id: 'hour_master',
      icon: <Trophy size={24} />,
      title: 'Hour Master',
      description: 'Focus for 1 hour total',
      unlocked: focusHours >= 1,
    },
    {
      id: 'task_starter',
      icon: <CheckCircle size={24} />,
      title: 'Task Starter',
      description: 'Complete 5 tasks',
      unlocked: tasksCompleted >= 5,
    },
    {
      id: 'task_machine',
      icon: <TrendingUp size={24} />,
      title: 'Task Machine',
      description: 'Complete 25 tasks',
      unlocked: tasksCompleted >= 25,
    },
    {
      id: 'focus_champion',
      icon: <Trophy size={24} />,
      title: 'Focus Champion',
      description: 'Focus for 10 hours total',
      unlocked: focusHours >= 10,
    },
    {
      id: 'task_legend',
      icon: <Trophy size={24} />,
      title: 'Task Legend',
      description: 'Complete 100 tasks',
      unlocked: tasksCompleted >= 100,
    },
  ];

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <div className="min-h-screen p-4">
      <ModuleHeader
        title="Success Archive"
        description="Your wins and focus milestones"
        onBack={onBack}
      />

      <div className="flex justify-center mb-6">
        <Oly state={unlockedCount > 0 ? 'success' : 'neutral'} size={100} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <GlassCard hover={false}>
          <div className="text-center">
            <Clock size={24} className="mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold text-primary">{totalFocusMinutes}</div>
            <div className="text-xs text-muted-foreground">Focus Minutes</div>
          </div>
        </GlassCard>
        <GlassCard hover={false}>
          <div className="text-center">
            <CheckCircle size={24} className="mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold text-primary">{tasksCompleted}</div>
            <div className="text-xs text-muted-foreground">Tasks Done</div>
          </div>
        </GlassCard>
      </div>

      {/* Badges */}
      <h3 className="text-lg font-semibold mb-3 text-foreground">
        Badges ({unlockedCount}/{badges.length})
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <GlassCard 
              hover={false}
              className={badge.unlocked ? 'neon-glow' : 'opacity-50'}
            >
              <div className="text-center">
                <div className={`mx-auto mb-2 ${badge.unlocked ? 'text-primary' : 'text-muted-foreground'}`}>
                  {badge.icon}
                </div>
                <h4 className={`text-sm font-medium ${badge.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {badge.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {badge.description}
                </p>
                {badge.unlocked && (
                  <span className="inline-block mt-2 text-xs text-primary">✓ Unlocked</span>
                )}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
