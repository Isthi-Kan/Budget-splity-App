import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const { height } = Dimensions.get("window");

interface PrivacySecurityProps {
  visible: boolean;
  onClose: () => void;
}

export const PrivacySecurity = ({ visible, onClose }: PrivacySecurityProps) => {
  const [biometricLock, setBiometricLock] = useState(false);
  const [showEmail, setShowEmail] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);

  const renderOption = (label: string, icon: string, description: string, value: boolean, onToggle: (val: boolean) => void) => (
    <View style={styles.optionCard}>
      <View style={styles.optionHeader}>
        <View style={styles.iconBox}>
          <Ionicons name={icon as any} size={20} color="#DAA520" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.optionLabel}>{label}</Text>
          <Text style={styles.optionDesc}>{description}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: "#e2e8f0", true: "#fde68a" }}
          thumbColor={value ? "#DAA520" : "#94a3b8"}
        />
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={["#B8860B", "#DAA520", "#FFD700"]} style={styles.header}>
          <SafeAreaView>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Privacy & Security</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.content}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <Text style={styles.sectionTitle}>Security Settings</Text>
              {renderOption(
                "Biometric Lock",
                "finger-print-outline",
                "Require FaceID or Fingerprint to open app",
                biometricLock,
                setBiometricLock
              )}

              <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Privacy Settings</Text>
              {renderOption(
                "Show Email to Members",
                "mail-outline",
                "Allow group members to see your email",
                showEmail,
                setShowEmail
              )}
              {renderOption(
                "Discoverable Profile",
                "search-outline",
                "Allow others to find you by email",
                publicProfile,
                setPublicProfile
              )}

              <TouchableOpacity style={styles.dangerAction}>
                <Ionicons name="trash-outline" size={20} color="#dc2626" />
                <Text style={styles.dangerText}>Request Data Deletion</Text>
              </TouchableOpacity>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 20,
  },
  optionCard: {
    backgroundColor: "#f8fafc",
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
    paddingRight: 10,
  },
  dangerAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  dangerText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#dc2626",
  },
});
