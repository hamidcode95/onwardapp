import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { ModuleHeader } from '@/components/ModuleHeader';
import { Oly, OlyState } from '@/components/Oly';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAI } from '@/hooks/useAI';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  subTasks: { id: string; text: string; completed: boolean }[];
}

interface TaskShredderProps {
  onBack: () => void;
  onFeatherEarn?: () => void;
}

export function TaskShredder({ onBack, onFeatherEarn }: TaskShredderProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [newSubTask, setNewSubTask] = useState('');
  const { isLoading, shredTask } = useAI();

  const getOlyState = (): OlyState => {
    if (isLoading) return 'working';
    if (tasks.length === 0) return 'neutral';
    const allCompleted = tasks.every(t => 
      t.subTasks.length > 0 
        ? t.subTasks.every(st => st.completed) 
        : t.completed
    );
    if (allCompleted && tasks.length > 0) return 'success';
    return 'working';
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([
      ...tasks,
      { id: crypto.randomUUID(), text: newTask, completed: false, subTasks: [] },
    ]);
    setNewTask('');
  };

  const addTaskWithAI = async () => {
    if (!newTask.trim()) return;
    
    const taskId = crypto.randomUUID();
    const newTaskObj: Task = { 
      id: taskId, 
      text: newTask, 
      completed: false, 
      subTasks: [] 
    };
    
    setTasks(prev => [...prev, newTaskObj]);
    setExpandedTask(taskId);
    
    const subTasks = await shredTask(newTask);
    
    if (subTasks && subTasks.length > 0) {
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { 
              ...t, 
              subTasks: subTasks.map(text => ({
                id: crypto.randomUUID(),
                text,
                completed: false,
              }))
            }
          : t
      ));
    }
    
    setNewTask('');
  };

  const addSubTask = (taskId: string) => {
    if (!newSubTask.trim()) return;
    setTasks(tasks.map(t => 
      t.id === taskId 
        ? { ...t, subTasks: [...t.subTasks, { id: crypto.randomUUID(), text: newSubTask, completed: false }] }
        : t
    ));
    setNewSubTask('');
  };

  const toggleSubTask = (taskId: string, subTaskId: string) => {
    setTasks(tasks.map(t => 
      t.id === taskId 
        ? { 
            ...t, 
            subTasks: t.subTasks.map(st => {
              if (st.id === subTaskId) {
                if (!st.completed) onFeatherEarn?.();
                return { ...st, completed: !st.completed };
              }
              return st;
            }),
          }
        : t
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    if (expandedTask === taskId) setExpandedTask(null);
  };

  const getProgress = (task: Task) => {
    if (task.subTasks.length === 0) return 0;
    const completed = task.subTasks.filter(st => st.completed).length;
    return Math.round((completed / task.subTasks.length) * 100);
  };

  return (
    <div className="min-h-screen p-4">
      <ModuleHeader
        title="Task Shredder"
        description="Break big goals into tiny bites"
        onBack={onBack}
      />

      <div className="flex justify-center mb-6">
        <Oly state={getOlyState()} size={100} />
      </div>

      {/* Add Task Input */}
      <GlassCard className="mb-4" hover={false}>
        <div className="flex gap-2">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Enter a big task to shred..."
            className="bg-background/50 border-border"
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            disabled={isLoading}
          />
          <Button 
            onClick={addTask} 
            size="icon" 
            variant="outline"
            className="shrink-0"
            disabled={isLoading || !newTask.trim()}
          >
            <Plus size={20} />
          </Button>
          <Button 
            onClick={addTaskWithAI} 
            size="icon" 
            className="shrink-0 neon-glow"
            disabled={isLoading || !newTask.trim()}
            title="AI Auto-Shred"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Sparkles size={20} />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          ✨ Click the sparkle button to let AI break down your task automatically!
        </p>
      </GlassCard>

      {/* Tasks List */}
      <div className="space-y-3">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <GlassCard hover={false}>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <ChevronRight
                      size={20}
                      className={`text-primary transition-transform ${expandedTask === task.id ? 'rotate-90' : ''}`}
                    />
                    <span className="font-medium">{task.text}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.subTasks.length > 0 && (
                      <span className="text-sm text-primary">{getProgress(task)}%</span>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                {/* Expanded Sub-tasks */}
                <AnimatePresence>
                  {expandedTask === task.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pl-7 space-y-2">
                        {/* Sub-task input */}
                        <div className="flex gap-2">
                          <Input
                            value={newSubTask}
                            onChange={(e) => setNewSubTask(e.target.value)}
                            placeholder="Add a sub-task..."
                            className="bg-background/50 border-border text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && addSubTask(task.id)}
                          />
                          <Button 
                            onClick={() => addSubTask(task.id)} 
                            size="icon" 
                            variant="outline"
                            className="h-9 w-9 shrink-0"
                          >
                            <Plus size={16} />
                          </Button>
                        </div>

                        {/* Sub-tasks list */}
                        {task.subTasks.map((subTask) => (
                          <motion.div
                            key={subTask.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 py-2"
                          >
                            <Checkbox
                              checked={subTask.completed}
                              onCheckedChange={() => toggleSubTask(task.id, subTask.id)}
                              className="border-primary data-[state=checked]:bg-primary"
                            />
                            <span className={`text-sm ${subTask.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {subTask.text}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {tasks.length === 0 && (
        <div className="text-center text-muted-foreground mt-8">
          <p>No tasks yet. Add a big task and let AI shred it! ✨</p>
        </div>
      )}
    </div>
  );
}
