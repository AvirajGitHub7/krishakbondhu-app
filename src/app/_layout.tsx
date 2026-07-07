/**
 * KrishakBondhu - Root Layout
 * Handles auth state loading and routing between auth/main flows.
 */

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { useAuthStore } from '@/store/authStore';
import '@/i18n';

export default function RootLayout() {
  const { loadStoredAuth, isLoading, isAuthenticated, hasCompletedOnboarding } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const currentScreen = segments[1];

    if (isAuthenticated && inAuthGroup) {
      // Redirect away from the auth group to the main app's home tab
      router.replace('/(tabs)/home');
    } else if (!isAuthenticated) {
      if (!hasCompletedOnboarding) {
        // Redirect to onboarding if they haven't completed it yet
        if (currentScreen !== 'onboarding') {
          router.replace('/(auth)/onboarding');
        }
      } else {
        // Redirect to login if onboarding is complete and not in auth group (or still on onboarding)
        if (!inAuthGroup || currentScreen === 'onboarding') {
          router.replace('/(auth)/login');
        }
      }
    }
  }, [isAuthenticated, isLoading, hasCompletedOnboarding, segments]);

  if (isLoading) {
    return null; // Splash screen shows while loading
  }

  return (
    <>
      <StatusBar style="light" />
      <NavigationBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
