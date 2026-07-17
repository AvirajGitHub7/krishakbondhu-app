/**
 * KrishakBondhu - Root Layout
 * Handles auth state loading and routing between auth/main flows.
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationBar } from 'expo-navigation-bar';
import { useAuthStore } from '@/store/authStore';
import '@/i18n';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { loadStoredAuth, isLoading, isAuthenticated, hasCompletedOnboarding } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Hide the Android system navigation bar for an immersive experience
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setStyle('light');
      NavigationBar.setHidden(true);
    }
  }, []);

  useEffect(() => {
    if (isLoading || !navigationState?.key) return;

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
    
    // Hide splash screen once we have determined where to route
    SplashScreen.hideAsync();
  }, [isAuthenticated, isLoading, hasCompletedOnboarding, segments, navigationState?.key]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
