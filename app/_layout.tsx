// app/_layout.tsx
import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    // Start listening to Firebase Auth changes on mount
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  return (
    <>
      <StatusBar style="auto" />
      <Slot />
    </>
  );
}