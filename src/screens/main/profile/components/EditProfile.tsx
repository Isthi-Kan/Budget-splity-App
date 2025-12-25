import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useApp } from "../../../../store";
import { updateProfileAction } from "../../../../store/actions";
import { User } from "../../../../types";

const { height } = Dimensions.get("window");

interface EditProfileProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
}

export const EditProfile = ({ visible, onClose, user }: EditProfileProps) => {
  const { dispatch } = useApp();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [loading, setLoading] = useState(false);
  // Photo upload removed

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    setLoading(true);
    try {
      // Update Profile (without photo upload)
      const success = await updateProfileAction(dispatch, user.uid, {
        name: name.trim(),
        bio: bio.trim(),
      });

      if (success) {
        Alert.alert("Success", "Profile updated successfully!");
        onClose();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={["#B8860B", "#DAA520", "#FFD700"]}
          style={styles.header}
        >
          <SafeAreaView>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Edit Profile</Text>
              <TouchableOpacity
                onPress={handleSave}
                style={[
                  styles.saveButton,
                  loading && styles.saveButtonDisabled,
                ]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#DAA520" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.content}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <View style={styles.avatarSection}>
                <View style={styles.avatarCircle}>
                  {user?.photoURL ? (
                    <Image
                      source={{ uri: user.photoURL }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {name.charAt(0).toUpperCase() || "U"}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={user?.email}
                  editable={false}
                  placeholderTextColor="#94a3b8"
                />
                <Text style={styles.inputNote}>Email cannot be changed.</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us something about yourself"
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </Animated.View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    height: height * 0.15,
    justifyContent: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "white",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "white",
    minWidth: 60,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#DAA520",
    fontWeight: "700",
  },
  content: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    backgroundColor: "white",
    paddingTop: 30,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "900",
    color: "#DAA520",
  },
  editAvatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#DAA520",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  changePhotoText: {
    marginTop: 12,
    fontSize: 14,
    color: "#DAA520",
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0f172a",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  disabledInput: {
    color: "#94a3b8",
    backgroundColor: "#f1f5f9",
  },
  inputNote: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
    marginLeft: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
});
