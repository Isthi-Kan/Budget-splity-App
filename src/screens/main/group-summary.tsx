import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../services/firebase/config";
import { getGroupSummary } from "../../services/firebase/expenses";
import { getGroup } from "../../services/firebase/groups";
import { Group, GroupSummary } from "../../types";

const { width } = Dimensions.get("window");

export default function GroupSummaryScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const user = auth.currentUser;

  const [group, setGroup] = useState<Group | null>(null);
  const [summary, setSummary] = useState<GroupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "balances" | "settlements" | "analytics"
  >("overview");

  useEffect(() => {
    if (groupId && user) {
      loadData();
    } else if (groupId && !user) {
      // If no user, stop loading and show error
      setLoading(false);
      Alert.alert("Error", "Please log in to view group summary");
    }
  }, [groupId, user]);

  const loadData = async () => {
    if (!groupId || !user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      console.log("Loading data for group:", groupId);

      // Load group and summary data with timeout
      const dataPromise = Promise.all([
        getGroup(groupId),
        getGroupSummary(groupId),
      ]);

      // Add 30 second timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 30000)
      );

      const [groupData, summaryData] = (await Promise.race([
        dataPromise,
        timeoutPromise,
      ])) as [any, any];

      console.log("Data loaded successfully");
      setGroup(groupData);
      setSummary(summaryData);
    } catch (error: any) {
      console.error("Error loading summary data:", error);

      // More specific error handling
      const errorMessage = error.message?.includes("timeout")
        ? "Request timed out. Please check your internet connection and try again."
        : error.message?.includes("permission") ||
          error.message?.includes("insufficient")
        ? "You don't have permission to access this group."
        : "Failed to load group summary. Please try again.";

      Alert.alert("Error", errorMessage);

      // Reset states on error
      setGroup(null);
      setSummary(null);
    } finally {
      console.log("Loading complete");
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderOverviewTab = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Total Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="receipt-outline" size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{summary?.totalExpenses || 0}</Text>
          <Text style={styles.statLabel}>Total Expenses</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="cash-outline" size={24} color="#10b981" />
          <Text style={styles.statValue}>
            ${(summary?.totalAmount || 0).toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Total Amount</Text>
        </View>
      </View>

      {/* Top Spenders */}
      {summary?.topSpenders && summary.topSpenders.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Spenders</Text>
          {summary.topSpenders.slice(0, 3).map((spender, index) => (
            <View key={spender.uid} style={styles.spenderItem}>
              <View style={styles.spenderRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.spenderInfo}>
                <Text style={styles.spenderName}>
                  {spender.name || spender.uid}
                </Text>
                <Text style={styles.spenderAmount}>
                  ${spender.amount.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Expenses by Category */}
      {summary?.expensesByCategory && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expenses by Category</Text>
          {Object.entries(summary.expensesByCategory).map(
            ([category, amount]) => (
              <View key={category} style={styles.categoryItem}>
                <Text style={styles.categoryName}>{category}</Text>
                <Text style={styles.categoryAmount}>${amount.toFixed(2)}</Text>
              </View>
            )
          )}
        </View>
      )}
    </ScrollView>
  );

  const renderBalancesTab = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Balances</Text>
        <Text style={styles.sectionSubtitle}>
          See who owes money and who should receive money
        </Text>

        {summary?.balances?.map((balance) => {
          const isPositive = balance.balance > 0;
          const isZero = Math.abs(balance.balance) < 0.01;

          return (
            <View key={balance.uid} style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <View style={styles.balanceAvatar}>
                  <Text style={styles.balanceInitials}>
                    {(
                      balance.displayName ||
                      balance.email ||
                      balance.name ||
                      balance.uid
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceName}>
                    {balance.displayName ||
                      balance.email ||
                      balance.name ||
                      balance.uid}
                  </Text>
                  {balance.displayName &&
                    balance.displayName.includes("Missing Profile") && (
                      <Text style={styles.missingProfileText}>
                        Needs to complete signup
                      </Text>
                    )}
                  <Text style={styles.balanceDetails}>
                    Paid: ${(balance.totalPaid || 0).toFixed(2)} | Owes: $
                    {(balance.totalOwes || 0).toFixed(2)}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.balanceAmount,
                  isPositive && styles.positiveBalance,
                  !isPositive && !isZero && styles.negativeBalance,
                  isZero && styles.zeroBalance,
                ]}
              >
                <Text
                  style={[
                    styles.balanceText,
                    isPositive && styles.positiveText,
                    !isPositive && !isZero && styles.negativeText,
                    isZero && styles.zeroText,
                  ]}
                >
                  {isZero
                    ? "Settled"
                    : isPositive
                    ? `+$${balance.balance.toFixed(2)}`
                    : `-$${Math.abs(balance.balance).toFixed(2)}`}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderSettlementsTab = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Suggested Settlements</Text>
        <Text style={styles.sectionSubtitle}>
          Optimal way to settle all debts with minimum transactions
        </Text>

        {summary?.settlements?.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color="#10b981" />
            <Text style={styles.emptyTitle}>All Settled!</Text>
            <Text style={styles.emptyText}>
              No settlements needed. Everyone is even!
            </Text>
          </View>
        ) : (
          summary?.settlements?.map((settlement, index) => (
            <View key={index} style={styles.settlementCard}>
              <View style={styles.settlementHeader}>
                <View style={styles.settlementAvatar}>
                  <Text style={styles.settlementInitials}>
                    {(settlement.fromUserName || settlement.fromUser)
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={styles.settlementArrow}>
                  <Ionicons name="arrow-forward" size={20} color="#6b7280" />
                </View>
                <View style={styles.settlementAvatar}>
                  <Text style={styles.settlementInitials}>
                    {(settlement.toUserName || settlement.toUser)
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.settlementText}>
                <Text style={styles.settlementFrom}>
                  {settlement.fromUserName || settlement.fromUser}
                </Text>
                {" pays "}
                <Text style={styles.settlementAmount}>
                  ${settlement.amount.toFixed(2)}
                </Text>
                {" to "}
                <Text style={styles.settlementTo}>
                  {settlement.toUserName || settlement.toUser}
                </Text>
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderAnalyticsTab = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Monthly Spending */}
      {summary?.expensesByMonth && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Spending</Text>
          {Object.entries(summary.expensesByMonth)
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 6)
            .map(([month, amount]) => (
              <View key={month} style={styles.monthItem}>
                <Text style={styles.monthName}>{month}</Text>
                <Text style={styles.monthAmount}>${amount.toFixed(2)}</Text>
              </View>
            ))}
        </View>
      )}

      {/* Additional Analytics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>

        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsLabel}>Average Expense</Text>
          <Text style={styles.analyticsValue}>
            $
            {summary?.totalExpenses
              ? (summary.totalAmount / summary.totalExpenses).toFixed(2)
              : "0.00"}
          </Text>
        </View>

        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsLabel}>Group Size</Text>
          <Text style={styles.analyticsValue}>
            {group?.members?.length || 0} members
          </Text>
        </View>

        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsLabel}>Per Person Average</Text>
          <Text style={styles.analyticsValue}>
            $
            {group?.members?.length
              ? ((summary?.totalAmount || 0) / group.members.length).toFixed(2)
              : "0.00"}
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>Loading summary...</Text>
          <Text style={styles.loadingSubtext}>
            This might take a few moments
          </Text>

          {/* Show refresh button after 10 seconds */}
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              setLoading(false);
              setTimeout(() => loadData(), 100);
            }}
          >
            <Ionicons name="refresh-outline" size={20} color="#3b82f6" />
            <Text style={styles.refreshButtonText}>Tap to retry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButtonLoading}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show error state if no group data after loading
  if (!loading && !group) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>Group Not Found</Text>
        <Text style={styles.errorText}>
          This group might not exist or you don't have access to it.
        </Text>

        <TouchableOpacity style={styles.retryButton} onPress={() => loadData()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButtonError}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#3b82f6", "#1e40af"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Group Summary</Text>
            <Text style={styles.headerSubtitle}>{group?.name}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
        >
          {[
            { key: "overview", label: "Overview", icon: "analytics-outline" },
            { key: "balances", label: "Balances", icon: "people-outline" },
            {
              key: "settlements",
              label: "Settlements",
              icon: "swap-horizontal-outline",
            },
            {
              key: "analytics",
              label: "Analytics",
              icon: "stats-chart-outline",
            },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Ionicons
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.key ? "#3b82f6" : "#6b7280"}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.key && styles.activeTabLabel,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {activeTab === "overview" && renderOverviewTab()}
        {activeTab === "balances" && renderBalancesTab()}
        {activeTab === "settlements" && renderSettlementsTab()}
        {activeTab === "analytics" && renderAnalyticsTab()}
      </View>

      {/* Image Modal */}
      <Modal
        visible={selectedImageUrl !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImageUrl(null)}
      >
        <TouchableOpacity
          style={styles.imageModalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedImageUrl(null)}
        >
          <View style={styles.imageModalContent}>
            {selectedImageUrl && (
              <Image
                source={{ uri: selectedImageUrl }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedImageUrl(null)}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 40,
  },
  loadingContent: {
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 32,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  refreshButtonText: {
    fontSize: 14,
    color: "#3b82f6",
    marginLeft: 8,
    fontWeight: "500",
  },
  backButtonLoading: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "500",
  },
  backButtonError: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  tabsContainer: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tabsScroll: {
    paddingHorizontal: 20,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#3b82f6",
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
    marginLeft: 8,
  },
  activeTabLabel: {
    color: "#3b82f6",
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  spenderItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  spenderRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
  },
  spenderInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  spenderName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
  },
  spenderAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10b981",
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3b82f6",
  },
  balanceCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  balanceAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  balanceInitials: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  balanceInfo: {
    flex: 1,
  },
  balanceName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  missingProfileText: {
    fontSize: 12,
    color: "#f59e0b",
    fontStyle: "italic",
    marginBottom: 2,
  },
  balanceDetails: {
    fontSize: 14,
    color: "#6b7280",
  },
  balanceAmount: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-end",
  },
  positiveBalance: {
    backgroundColor: "#dcfce7",
  },
  negativeBalance: {
    backgroundColor: "#fee2e2",
  },
  zeroBalance: {
    backgroundColor: "#f3f4f6",
  },
  balanceText: {
    fontSize: 16,
    fontWeight: "600",
  },
  positiveText: {
    color: "#16a34a",
  },
  negativeText: {
    color: "#dc2626",
  },
  zeroText: {
    color: "#6b7280",
  },
  settlementCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settlementHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  settlementAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
  },
  settlementInitials: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  settlementArrow: {
    marginHorizontal: 16,
  },
  settlementText: {
    fontSize: 16,
    textAlign: "center",
    color: "#1f2937",
    lineHeight: 24,
  },
  settlementFrom: {
    fontWeight: "600",
    color: "#dc2626",
  },
  settlementTo: {
    fontWeight: "600",
    color: "#16a34a",
  },
  settlementAmount: {
    fontWeight: "bold",
    color: "#3b82f6",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "white",
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  monthItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  monthName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
  },
  monthAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3b82f6",
  },
  analyticsCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  analyticsLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
  },
  analyticsValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "90%",
    height: "70%",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
  },
});
