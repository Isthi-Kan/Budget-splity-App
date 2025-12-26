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

interface HelpSupportProps {
  visible: boolean;
  onClose: () => void;
}

export const HelpSupport = ({ visible, onClose }: HelpSupportProps) => {
  const faqs = [
    {
      q: "How do I create a group?",
      a: "Go to the Home screen and tap the floating '+' button.",
    },
    {
      q: "How are expenses split?",
      a: "Currently, Splitify splits expenses equally among all group members.",
    },
    {
      q: "Can I attach receipts?",
      a: "Not currently. Photo uploads are disabled in Splitify.",
    },
  ];

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
              <Text style={styles.headerTitle}>Help & Support</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.content}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.logoSection}>
                            <View style={styles.logoCircle}>
                                <Ionicons name="diamond" size={48} color="#DAA520" />
                            </View>
                            <Text style={styles.appName}>SPLITIFY</Text>
                            <Text style={styles.appTagline}>Premium Expense Sharing</Text>
                        </Animated.View>
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              {faqs.map((faq, index) => (
                <View key={index} style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <Text style={styles.faqAnswer}>{faq.a}</Text>
                </View>
              ))}
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
  supportCard: {
    backgroundColor: "#fffbeb",
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  supportCardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#92400e",
    marginTop: 12,
  },
  supportCardDesc: {
    fontSize: 14,
    color: "#b45309",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  contactButton: {
    backgroundColor: "#DAA520",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  contactButtonText: {
    color: "white",
    fontWeight: "700",
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 20,
  },
  faqItem: {
    backgroundColor: "#f8fafc",
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
});
