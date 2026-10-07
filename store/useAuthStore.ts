// src/store/useAuthStore.ts
import { create } from 'zustand';
import { User, onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  initializeAuth: () => () => void;
  logout: () => Promise<void>;
}

// NOTE: The extra () after <AuthState> is required in modern Zustand for TS inference
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: true,

  initializeAuth: () => {
    // Explicitly type currentUser as User | null
    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      set({ user: currentUser, isLoading: false });
    });
    return unsubscribe;
  },

  logout: async () => {
    try {
      await fbSignOut(auth);
      set({ user: null });
    } catch (error) {
      console.error('Logout failed', error);
    }
  },
}));