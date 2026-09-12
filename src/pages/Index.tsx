import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Clock, Brain, Shuffle, Activity, Trophy, Settings as SettingsIcon, MessageCircle, Home as HomeIcon } from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useTimeAnchors } from '@/hooks/useTimeAnchors';
import { GlassCard } from '@/components/GlassCard';
import { Oly } from '@/components/Oly';
import { FeatherCounter } from '@/components/FeatherCounter';
import { LivingBackground } from '@/components/LivingBackground';
import { DailySpark } from '@/components/DailySpark';
import { SanctuaryItems } from '@/components/SanctuaryItems';
import { TimeAnchorBanner } from '@/components/TimeAnchorBanner';
import { AlarmModal } from '@/components/AlarmModal';
import { SanctuaryRoom } from '@/modules/SanctuaryRoom';
import { TaskShredder } from '@/modules/TaskShredder';
import { FocusRoom } from '@/modules/FocusRoom';
import { BrainDump } from '@/modules/BrainDump';
import { DecisionMaker } from '@/modules/DecisionMaker';
import { MindScanner } from '@/modules/MindScanner';
import { SuccessArchive } from '@/modules/SuccessArchive';
import { Settings } from '@/modules/Settings';
import { OlyChat } from '@/modules/OlyChat';
import { TimeAnchor } from '@/modules/TimeAnchor';
import { QuickTimeAnchorCard } from '@/components/QuickTimeAnchorCard';
import { syncAnchorCreate, syncAnchorDismiss, syncAnchorDelete } from '@/lib/anchorSync';
import { notifications } from '@/lib/notifications';
import { useTranslation } from 'react-i18next';

type ActiveModule = 'hub' | 'shredder' | 'focus' | 'dump' | 'decision' | 'scanner' | 'archive' | 'settings' | 'chat' | 'sanctuary' | 'anchor';

interface ModuleCard {
  id: ActiveModule;
  icon: React.ReactNode;
}

const modules: ModuleCard[] = [
  { id: 'shredder', icon: <Scissors size={28} /> },
  { id: 'focus', icon: <Clock size={28} /> },
  { id: 'dump', icon: <Brain size={28} /> },
  { id: 'decision', icon: <Shuffle size={28} /> },
  { id: 'scanner', icon: <Activity size={28} /> },
  { id: 'archive', icon: <Trophy size={28} /> },
  { id: 'chat', icon: <MessageCircle size={28} /> },
  { id: 'sanctuary' as ActiveModule, icon: <HomeIcon size={28} /> },
];

