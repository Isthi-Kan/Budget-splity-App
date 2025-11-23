import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { reload, sendEmailVerification } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../services/firebase/config";

const { width, height } = Dimensions.get("window");

export default function VerifyEmail() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [showInitialMessage, setShowInitialMessage] = useState(true);

  useEffect(() => {
    // Show initial success message for 3 seconds
    if (showInitialMessage) {
      const timer = setTimeout(() => {
        setShowInitialMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showInitialMessage]);

  useEffect(() => {
    let interval: any;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const sendVerificationEmail = async () => {
    if (!auth.currentUser || resendCooldown > 0) return;

    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      Alert.alert(
        "Success",
        "Verification email sent! Please check your inbox."
      );
      setResendCooldown(60); // 60 second cooldown
    } catch (error: any) {
      console.error("Error sending verification email:", error);
      Alert.alert(
        "Error",
        "Failed to send verification email. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!auth.currentUser) return;

    setCheckingVerification(true);
    try {
      await reload(auth.currentUser);

      if (auth.currentUser.emailVerified) {
        router.replace("/(tabs)");
      } else {
        Alert.alert(
          "Not Verified",
          "Please verify your email first and try again."
        );
      }
    } catch (error: any) {
      console.error("Error checking verification:", error);
      Alert.alert("Error", "Failed to check verification status.");
    } finally {
      setCheckingVerification(false);
    }
  };

  const userEmail = auth.currentUser?.email || "";

  return (
    <View style={styles.container}>
      {/* White curved top section */}
      <View style={styles.whiteSection}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail-outline" size={80} color="#4c63d2" />
          </View>

          <Text style={styles.title}>Verify Your Email</Text>

          {showInitialMessage && (
            <View style={styles.successMessage}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.successText}>
                Verification email sent successfully!
              </Text>
            </View>
          )}

          <Text style={styles.subtitle}>
            We've sent a verification link to:
          </Text>
          <Text style={styles.email}>{userEmail}</Text>

          <Text style={styles.description}>
            Please check your email and click the verification link to activate
            your account.
          </Text>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              checkingVerification && styles.buttonDisabled,
            ]}
            onPress={handleCheckVerification}
            disabled={checkingVerification}
          >
            {checkingVerification ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>
                I've Verified My Email
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              (loading || resendCooldown > 0) && styles.buttonDisabled,
            ]}
            onPress={sendVerificationEmail}
            disabled={loading || resendCooldown > 0}
          >
            {loading ? (
              <ActivityIndicator color="#4c63d2" />
            ) : (
              <Text style={styles.secondaryButtonText}>
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend Verification Email"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Blue bottom section */}
      <View style={styles.blueSection}>
        <TouchableOpacity
          style={styles.blueButton}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.blueButtonText}>Back to Login</Text>
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
    paddingTop: Platform.OS === "ios" ? 60 : 40,
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
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(76, 99, 210, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4c63d2",
    textAlign: "center",
    marginBottom: 24,
  },
  description: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: "#10b981",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    maxWidth: 280,
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    maxWidth: 280,
    alignItems: "center",
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "500",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  successMessage: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignSelf: "stretch",
  },
  successText: {
    color: "#10b981",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  blueButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  blueButtonText: {
    color: "#4c63d2",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
