import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Clock, Brain, Shuffle, Activity, Trophy, Settings as SettingsIcon, MessageCircle } from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';
import { GlassCard } from '@/components/GlassCard';
import { Oly } from '@/components/Oly';
import { TaskShredder } from '@/modules/TaskShredder';
import { FocusRoom } from '@/modules/FocusRoom';
import { BrainDump } from '@/modules/BrainDump';
import { DecisionMaker } from '@/modules/DecisionMaker';
import { MindScanner } from '@/modules/MindScanner';
import { SuccessArchive } from '@/modules/SuccessArchive';
import { Settings } from '@/modules/Settings';
import { OlyChat } from '@/modules/OlyChat';

type ActiveModule = 'hub' | 'shredder' | 'focus' | 'dump' | 'decision' | 'scanner' | 'archive' | 'settings' | 'chat';

interface ModuleCard {
  id: ActiveModule;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const modules: ModuleCard[] = [
  {
    id: 'shredder',
    title: 'Task Shredder',
    description: 'Break big goals into tiny bites',
    icon: <Scissors size={28} />,
    color: 'text-primary',
  },
  {
    id: 'focus',
    title: 'Focus Room',
    description: 'Work alongside Oly with visual timers',
    icon: <Clock size={28} />,
    color: 'text-primary',
  },
  {
    id: 'dump',
    title: 'Brain Dump',
    description: 'Empty your mind instantly',
    icon: <Brain size={28} />,
    color: 'text-primary',
  },
  {
    id: 'decision',
    title: 'Decision Maker',
    description: 'Let Oly choose your next move',
    icon: <Shuffle size={28} />,
    color: 'text-primary',
  },
  {
    id: 'scanner',
    title: 'Mind Scanner',
    description: 'Check your mental fuel level',
    icon: <Activity size={28} />,
    color: 'text-primary',
  },
  {
    id: 'archive',
    title: 'Success Archive',
    description: 'Your wins and focus milestones',
    icon: <Trophy size={28} />,
    color: 'text-primary',
  },
  {
    id: 'chat',
    title: 'Chat with Oly',
    description: 'Talk to your ADHD buddy',
    icon: <MessageCircle size={28} />,
    color: 'text-primary',
  },
];

const Index = () => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('hub');
  const {
    state,
    updateUserName,
    addFocusMinutes,
    addTask,
    toggleTask,
    removeTask,
    setOlySize,
    setAmbientSound,
  } = useAppState();

  const goToHub = () => setActiveModule('hub');

  // Render active module
  const renderModule = () => {
    switch (activeModule) {
      case 'shredder':
        return <TaskShredder onBack={goToHub} />;
      case 'focus':
        return (
          <FocusRoom
            onBack={goToHub}
            onComplete={addFocusMinutes}
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
      default:
        return null;
    }
  };

  // Hub view
  if (activeModule === 'hub') {
    return (
      <div className="min-h-screen bg-background p-4 pb-20">
        {/* Header with greeting */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-foreground neon-text">
            Hey, {state.userName}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">What shall we tackle today?</p>
        </motion.div>

        {/* Oly Character */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Oly state="neutral" size={state.olySize} />
        </motion.div>

        {/* Module Grid */}
        <div className="grid grid-cols-2 gap-3">
          {modules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
            >
              <GlassCard
                onClick={() => setActiveModule(module.id)}
                className="h-full"
              >
                <div className={`${module.color} mb-2`}>{module.icon}</div>
                <h3 className="font-semibold text-foreground text-sm">{module.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{module.description}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Settings Button */}
        <motion.div
          className="fixed bottom-4 right-4"
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
        <motion.div
          className="mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
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
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  // Module view with animation
  return (
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
  );
};

export default Index;
