import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { loginUser } from "../../src/services/firebase/auth";

const { width, height } = Dimensions.get("window");

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [generalError, setGeneralError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    setGeneralError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    console.log("🔄 Starting login process...");

    const loginTimeout = setTimeout(() => {
      setLoading(false);
      setGeneralError("Login is taking too long. Please try again.");
    }, 30000);

    try {
      console.log("📧 Attempting to login with email:", email);
      const user = await loginUser(email, password);
      console.log("✅ Login response received:", {
        uid: user.uid,
        email: user.email,
        verified: user.emailVerified,
      });

      if (!user.emailVerified) {
        console.log("📧 User email not verified, redirecting to verification");
        clearTimeout(loginTimeout);
        setLoading(false);

        Alert.alert(
          "Email Verification Required",
          "Please verify your email address before continuing.",
          [
            {
              text: "Verify Now",
              onPress: () => {
                console.log("📧 Redirecting to verify email");
                router.replace("/(auth)/verify-email");
              },
            },
            {
              text: "Cancel",
              style: "cancel",
              onPress: () =>
                console.log("❌ User cancelled email verification"),
            },
          ]
        );
        setLoading(false);
        return;
      }

      console.log("🎉 Login successful, navigating to tabs");
      router.replace("/(tabs)");
    } catch (err: any) {
      console.error("❌ Login error:", err);
      clearTimeout(loginTimeout);
      const errorMessage = err.message || "Login failed. Please try again.";
      setGeneralError(errorMessage);
      console.error("Login error details:", err);
    } finally {
      clearTimeout(loginTimeout);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* White curved top section */}
      <View style={styles.whiteSection}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.formContainer}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to continue</Text>

                {generalError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{generalError}</Text>
                  </View>
                ) : null}

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) setErrors({ ...errors, email: "" });
                      if (generalError) setGeneralError("");
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  {errors.email ? (
                    <Text style={styles.fieldError}>{errors.email}</Text>
                  ) : null}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={[styles.input, errors.password && styles.inputError]}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password)
                        setErrors({ ...errors, password: "" });
                      if (generalError) setGeneralError("");
                    }}
                    editable={!loading}
                  />
                  {errors.password ? (
                    <Text style={styles.fieldError}>{errors.password}</Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    loading && styles.loginButtonDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.signupButton}
                  onPress={() => router.push("/(auth)/signup")}
                  disabled={loading}
                >
                  <Text style={styles.signupButtonText}>
                    Create New Account
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* Blue bottom section */}
      <View style={styles.blueSection}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/")}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>← Back</Text>
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
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  formContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 40,
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1f2937",
    backgroundColor: "#ffffff",
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  fieldError: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  loginButton: {
    backgroundColor: "#00d4aa",
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#00d4aa",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#9CA3AF",
    fontSize: 14,
  },
  signupButton: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  signupButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    color: "#4c63d2",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
