import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { addExpense } from "../../../services/firebase/expenses";
import { getGroup } from "../../../services/firebase/groups";
import { uploadExpenseProofWithProgress } from "../../../services/firebase/storage";
import { useApp } from "../../../store";
import { Expense } from "../../../types";
import { styles } from "./styles";

const CATEGORIES = [
  { id: "Food", icon: "restaurant-outline" },
  { id: "Travel", icon: "bus-outline" },
  { id: "Fun", icon: "game-controller-outline" },
  { id: "Life", icon: "cart-outline" },
  { id: "Bills", icon: "bulb-outline" },
  { id: "Other", icon: "ellipsis-horizontal-outline" },
];

export default function AddExpenseScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { state } = useApp();
  const { user } = state;

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    description: "",
    category: "Other",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
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
      newErrors.amount = "Enter a valid amount";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleAddExpense = async () => {
    if (!validateForm() || !user || !groupId) return;

    setLoading(true);

    try {
      const group = await getGroup(groupId);
      if (!group) {
        Alert.alert("Error", "Group not found");
        return;
      }

      let proofImageUrl: string | undefined;

      if (selectedImage) {
        setImageUploading(true);
        try {
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
          Alert.alert("Warning", "Failed to upload image, but expense will be saved.");
        } finally {
          setImageUploading(false);
        }
      }

      const expenseData: Omit<Expense, "id" | "createdAt"> = {
        title: formData.title.trim(),
        description: formData.description?.trim(),
        amount: Number(formData.amount),
        currency: "Rs",
        paidBy: user.email || user.uid,
        participants: group.members,
        splitType: "equal",
        category: formData.category,
        note: formData.note.trim() || undefined,
        paidAt: new Date(),
      };

      if (proofImageUrl) {
        expenseData.proofImageUrl = proofImageUrl;
      }

      await addExpense(groupId, expenseData);
      router.replace(`/group/${groupId}` as any);
      
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

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select image");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow camera access");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      "Attach Receipt",
      "How would you like to add a proof image?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Camera", onPress: takePhoto },
        { text: "Gallery", onPress: pickImage },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient colors={["#B8860B", "#DAA520", "#FFD700"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Expense</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>New Transaction</Text>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.contentSheet}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              {/* Amount Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Amount Paid</Text>
                <View style={[styles.inputWrapper, styles.amountWrapper, errors.amount && { borderColor: '#ef4444' }]}>
                  <Text style={styles.currencyText}>Rs</Text>
                  <TextInput
                    style={[styles.input, styles.amountInput]}
                    placeholder="0"
                    placeholderTextColor="#d97706"
                    keyboardType="decimal-pad"
                    value={formData.amount}
                    onChangeText={(text) => updateField("amount", text)}
                    editable={!loading}
                  />
                </View>
                {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}
              </View>

              {/* Title Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>What was it for?</Text>
                <View style={[styles.inputWrapper, errors.title && { borderColor: '#ef4444' }]}>
                  <Ionicons name="pencil-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Pizza Night, Taxi..."
                    placeholderTextColor="#94a3b8"
                    value={formData.title}
                    onChangeText={(text) => updateField("title", text)}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
                {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
              </View>

              {/* Category selector */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryCard,
                        formData.category === cat.id && styles.selectedCategoryCard
                      ]}
                      onPress={() => updateField("category", cat.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.categoryIconContainer}>
                        <Ionicons 
                            name={cat.icon as any} 
                            size={20} 
                            color={formData.category === cat.id ? "#DAA520" : "#64748b"} 
                        />
                      </View>
                      <Text style={[
                        styles.categoryLabel,
                        formData.category === cat.id && styles.selectedCategoryLabel
                      ]}>{cat.id}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Image Picker */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Receipt Image</Text>
                <View style={styles.imageSection}>
                    {selectedImage ? (
                      <View style={styles.previewContainer}>
                        <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                        <TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedImage(null)}>
                           <Ionicons name="close" size={18} color="white" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.imagePicker} onPress={showImagePicker}>
                        <Ionicons name="camera-outline" size={32} color="#cbd5e1" />
                        <Text style={styles.imagePickerText}>Upload Bill / Receipt</Text>
                      </TouchableOpacity>
                    )}
                    
                    {imageUploading && (
                        <View style={{ marginTop: 10, alignItems: 'center' }}>
                            <Text style={{ fontSize: 12, color: '#DAA520', fontWeight: '700' }}>
                                Uploading Receipt: {Math.round(uploadProgress)}%
                            </Text>
                        </View>
                    )}
                </View>
              </View>

              {/* Description / Note */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Notes (Optional)</Text>
                <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Any details to remember?"
                    placeholderTextColor="#94a3b8"
                    value={formData.note}
                    onChangeText={(text) => updateField("note", text)}
                    multiline
                    numberOfLines={3}
                    editable={!loading}
                  />
                </View>
              </View>
            </Animated.View>
          </ScrollView>

          <View style={styles.footer}>
             <TouchableOpacity 
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleAddExpense}
                disabled={loading}
             >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={24} color="white" />
                    <Text style={styles.submitButtonText}>SAVE EXPENSE</Text>
                  </>
                )}
             </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
