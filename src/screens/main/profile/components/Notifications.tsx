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

interface NotificationsProps {
  visible: boolean;
  onClose: () => void;
}

export const Notifications = ({ visible, onClose }: NotificationsProps) => {
  const [expenseAlerts, setExpenseAlerts] = useState(true);
  const [groupInvites, setGroupInvites] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(false);
  const [appUpdates, setAppUpdates] = useState(true);

  const renderToggle = (label: string, value: boolean, onValueChange: (val: boolean) => void, icon: string) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon as any} size={20} color="#DAA520" />
        </View>
        <Text style={styles.toggleLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#e2e8f0", true: "#fde68a" }}
        thumbColor={value ? "#DAA520" : "#94a3b8"}
      />
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
              <Text style={styles.headerTitle}>Notifications</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.content}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <Text style={styles.sectionHeader}>Activity Notifications</Text>
              {renderToggle("New Expenses", expenseAlerts, setExpenseAlerts, "receipt-outline")}
              {renderToggle("Group Invitations", groupInvites, setGroupInvites, "people-outline")}
              {renderToggle("Payment Reminders", paymentReminders, setPaymentReminders, "notifications-outline")}
              
              <Text style={styles.sectionHeader}>App Settings</Text>
              {renderToggle("Application Updates", appUpdates, setAppUpdates, "cloud-download-outline")}
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
  sectionHeader: {
    fontSize: 14,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 20,
    marginTop: 10,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  toggleInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
});
