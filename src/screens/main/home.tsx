import { useRouter } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import InputModal from "../../components/InputModal";
import { logoutUser } from "../../services/firebase/auth";
import { auth } from "../../services/firebase/config";

export default function Home() {
  const router = useRouter();
  const user = auth.currentUser;

  // Firebase authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log(
        "🔐 Auth state changed:",
        user ? "User logged in" : "User logged out"
      );
      setUser(user);
      setAuthLoading(false);

      // If user is not authenticated, redirect to login
      if (!user) {
        router.replace("/(auth)/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Handle Android back button to prevent going back to login
  useEffect(() => {
    const handleBackPress = () => {
      // Prevent default back behavior on home screen
      // User should use logout instead
      return true; // This prevents the default back action
    };

    if (Platform.OS === "android") {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        handleBackPress
      );
      return () => backHandler.remove();
    }
  }, []);

  const loadGroups = async (forceRefresh = false) => {
    if (!user) {
      console.log("⚠️ No user found, skipping group load");
      setLoading(false);
      return;
    }

    console.log("📊 Loading groups for user:", user.uid, { forceRefresh });

    // Don't show loading for cached requests
    if (forceRefresh || groups.length === 0) {
      setLoading(true);
    }

    try {
      const startTime = Date.now();
      const userGroups = await getUserGroups(user.uid, !forceRefresh);
      const loadTime = Date.now() - startTime;

      console.log("✅ Groups loaded:", {
        count: userGroups.length,
        loadTimeMs: loadTime,
        cached: loadTime < 100,
      });

      // Filter out any null/undefined groups
      const validGroups = userGroups.filter((group) => group && group.id);
      setGroups(validGroups);

      if (loadTime > 1000) {
        console.warn("⚠️ Slow loading detected:", loadTime, "ms");
      }
    } catch (error) {
      console.error("❌ Error loading groups:", error);
      Alert.alert("Error", "Failed to load groups. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Load groups immediately on mount and when user changes
    if (user && !authLoading) {
      loadGroups();

      // Also preload in background without UI loading state
      setTimeout(() => {
        loadGroups(true);
      }, 1000);
    }
  }, [user, authLoading]);

  // Refresh groups when screen comes into focus (e.g., after creating a group)
  useFocusEffect(
    useCallback(() => {
      if (user && !authLoading) {
        console.log("🔍 Screen focused - refreshing groups...");
        loadGroups(true); // Force refresh when screen comes into focus
      }
    }, [user, authLoading])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadGroups(true); // Force refresh, bypass cache
  };

  const handleProfilePress = () => {
    setShowProfileModal(true);
  };

  const handleProfileModalClose = () => {
    setShowProfileModal(false);
  };

  const handleViewProfile = () => {
    setShowProfileModal(false);
    router.push("/(tabs)/profile");
  };

  const handleLogoutPress = () => {
    setShowProfileModal(false);
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    try {
      await logoutUser();
      router.replace("/(auth)/login");
    } catch (error: any) {
      Alert.alert("Error", "Failed to logout");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Splitify!</Text>
        <Text style={styles.subtitle}>
          Hello, {user?.displayName || user?.email || "User"}! 👋
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Your expense splitting app is ready to go. Start creating groups and
          splitting expenses with your friends!
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            Alert.alert("Coming Soon", "This feature is under development!")
          }
        >
          <Text style={styles.buttonText}>Create New Group</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            Alert.alert("Coming Soon", "This feature is under development!")
          }
        >
          <Text style={styles.buttonText}>Join Existing Group</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#6b7280",
    textAlign: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  description: {
    fontSize: 16,
    color: "#4b5563",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
    maxWidth: 300,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    paddingBottom: 20,
  },
  logoutButton: {
    padding: 12,
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "500",
  },
});
