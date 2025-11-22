import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();
  const [showAuthOptions, setShowAuthOptions] = useState(false);

  const handleGetStarted = () => {
    setShowAuthOptions(true);
  };

  const handleLogin = () => {
    router.push("/(auth)/login");
  };

  const handleSignUp = () => {
    router.push("/(auth)/signup");
  };

  if (showAuthOptions) {
    return (
      <View style={styles.container}>
        {/* White curved top section */}
        <View style={styles.whiteSection}>
          <View style={styles.authContent}>
            <View style={styles.logoContainer}>
              <Ionicons name="paper-plane" size={48} color="#4c63d2" />
            </View>
            <Text style={styles.appTitle}>SPLITIFY</Text>
            <Text style={styles.subtitle}>
              Ready to split expenses with friends?
            </Text>

            <View style={styles.authButtons}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
              >
                <Text style={styles.loginButtonText}>Log In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signupButton}
                onPress={handleSignUp}
              >
                <Text style={styles.signupButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Blue bottom section */}
        <View style={styles.blueSection}></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* White curved top section */}
      <View style={styles.whiteSection}>
        <View style={styles.welcomeContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="paper-plane" size={64} color="#4c63d2" />
          </View>
          <Text style={styles.title}>SPLITIFY</Text>
          <Text style={styles.description}>
            Split expenses effortlessly with friends
          </Text>

          <View style={styles.illustration}>
            <Image
              source={require("../../assets/images/hands.jpg")}
              style={styles.illustrationImage}
              resizeMode="cover"
            />
            <Text style={styles.illustrationText}>
              Money shared with friends
            </Text>
          </View>
        </View>
      </View>

      {/* Blue bottom section */}
      <View style={styles.blueSection}>
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={handleGetStarted}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color="#4c63d2"
            style={styles.arrowIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4c63d2",
  },
  whiteSection: {
    flex: 0.75,
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  blueSection: {
    flex: 0.25,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  authContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(76, 99, 210, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1f2937",
    letterSpacing: 3,
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    letterSpacing: 2,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 40,
  },
  illustration: {
    alignItems: "center",
    marginBottom: 20,
    marginHorizontal: -24,
    width: width,
  },
  illustrationImage: {
    width: width,
    height: 210,
    marginBottom: 16,
  },
  illustrationCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 40,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  illustrationEmoji: {
    fontSize: 32,
  },
  arrow: {
    fontSize: 24,
    color: "#4c63d2",
    fontWeight: "bold",
    marginHorizontal: 16,
  },
  illustrationText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  getStartedButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  getStartedText: {
    color: "#4c63d2",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  arrowIcon: {
    marginLeft: 4,
  },
  authButtons: {
    width: "100%",
    maxWidth: 280,
  },
  loginButton: {
    backgroundColor: "#00d4aa",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#00d4aa",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  signupButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  signupButtonText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "600",
  },
});
