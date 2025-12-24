import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const { height } = Dimensions.get("window");

interface AboutSplitifyProps {
  visible: boolean;
  onClose: () => void;
}

export const AboutSplitify = ({ visible, onClose }: AboutSplitifyProps) => {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={["#B8860B", "#DAA520", "#FFD700"]} style={styles.header}>
          <SafeAreaView>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>About Splitify</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.content}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.logoSection}>
                <View style={styles.logoCircle}>
                    <Ionicons name="diamond" size={48} color="#DAA520" />
                </View>
                <Text style={styles.appName}>SPLITIFY</Text>
                <Text style={styles.appTagline}>Premium Expense Sharing</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.infoSection}>
                <Text style={styles.infoTitle}>Our Mission</Text>
                <Text style={styles.infoText}>
                    Splitify was created to make expense sharing between friends and family elegant, simple, and transparent. We believe that managing money should not come at the cost of your relationships.
                </Text>

                <View style={styles.divider} />

                <View style={styles.versionInfo}>
                    <Text style={styles.versionLabel}>Version</Text>
                    <Text style={styles.versionValue}>1.0.0 (Modern Gold)</Text>
                </View>

                <View style={styles.versionInfo}>
                    <Text style={styles.versionLabel}>Released</Text>
                    <Text style={styles.versionValue}>December 2025</Text>
                </View>

                <View style={styles.divider} />

                <Text style={styles.creditsTitle}>Developed with ❤️</Text>
                <Text style={styles.creditsText}>© 2025 Splitify Inc. All rights reserved.</Text>
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
  logoSection: {
    alignItems: "center",
    marginVertical: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: "#fffbeb",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#DAA520",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    transform: [{ rotate: '45deg' }],
  },
  appName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#DAA520",
    marginTop: 30,
    letterSpacing: 2,
  },
  appTagline: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
    marginTop: 4,
  },
  infoSection: {
    backgroundColor: "#f8fafc",
    borderRadius: 30,
    padding: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 22,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 24,
  },
  versionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  versionLabel: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
  },
  versionValue: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "700",
  },
  creditsTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 8,
  },
  creditsText: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    fontWeight: "500",
  },
});
