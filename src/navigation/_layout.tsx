import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AppProvider, useApp } from "../store";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { state } = useApp();
  const segments = useSegments();
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (!state.authInitialized) return;

    const inAuthGroup = segments[0] === "(auth)";
    const onVerifyEmail = segments[1] === "verify-email";
    // Cast to any/unknown to bypass narrow layout length types in the guard
    const isWelcomeScreen = (segments as any).length === 0;
    
    if (state.isAuthenticated) {
      if (state.user && !state.user.emailVerified) {
        // If authenticated but not verified, force them to verify-email
        if (!onVerifyEmail) {
          router.replace("/(auth)/verify-email");
        }
      } else if (inAuthGroup || isWelcomeScreen) {
        // If authenticated, verified and trying to access auth screens OR welcome (index)
        router.replace("/(tabs)/home");
      }
    } else if (!inAuthGroup && !isWelcomeScreen) {
      // If not authenticated, not on welcome, and not in auth group, redirect to login
      router.replace("/(auth)/login");
    }
  }, [state.isAuthenticated, state.user?.emailVerified, state.authInitialized, segments]);

  if (!fontsLoaded || !state.authInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4c63d2" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(group)/create-group"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="(group)/group/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(group)/group-summary"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootNavigator />
    </AppProvider>
  );
}
