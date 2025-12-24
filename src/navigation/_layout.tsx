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
    
    if (!state.isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated and not in auth group
      // router.replace("/(auth)/login");
      // Note: We might want allow the landing page ("index")? 
      // Checking segments... if segments is empty or "index", it's the landing page.
      // Let's assume we protect everything except auth and welcome (index).
      // Actually, typically index is the welcome screen.
    } else if (state.isAuthenticated && inAuthGroup) {
      // Redirect to home if authenticated and trying to access auth screens
      router.replace("/(tabs)/home");
    }
  }, [state.isAuthenticated, state.authInitialized, segments]);

  if (!fontsLoaded || !state.authInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4c63d2" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(group)/create-group"
        options={{
          headerShown: true,
          title: "Create Group",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="(group)/group/[id]"
        options={{
          headerShown: true,
          title: "Group Details",
        }}
      />
      <Stack.Screen
        name="(group)/group-summary"
        options={{
          headerShown: true,
          title: "Group Summary",
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
