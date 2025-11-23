import { useLocalSearchParams, useRouter } from "expo-router";
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
import { auth } from "../../services/firebase/config";
import { addExpense } from "../../services/firebase/expenses";
import { getGroup } from "../../services/firebase/groups";
import { Expense } from "../../types";

const { width, height } = Dimensions.get("window");

export default function AddExpense() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const user = auth.currentUser;

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    title: "",
    amount: "",
  });

  const validateForm = () => {
    const newErrors = { title: "", amount: "" };
    let isValid = true;

    if (!formData.title.trim()) {
      newErrors.title = "Expense title is required";
      isValid = false;
    }

    if (!formData.amount.trim()) {
      newErrors.amount = "Amount is required";
      isValid = false;
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleAddExpense = async () => {
    if (!validateForm() || !user || !groupId) return;

    setLoading(true);

    try {
      // Get group details to get member list
      const group = await getGroup(groupId);
      if (!group) {
        Alert.alert("Error", "Group not found");
        return;
      }

      // Create expense data
      const expenseData: Omit<Expense, "id" | "createdAt"> = {
        title: formData.title.trim(),
        amount: Number(formData.amount),
        currency: "USD",
        paidBy: user.email || user.uid,
        participants: group.members,
        splitType: "equal",
        note: formData.note.trim() || undefined,
        paidAt: new Date(),
      };

      // Add expense to Firebase
      await addExpense(groupId, expenseData);

      Alert.alert(
        "Success",
        "Expense added successfully!",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error("Error adding expense:", error);
      Alert.alert("Error", error.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field as keyof typeof errors]) {
      setErrors({ ...errors, [field as keyof typeof errors]: "" });
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
                <Text style={styles.title}>Add Expense</Text>
                <Text style={styles.subtitle}>
                  Split this expense with your group
                </Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Expense Title *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      errors.title ? styles.inputError : null,
                    ]}
                    placeholder="What did you pay for?"
                    placeholderTextColor="#9CA3AF"
                    value={formData.title}
                    onChangeText={(text) => updateField("title", text)}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                  {errors.title ? (
                    <Text style={styles.errorText}>{errors.title}</Text>
                  ) : null}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Amount *</Text>
                  <View style={styles.amountContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.amountInput,
                        errors.amount ? styles.inputError : null,
                      ]}
                      placeholder="0.00"
                      placeholderTextColor="#9CA3AF"
                      value={formData.amount}
                      onChangeText={(text) => updateField("amount", text)}
                      keyboardType="decimal-pad"
                      editable={!loading}
                    />
                  </View>
                  {errors.amount ? (
                    <Text style={styles.errorText}>{errors.amount}</Text>
                  ) : null}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Note (Optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Add a note about this expense..."
                    placeholderTextColor="#9CA3AF"
                    value={formData.note}
                    onChangeText={(text) => updateField("note", text)}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    editable={!loading}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleAddExpense}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Add Expense</Text>
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
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.blueButtonText}>Cancel</Text>
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
    flex: 0.8,
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
    flex: 0.2,
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
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
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
  buttonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
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
