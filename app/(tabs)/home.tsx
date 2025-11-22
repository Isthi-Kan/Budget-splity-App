import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { logoutUser } from "../../firebase/auth";
import { auth } from "../../firebase/config";

export default function Home() {
  const router = useRouter();
  const user = auth.currentUser;

  const handleLogout = async () => {
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
