// Navigation utility functions
import { router } from 'expo-router';

/**
 * Safely navigate back with fallback to home screen
 */
export const safeNavigateBack = () => {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(tabs)/home' as any);
  }
};

/**
 * Navigate to home screen
 */
export const navigateToHome = () => {
  router.replace('/(tabs)/home' as any);
};

/**
 * Navigate to a specific route with safety checks
 */
export const safeNavigate = (route: any, fallback: any = '/(tabs)/home') => {
  try {
    router.push(route as any);
  } catch (error) {
    console.warn('Navigation failed, using fallback:', error);
    router.replace(fallback as any);
  }
};