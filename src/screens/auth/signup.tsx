import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
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
import { auth } from "../../services/firebase/config";

const { width, height } = Dimensions.get("window");

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const validateForm = () => {
    const newErrors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (!validatePassword(formData.password)) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const signup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setGeneralError(""); // Clear previous errors

    try {
      console.log("Starting signup process...");

      // Create the account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );

      console.log("Account created, sending verification email...");

      try {
        // Automatically send verification email
        await sendEmailVerification(userCredential.user);
        console.log("Verification email sent, navigating...");
      } catch (emailError: any) {
        console.warn(
          "Email sending failed, but account created:",
          emailError.message
        );
        // Continue to verification screen even if email sending fails
        // User can resend from there
      }

      setLoading(false);
      router.push("/(auth)/verify-email");
    } catch (err: any) {
      console.error("Signup error:", err.message);
      setGeneralError(err.message);
      setLoading(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
    if (generalError) {
      setGeneralError("");
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
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>
                  Join Splitify and start sharing expenses
                </Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChangeText={(text) => updateField("name", text)}
                    autoCapitalize="words"
                    autoComplete="name"
                    style={[
                      styles.input,
                      errors.name ? styles.inputError : null,
                    ]}
                  />
                  {errors.name ? (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  ) : null}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    placeholder="Enter your email"
                    value={formData.email}
                    onChangeText={(text) => updateField("email", text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    style={[
                      styles.input,
                      errors.email ? styles.inputError : null,
                    ]}
                  />
                  {errors.email ? (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  ) : null}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    placeholder="Create a password"
                    secureTextEntry
                    value={formData.password}
                    onChangeText={(text) => updateField("password", text)}
                    autoComplete="password-new"
                    style={[
                      styles.input,
                      errors.password ? styles.inputError : null,
                    ]}
                  />
                  {errors.password ? (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  ) : null}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    placeholder="Confirm your password"
                    secureTextEntry
                    value={formData.confirmPassword}
                    onChangeText={(text) =>
                      updateField("confirmPassword", text)
                    }
                    autoComplete="password-new"
                    style={[
                      styles.input,
                      errors.confirmPassword ? styles.inputError : null,
                    ]}
                  />
                  {errors.confirmPassword ? (
                    <Text style={styles.errorText}>
                      {errors.confirmPassword}
                    </Text>
                  ) : null}
                </View>

                {generalError ? (
                  <View style={styles.generalErrorContainer}>
                    <Text style={styles.generalErrorText}>{generalError}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={signup}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Create Account</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* Blue bottom section */}
      <View style={styles.blueSection}>
        <TouchableOpacity
          style={styles.blueButton}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.blueButtonText}>
            Already have an account? Sign In
          </Text>
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
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "white",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginTop: 4,
  },
  button: {
    backgroundColor: "#10b981",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 16,
    color: "#6b7280",
  },
  linkText: {
    fontSize: 16,
    color: "#3b82f6",
    fontWeight: "600",
  },
  generalErrorContainer: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  generalErrorText: {
    color: "#ef4444",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
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
