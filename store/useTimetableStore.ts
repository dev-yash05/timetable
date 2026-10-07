// src/store/useTimetableStore.ts
import { create } from 'zustand';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface TimetableSlot {
  id: string;
  userId: string;
  title: string;
  startTime: string; // Stored in 24h format (e.g., "09:00") for perfect sorting
  endTime: string;   // Stored in 24h format (e.g., "10:30")
  dayOfWeek: number; // 1 (Mon) - 7 (Sun)
  colorTag: string; 
}

interface TimetableState {
  slots: TimetableSlot[];
  viewMode: 'day' | 'week';
  selectedDate: Date;
  isLoading: boolean;
  setViewMode: (mode: 'day' | 'week') => void;
  setSelectedDate: (date: Date) => void;
  subscribeToSlots: (userId: string) => () => void;
  addSlot: (slot: TimetableSlot) => Promise<void>;
  deleteSlot: (slotId: string) => Promise<void>;
}

export const useTimetableStore = create<TimetableState>()((set, get) => ({
  slots: [],
  viewMode: 'day',
  selectedDate: new Date(),
  isLoading: true,

  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedDate: (date) => set({ selectedDate: date }),

  // Real-time Firestore Sync
  subscribeToSlots: (userId: string) => {
    set({ isLoading: true });
    const q = query(collection(db, 'timetableSlots'), where('userId', '==', userId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSlots = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TimetableSlot[];
      
      set({ slots: fetchedSlots, isLoading: false });
    }, (error) => {
      console.error("Error fetching slots:", error);
      set({ isLoading: false });
    });

    return unsubscribe;
  },

  // Optimistic UI Updates (<16ms response time)
  addSlot: async (slot) => {
    const previousSlots = get().slots;
    // 1. Instantly update UI locally
    set({ slots: [...previousSlots, slot] });

    // 2. Persist to Firestore in the background
    try {
      await setDoc(doc(db, 'timetableSlots', slot.id), slot);
    } catch (error) {
      console.error("Failed to add slot:", error);
      // Revert on failure
      set({ slots: previousSlots });
    }
  },

  deleteSlot: async (slotId) => {
    const previousSlots = get().slots;
    // 1. Instantly update UI locally
    set({ slots: previousSlots.filter(s => s.id !== slotId) });

    // 2. Persist to Firestore in the background
    try {
      await deleteDoc(doc(db, 'timetableSlots', slotId));
    } catch (error) {
      console.error("Failed to delete slot:", error);
      // Revert on failure
      set({ slots: previousSlots });
    }
  }
}));