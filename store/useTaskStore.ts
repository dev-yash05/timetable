// src/store/useTaskStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  setTaskOrder: (newTasks: Task[]) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      isLoading: false, // Set to false by default now so offline UI shows instantly

      subscribeToTasks: (userId: string) => {
        const q = query(collection(db, 'tasks'), where('userId', '==', userId));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedTasks = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Task[];
          
          fetchedTasks.sort((a, b) => b.createdAt - a.createdAt);
          set({ tasks: fetchedTasks, isLoading: false });
        }, (error) => {
          console.error("Error fetching tasks:", error);
        });

        return unsubscribe;
      },

      addTask: async (task) => {
        const previousTasks = get().tasks;
        set({ tasks: [task, ...previousTasks] }); 

        try {
          await setDoc(doc(db, 'tasks', task.id), task);
        } catch (error) {
          set({ tasks: previousTasks }); 
        }
      },

      toggleTask: async (taskId, currentStatus) => {
        const nextStatus = !currentStatus;
        const previousTasks = get().tasks;
        
        set({ tasks: previousTasks.map(t => t.id === taskId ? { ...t, isCompleted: nextStatus } : t) });

        try {
          await updateDoc(doc(db, 'tasks', taskId), { isCompleted: nextStatus });
        } catch (error) {
          set({ tasks: previousTasks }); 
        }
      },

      deleteTask: async (taskId) => {
        const previousTasks = get().tasks;
        set({ tasks: previousTasks.filter(t => t.id !== taskId) });

        try {
          await deleteDoc(doc(db, 'tasks', taskId));
        } catch (error) {
          set({ tasks: previousTasks }); 
        }
      },
      setTaskOrder: (newTasks) => {
        // Instantly updates the local UI and saves it to offline AsyncStorage
        set({ tasks: newTasks });
      }
    }),
    {
      name: 'task-storage', // unique name for AsyncStorage key
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the tasks array, not the loading state
      partialize: (state) => ({ tasks: state.tasks }),
    }
  )
);