import { motion } from 'framer-motion';
import { Trophy, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { ModuleHeader } from '@/components/ModuleHeader';
import { Oly } from '@/components/Oly';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

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
  /** How far the user has come, in the badge's own unit. */
  current: number;
  /** What `current` has to reach for the badge to unlock. */
  target: number;
}

function buildBadges(t: TFunction, totalFocusMinutes: number, tasksCompleted: number): Badge[] {
  const focusHours = totalFocusMinutes / 60;
  return [
    {
      id: 'first_focus',
      icon: <Clock size={24} />,
      title: t('successArchive.badgeList.firstFocus.title'),
      description: t('successArchive.badgeList.firstFocus.description'),
      current: totalFocusMinutes > 0 ? 1 : 0,
      target: 1,
    },
    {
      id: 'hour_master',
      icon: <Trophy size={24} />,
      title: t('successArchive.badgeList.hourMaster.title'),
      description: t('successArchive.badgeList.hourMaster.description'),
      // Counted in minutes rather than whole hours so the bar moves from
      // the very first session instead of sitting empty until 60 minutes.
      current: Math.min(totalFocusMinutes, 60),
      target: 60,
    },
    {
      id: 'task_starter',
      icon: <CheckCircle size={24} />,
      title: t('successArchive.badgeList.taskStarter.title'),
      description: t('successArchive.badgeList.taskStarter.description'),
      current: Math.min(tasksCompleted, 5),
      target: 5,
    },
    {
      id: 'task_machine',
      icon: <TrendingUp size={24} />,
      title: t('successArchive.badgeList.taskMachine.title'),
      description: t('successArchive.badgeList.taskMachine.description'),
      current: Math.min(tasksCompleted, 25),
      target: 25,
    },
    {
      id: 'focus_champion',
      icon: <Trophy size={24} />,
      title: t('successArchive.badgeList.focusChampion.title'),
      description: t('successArchive.badgeList.focusChampion.description'),
      current: Math.min(Math.floor(focusHours), 10),
      target: 10,
    },
    {
      id: 'task_legend',
      icon: <Trophy size={24} />,
      title: t('successArchive.badgeList.taskLegend.title'),
      description: t('successArchive.badgeList.taskLegend.description'),
      current: Math.min(tasksCompleted, 100),
      target: 100,
    },
  ];
}

export function SuccessArchive({ onBack, totalFocusMinutes, tasksCompleted }: SuccessArchiveProps) {
  const { t } = useTranslation();

  const badges = buildBadges(t, totalFocusMinutes, tasksCompleted);
  const unlockedCount = badges.filter((b) => b.current >= b.target).length;

  return (
    <div className="min-h-screen p-4">
      <ModuleHeader
        title={t('dashboard.modules.archive.title')}
        description={t('dashboard.modules.archive.description')}
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
            <div className="text-xs text-muted-foreground">{t('successArchive.focusMinutes')}</div>
          </div>
        </GlassCard>
        <GlassCard hover={false}>
          <div className="text-center">
            <CheckCircle size={24} className="mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold text-primary">{tasksCompleted}</div>
            <div className="text-xs text-muted-foreground">{t('successArchive.tasksDone')}</div>
          </div>
        </GlassCard>
      </div>

      {/* Badges */}
      <h3 className="text-lg font-semibold mb-3 text-foreground">
        {t('successArchive.badges')} ({unlockedCount}/{badges.length})
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {badges.map((badge, index) => {
          const unlocked = badge.current >= badge.target;
          const percent = Math.min(100, Math.round((badge.current / badge.target) * 100));

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard
                hover={false}
                className={`relative overflow-hidden ${unlocked ? 'neon-glow' : ''}`}
              >
                {/* "Filling glass" — a tinted level that rises from the
                    bottom of the card as the user approaches the badge,
                    so progress reads at a glance before the number does. */}
                <motion.div
                  className="pointer-events-none absolute inset-x-0 bottom-0 bg-primary/15"
                  initial={{ height: 0 }}
                  animate={{ height: `${percent}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut', delay: index * 0.05 }}
                  aria-hidden
                />

                <div className={`relative text-center ${unlocked ? '' : 'opacity-80'}`}>
                  <div className={`mx-auto mb-2 ${unlocked ? 'text-primary' : 'text-muted-foreground'}`}>
                    {badge.icon}
                  </div>
                  <h4 className={`text-sm font-medium ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {badge.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>

                  {unlocked ? (
                    <span className="inline-block mt-2 text-xs text-primary">
                      {t('successArchive.unlocked')}
                    </span>
                  ) : (
                    <div className="mt-2">
                      <div className="mb-1 text-xs font-semibold text-primary">
                        {badge.current}/{badge.target}
                      </div>
                      {/* Linear bar alongside the fill: the fill gives the
                          feel, the bar gives precision. */}
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/60">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.7, ease: 'easeOut', delay: index * 0.05 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
