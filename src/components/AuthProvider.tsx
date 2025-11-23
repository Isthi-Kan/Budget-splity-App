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
        segments: segments,
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
    const isRootRoute =
      segments.length <= 1 &&
      segments[0] !== "(auth)" &&
      segments[0] !== "(tabs)";

    console.log("🧭 Navigation check:", {
      user: user?.email,
      isLoggedIn: !!user,
      segments: segments,
      inAuthGroup,
      inTabsGroup,
      isRootRoute,
      route: segments.join("/") || "root",
    });

    if (user && !user.emailVerified) {
      // User logged in but email not verified
      if (!inAuthGroup || segments[1] !== "verify-email") {
        console.log("📧 Redirecting to email verification");
        router.replace("/(auth)/verify-email");
      }
    } else if (user && user.emailVerified) {
      // User logged in and verified - redirect from auth or root to tabs
      if (inAuthGroup || isRootRoute) {
        console.log("🏠 Redirecting to tabs (user logged in)");
        router.replace("/(tabs)");
      }
    } else {
      // No user - redirect from protected areas to welcome
      if (
        inTabsGroup ||
        segments[0] === "create-group" ||
        segments[0] === "group"
      ) {
        console.log("🔓 Redirecting to welcome (user logged out)");
        router.replace("/");
      }
    }
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