const Index = () => {
  const { t } = useTranslation();
  const [activeModule, setActiveModule] = useState<ActiveModule>('hub');
  const [showDailySpark, setShowDailySpark] = useState(false);
  const { user } = useAuth();
  const {
    requestPermission,
    startMotivationLoop,
    startFocusReminders,
    notifyFocusComplete,
    notify,
    sendToast,
  } = useNotifications();
  const {
    state,
    updateUserName,
    addFocusMinutes,
    addTask,
    setOlySize,
    addFeathers,
    purchaseItem,
    addTimeAnchor,
    removeTimeAnchor,
    markTimeAnchorFired,
    dismissTimeAnchor,
    markVisitToday,
    isFirstVisitToday,
  } = useAppState();

  const { nextAnchor, activeAlarm, timeLeftMs, dismissAlarm } = useTimeAnchors({
    timeAnchors: state.timeAnchors,
    markTimeAnchorFired,
    dismissTimeAnchor,
    addFeathers,
    notify,
  });

  // Mirrors Time Anchors into Supabase (in addition to local state) so the
  // background push function can find them even when the app is closed.
  const handleAddTimeAnchor = (label: string, targetTime: string) => {
    const anchor = addTimeAnchor(label, targetTime);
    if (user) syncAnchorCreate({ id: anchor.id, userId: user.id, label, targetTime });
    notifications.scheduleAt({
      id: anchor.id,
      title: '⏰ Time Anchor',
      body: label,
      at: new Date(targetTime),
      data: { type: 'time-anchor', anchorId: anchor.id },
    });
  };

  const handleRemoveTimeAnchor = (id: string) => {
    removeTimeAnchor(id);
    syncAnchorDelete(id);
    notifications.cancelScheduled(id);
  };

  const handleDismissAlarm = (id: string) => {
    dismissAlarm(id, true);
    syncAnchorDismiss(id);
    notifications.cancelScheduled(id);
  };

  // Deep link from a tapped push notification (?anchor=<id>) — force the
  // full-screen alarm experience immediately instead of waiting for the
  // normal polling loop, and recover the anchor from Supabase if local
  // state doesn't have it (e.g. after a refresh).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const anchorId = params.get('anchor');
    if (!anchorId) return;

    // Clean the URL so a later refresh doesn't re-trigger this.
    window.history.replaceState({}, '', window.location.pathname);

    const existing = state.timeAnchors.find((a) => a.id === anchorId);
    if (existing) {
      if (!existing.fired) markTimeAnchorFired(anchorId);
      return;
    }

    // Not in local state (different session/refresh) — pull it from the
    // server mirror so the alarm still shows.
    import('@/integrations/supabase/client').then(({ supabase }) => {
      supabase
        .from('time_anchors')
        .select('id, label, target_time, dismissed')
        .eq('id', anchorId)
        .maybeSingle()
        .then(({ data }) => {
          if (data && !data.dismissed) {
            const anchor = addTimeAnchor(data.label, data.target_time, data.id);
            markTimeAnchorFired(anchor.id);
          }
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Request notification permission
  useEffect(() => {
    requestPermission().then((granted) => {
      if (granted) {
        startMotivationLoop();
        startFocusReminders();
      }
    });
  }, []);

  // Auto-set username from OAuth profile
  useEffect(() => {
    if (user) {
      const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'Friend';
      if (state.userName === 'Friend' || state.userName === '') {
        updateUserName(name);
      }
    }
  }, [user]);

  // Daily spark on first visit
  useEffect(() => {
    if (isFirstVisitToday()) {
      setShowDailySpark(true);
      markVisitToday();
    }
  }, []);

  const goToHub = () => setActiveModule('hub');

  const handleFeatherEarn = (amount: number) => {
    addFeathers(amount);
    sendToast(t('toasts.feathersEarnedTitle'), t('toasts.feathersEarnedBody', { amount }));
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'shredder':
        return <TaskShredder onBack={goToHub} onFeatherEarn={() => handleFeatherEarn(10)} />;
      case 'focus':
        return (
          <FocusRoom
            onBack={goToHub}
            onComplete={(minutes) => {
              addFocusMinutes(minutes);
              notifyFocusComplete(minutes);
              handleFeatherEarn(50);
            }}
          />
        );
      case 'dump':
        return (
          <BrainDump
            onBack={goToHub}
            onMoveToShredder={(text) => {
              addTask(text);
              setActiveModule('shredder');
            }}
          />
        );
      case 'decision':
        return <DecisionMaker onBack={goToHub} />;
      case 'scanner':
        return <MindScanner onBack={goToHub} />;
      case 'archive':
        return (
          <SuccessArchive
            onBack={goToHub}
            totalFocusMinutes={state.totalFocusMinutes}
            tasksCompleted={state.tasksCompleted}
          />
        );
      case 'settings':
        return (
          <Settings
            onBack={goToHub}
            userName={state.userName}
            onUpdateName={updateUserName}
            olySize={state.olySize}
            onUpdateOlySize={setOlySize}
          />
        );
      case 'chat':
        return <OlyChat onBack={goToHub} />;
      case 'sanctuary':
        return (
          <SanctuaryRoom
            onBack={goToHub}
            feathers={state.feathers}
            purchasedItems={state.purchasedItems}
            onPurchase={purchaseItem}
          />
        );
      case 'anchor':
        return (
          <TimeAnchor
            onBack={goToHub}
            anchors={state.timeAnchors}
            onAdd={handleAddTimeAnchor}
            onRemove={handleRemoveTimeAnchor}
            userId={user?.id}
          />
        );
      default:
        return null;
    }
  };

  // Hub view
  if (activeModule === 'hub') {
    return (
      <div className="min-h-screen bg-background p-4 pb-20 relative">
        <LivingBackground />
        <FeatherCounter count={state.feathers} />
        <TimeAnchorBanner
          anchor={nextAnchor}
          timeLeftMs={timeLeftMs}
          onClick={() => setActiveModule('anchor')}
        />

        {/* Header */}
        <motion.div
          className="text-center mb-6 relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-foreground neon-text">
            {t('dashboard.greeting', { name: state.userName })} 👋
          </h1>
          <p className="text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
        </motion.div>

        {/* Oly with Sanctuary Items & Daily Spark */}
        <motion.div
          className="flex justify-center mb-8 relative z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="relative inline-flex items-center justify-center">
            <DailySpark show={showDailySpark} onDismiss={() => setShowDailySpark(false)} />
            <SanctuaryItems purchasedItems={state.purchasedItems} olySize={state.olySize} />
            <Oly
              state="neutral"
              size={state.olySize}
              onClick={() => {
                const msgs = t('toasts.olyGreetings', { returnObjects: true }) as string[];
                sendToast('🫧 Oly', msgs[Math.floor(Math.random() * msgs.length)]);
              }}
            />
          </div>
        </motion.div>

        {/* Module Grid */}
        <div className="grid grid-cols-2 gap-3 relative z-10">
          <QuickTimeAnchorCard
            onAdd={handleAddTimeAnchor}
            onManage={() => setActiveModule('anchor')}
          />
          {modules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
            >
              <GlassCard
                onClick={() => setActiveModule(module.id)}
                className={`h-full ${module.id === 'sanctuary' ? 'border border-[hsl(140,50%,55%)] shadow-[0_0_12px_hsla(140,50%,55%,0.3)]' : ''}`}
              >
                <div className={`mb-2 ${module.id === 'sanctuary' ? 'text-[hsl(45,80%,55%)]' : 'text-primary'}`}>{module.icon}</div>
                <h3 className="font-semibold text-foreground text-sm">{t(`dashboard.modules.${module.id}.title`)}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t(`dashboard.modules.${module.id}.description`)}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Settings Button */}
        <motion.div
          className="fixed bottom-4 right-4 z-20"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.8 }}
        >
          <button
            onClick={() => setActiveModule('settings')}
            className="glass-card p-3 rounded-full neon-glow hover:scale-110 transition-transform"
          >
            <SettingsIcon size={24} className="text-primary" />
          </button>
        </motion.div>

        {/* Quick Stats */}
        <motion.div className="mt-6 relative z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <GlassCard hover={false} className="flex justify-around py-3">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{state.totalFocusMinutes}</div>
              <div className="text-xs text-muted-foreground">Focus Min</div>
            </div>
            <div className="w-px bg-border" />
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{state.tasksCompleted}</div>
              <div className="text-xs text-muted-foreground">Tasks Done</div>
            </div>
            <div className="w-px bg-border" />
            <div className="text-center">
              <div className="text-lg font-bold text-primary">🪶 {state.feathers}</div>
              <div className="text-xs text-muted-foreground">Feathers</div>
            </div>
          </GlassCard>
        </motion.div>

        <AlarmModal
          anchor={activeAlarm}
          onDismiss={() => activeAlarm && handleDismissAlarm(activeAlarm.id)}
        />
      </div>
    );
  }

  // Module view
  return (
    <div className="relative">
      <FeatherCounter count={state.feathers} />
      {activeModule !== 'anchor' && (
        <TimeAnchorBanner
          anchor={nextAnchor}
          timeLeftMs={timeLeftMs}
          onClick={() => setActiveModule('anchor')}
        />
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeModule}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen bg-background"
        >
          {renderModule()}
        </motion.div>
      </AnimatePresence>
      <AlarmModal
        anchor={activeAlarm}
        onDismiss={() => activeAlarm && handleDismissAlarm(activeAlarm.id)}
      />
    </div>
  );
};

export default Index;
