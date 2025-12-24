import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { addExpense } from "../../services/firebase/expenses";
import { getGroup } from "../../services/firebase/groups";
import { uploadExpenseProofWithProgress } from "../../services/firebase/storage";
import { useApp } from "../../store";
import { Expense } from "../../types";

const { width, height } = Dimensions.get("window");

export default function AddExpense() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { state } = useApp();
  const { user } = state;

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    description: "",
    category: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
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

      let proofImageUrl: string | undefined;

      // Upload image if selected
      if (selectedImage) {
        setImageUploading(true);
        try {
          // Generate temporary expense ID for image upload
          const tempExpenseId = `temp_${Date.now()}`;
          const result = await uploadExpenseProofWithProgress(
            groupId,
            tempExpenseId,
            selectedImage.uri,
            (progress: number) => {
              setUploadProgress(progress);
            }
          );
          proofImageUrl = result.url;
        } catch (uploadError: any) {
          console.error("Image upload error:", uploadError);
          Alert.alert(
            "Warning",
            "Failed to upload image, but expense will be saved without proof image."
          );
        } finally {
          setImageUploading(false);
          setUploadProgress(0);
        }
      }

      // Create expense data with enhanced fields
      const expenseData: Omit<Expense, "id" | "createdAt"> = {
        title: formData.title.trim(),
        description: formData.description?.trim(),
        amount: Number(formData.amount),
        currency: "USD",
        paidBy: user.email || user.uid,
        participants: group.members,
        splitType: "equal",
        category: formData.category,
        note: formData.note.trim() || undefined,
        paidAt: new Date(),
      };

      // Only add proofImageUrl if it exists
      if (proofImageUrl) {
        expenseData.proofImageUrl = proofImageUrl;
      }

      // Add expense to Firebase
      await addExpense(groupId, expenseData);

      console.log("✅ Expense added, navigating to group:", groupId);

      // Navigate immediately - try replace instead of push
      router.replace(`/group/${groupId}` as any);

      console.log("📍 Navigation attempted to:", `/group/${groupId}`);
    } catch (error: any) {
      console.error("Error adding expense:", error);
      Alert.alert("Error", error.message || "Failed to add expense");
    } finally {
      setLoading(false);
      setImageUploading(false);
      setUploadProgress(0);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field as keyof typeof errors]) {
      setErrors({ ...errors, [field as keyof typeof errors]: "" });
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow camera access to take photos"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      "Add Proof Image",
      "Choose how you'd like to add a proof image",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Camera", onPress: takePhoto },
        { text: "Photo Library", onPress: pickImage },
      ]
    );
  };

  const removeImage = () => {
    setSelectedImage(null);
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

                {/* Category Selection */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Category</Text>
                  <View style={styles.categoryContainer}>
                    {[
                      "Food",
                      "Transportation",
                      "Entertainment",
                      "Shopping",
                      "Utilities",
                      "Other",
                    ].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryButton,
                          formData.category === cat &&
                            styles.categoryButtonSelected,
                        ]}
                        onPress={() => updateField("category", cat)}
                        disabled={loading}
                      >
                        <Text
                          style={[
                            styles.categoryButtonText,
                            formData.category === cat &&
                              styles.categoryButtonTextSelected,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Proof Image Section */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Proof Image (Optional)</Text>
                  <Text style={styles.sublabel}>
                    Add a receipt or bill photo
                  </Text>

                  {selectedImage ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image
                        source={{ uri: selectedImage.uri }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={removeImage}
                        disabled={loading}
                      >
                        <Ionicons name="close" size={20} color="white" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.imagePickerButton}
                      onPress={showImagePicker}
                      disabled={loading}
                    >
                      <Ionicons
                        name="camera-outline"
                        size={24}
                        color="#3b82f6"
                      />
                      <Text style={styles.imagePickerText}>
                        Add Proof Image
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Upload Progress */}
                  {imageUploading && (
                    <View style={styles.uploadProgressContainer}>
                      <View style={styles.uploadProgressBar}>
                        <View
                          style={[
                            styles.uploadProgressFill,
                            { width: `${uploadProgress}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.uploadProgressText}>
                        Uploading... {Math.round(uploadProgress)}%
                      </Text>
                    </View>
                  )}
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
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  categoryButtonSelected: {
    backgroundColor: "#dbeafe",
    borderColor: "#3b82f6",
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  categoryButtonTextSelected: {
    color: "#3b82f6",
  },
  sublabel: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 12,
  },
  imagePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  imagePickerText: {
    fontSize: 16,
    color: "#3b82f6",
    fontWeight: "500",
    marginLeft: 8,
  },
  imagePreviewContainer: {
    position: "relative",
    alignSelf: "flex-start",
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  uploadProgressContainer: {
    marginTop: 12,
  },
  uploadProgressBar: {
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
    overflow: "hidden",
  },
  uploadProgressFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 2,
  },
  uploadProgressText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 4,
  },
});
