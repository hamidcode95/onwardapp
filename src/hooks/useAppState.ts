import { useState, useEffect, useCallback } from 'react';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  parentId?: string;
}

export interface MoodEntry {
  date: string;
  level: number;
}

export interface BrainDumpEntry {
  id: string;
  text: string;
  createdAt: string;
}

export interface AppState {
  userName: string;
  totalFocusMinutes: number;
  tasksCompleted: number;
  moodHistory: MoodEntry[];
  savedThoughts: BrainDumpEntry[];
  tasks: Task[];
  olySize: number;
  ambientSound: string | null;
  feathers: number;
  purchasedItems: string[];
  lastVisitDate: string | null;
}

const defaultState: AppState = {
  userName: 'Friend',
  totalFocusMinutes: 0,
  tasksCompleted: 0,
  moodHistory: [],
  savedThoughts: [],
  tasks: [],
  olySize: 100,
  ambientSound: null,
  feathers: 0,
  purchasedItems: [],
  lastVisitDate: null,
};

const STORAGE_KEY = 'onward_adhd_state';

export function useAppState() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return { ...defaultState, ...JSON.parse(saved) };
      } catch {
        return defaultState;
      }
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updateUserName = useCallback((name: string) => {
    setState(prev => ({ ...prev, userName: name }));
  }, []);

  const addFocusMinutes = useCallback((minutes: number) => {
    setState(prev => ({
      ...prev,
      totalFocusMinutes: prev.totalFocusMinutes + minutes,
    }));
  }, []);

  const completeTask = useCallback(() => {
    setState(prev => ({
      ...prev,
      tasksCompleted: prev.tasksCompleted + 1,
    }));
  }, []);

  const addMoodEntry = useCallback((level: number) => {
    setState(prev => ({
      ...prev,
      moodHistory: [
        ...prev.moodHistory,
        { date: new Date().toISOString(), level },
      ],
    }));
  }, []);

  const addThought = useCallback((text: string) => {
    const entry: BrainDumpEntry = {
      id: crypto.randomUUID(),
      text,
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      savedThoughts: [...prev.savedThoughts, entry],
    }));
    return entry;
  }, []);

  const removeThought = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      savedThoughts: prev.savedThoughts.filter(t => t.id !== id),
    }));
  }, []);

  const addTask = useCallback((text: string, parentId?: string) => {
    const task: Task = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      parentId,
    };
    setState(prev => ({
      ...prev,
      tasks: [...prev.tasks, task],
    }));
    return task;
  }, []);

  const toggleTask = useCallback((id: string) => {
    setState(prev => {
      const task = prev.tasks.find(t => t.id === id);
      const wasCompleted = task?.completed;
      return {
        ...prev,
        tasks: prev.tasks.map(t =>
          t.id === id ? { ...t, completed: !t.completed } : t
        ),
        tasksCompleted: wasCompleted
          ? prev.tasksCompleted - 1
          : prev.tasksCompleted + 1,
      };
    });
  }, []);

  const removeTask = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id && t.parentId !== id),
    }));
  }, []);

  const setOlySize = useCallback((size: number) => {
    setState(prev => ({ ...prev, olySize: size }));
  }, []);

  const setAmbientSound = useCallback((sound: string | null) => {
    setState(prev => ({ ...prev, ambientSound: sound }));
  }, []);

  const addFeathers = useCallback((amount: number) => {
    setState(prev => ({ ...prev, feathers: prev.feathers + amount }));
  }, []);

  const spendFeathers = useCallback((amount: number): boolean => {
    let success = false;
    setState(prev => {
      if (prev.feathers >= amount) {
        success = true;
        return { ...prev, feathers: prev.feathers - amount };
      }
      return prev;
    });
    return success;
  }, []);

  const purchaseItem = useCallback((itemId: string, cost: number): boolean => {
    let success = false;
    setState(prev => {
      if (prev.feathers >= cost && !prev.purchasedItems.includes(itemId)) {
        success = true;
        return {
          ...prev,
          feathers: prev.feathers - cost,
          purchasedItems: [...prev.purchasedItems, itemId],
        };
      }
      return prev;
    });
    return success;
  }, []);

  const markVisitToday = useCallback(() => {
    const today = new Date().toDateString();
    setState(prev => ({ ...prev, lastVisitDate: today }));
  }, []);

  const isFirstVisitToday = useCallback(() => {
    const today = new Date().toDateString();
    return state.lastVisitDate !== today;
  }, [state.lastVisitDate]);

  return {
    state,
    updateUserName,
    addFocusMinutes,
    completeTask,
    addMoodEntry,
    addThought,
    removeThought,
    addTask,
    toggleTask,
    removeTask,
    setOlySize,
    setAmbientSound,
    addFeathers,
    spendFeathers,
    purchaseItem,
    markVisitToday,
    isFirstVisitToday,
  };
}
