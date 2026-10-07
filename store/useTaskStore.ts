// src/store/useTaskStore.ts
import { create } from 'zustand';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Task {
  id: string;
  userId: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  isCompleted: boolean;
  createdAt: number;
}

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  subscribeToTasks: (userId: string) => () => void;
  addTask: (task: Task) => Promise<void>;
  toggleTask: (taskId: string, currentStatus: boolean) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  isLoading: true,

  // Real-time Firestore Sync
  subscribeToTasks: (userId: string) => {
    set({ isLoading: true });
    const q = query(collection(db, 'tasks'), where('userId', '==', userId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      
      // Sort by creation date locally (newest first)
      fetchedTasks.sort((a, b) => b.createdAt - a.createdAt);
      set({ tasks: fetchedTasks, isLoading: false });
    }, (error) => {
      console.error("Error fetching tasks:", error);
      set({ isLoading: false });
    });

    return unsubscribe;
  },

  // Optimistic additions
  addTask: async (task) => {
    const previousTasks = get().tasks;
    set({ tasks: [task, ...previousTasks] }); // Instantly update UI

    try {
      await setDoc(doc(db, 'tasks', task.id), task);
    } catch (error) {
      console.error("Failed to add task:", error);
      set({ tasks: previousTasks }); // Revert on failure
    }
  },

  // Instant check/uncheck (<16ms)
  toggleTask: async (taskId, currentStatus) => {
    const nextStatus = !currentStatus;
    const previousTasks = get().tasks;
    
    // Instantly update UI locally
    set({
      tasks: previousTasks.map(t => t.id === taskId ? { ...t, isCompleted: nextStatus } : t)
    });

    try {
      await updateDoc(doc(db, 'tasks', taskId), { isCompleted: nextStatus });
    } catch (error) {
      console.error("Failed to toggle task:", error);
      set({ tasks: previousTasks }); // Revert on failure
    }
  },

  // Optimistic deletion
  deleteTask: async (taskId) => {
    const previousTasks = get().tasks;
    set({ tasks: previousTasks.filter(t => t.id !== taskId) });

    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      console.error("Failed to delete task:", error);
      set({ tasks: previousTasks }); // Revert
    }
  }
}));