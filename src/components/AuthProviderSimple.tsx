import { useRouter, useSegments } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { auth } from "../services/firebase/config";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("🔐 Auth state changed:", {
        user: user?.email,
        isLoggedIn: !!user,
      });

      setUser(user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";
    const isProtectedRoute =
      segments[0] === "create-group" || segments[0] === "group";

    console.log("🧭 Navigation check:", {
      user: user?.email,
      segments: segments.join("/") || "root",
      inAuthGroup,
      inTabsGroup,
      isProtectedRoute,
    });

    // Simple protection: block unauthenticated users from protected areas
    if (!user && (inTabsGroup || isProtectedRoute)) {
      console.log("🔒 Redirecting to welcome (authentication required)");
      router.replace("/");
    }
    // Handle unverified users
    else if (user && !user.emailVerified && !inAuthGroup) {
      console.log("📧 Redirecting to email verification");
      router.replace("/(auth)/verify-email");
    }
    // Don't redirect authenticated users - let them navigate naturally
  }, [user, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4c63d2" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
});
