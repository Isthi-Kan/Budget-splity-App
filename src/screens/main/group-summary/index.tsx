import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import {
  confirmSettlement,
  getGroupSummary,
} from "../../../services/firebase/expenses";
import { getGroup } from "../../../services/firebase/groups";
import { useApp } from "../../../store";
import { Group, GroupSummary } from "../../../types";
import { styles } from "./styles";

type TabType = "overview" | "balances" | "settlements" | "analytics";

export default function GroupSummaryScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { state } = useApp();
  const { user } = state;

  const [group, setGroup] = useState<Group | null>(null);
  const [summary, setSummary] = useState<GroupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const loadData = async () => {
    if (!groupId || !user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      const groupData = await getGroup(groupId);
      setGroup(groupData);

      const summaryPromise = getGroupSummary(groupId);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 15000)
      );

      const summaryData = (await Promise.race([
        summaryPromise,
        timeoutPromise,
      ])) as GroupSummary;
      setSummary(summaryData);
    } catch (error: any) {
      // Fallback summary if loading fails partially
      setSummary({
        id: groupId,
        groupId: groupId,
        totalExpenses: 0,
        totalAmount: 0,
        balances: [],
        settlements: [],
        lastUpdated: new Date(),
        expensesByCategory: {},
        expensesByMonth: {},
        topSpenders: [],
      } as any);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [groupId, user?.uid]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderOverviewTab = () => (
    <View style={styles.section}>
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        style={styles.statsGrid}
      >
        <View style={styles.statBox}>
          <View style={styles.statIconContainer}>
            <Ionicons name="receipt-outline" size={20} color="#DAA520" />
          </View>
          <Text style={styles.statLabel}>Total Bills</Text>
          <Text style={styles.statValue}>{summary?.totalExpenses || 0}</Text>
        </View>
        <View style={styles.statBox}>
          <View style={styles.statIconContainer}>
            <Ionicons name="cash-outline" size={20} color="#059669" />
          </View>
          <Text style={styles.statLabel}>Total Spend</Text>
          <Text style={styles.statValue}>
            Rs {(summary?.totalAmount || 0).toFixed(0)}
          </Text>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(300).springify()}
        style={{ marginTop: 24 }}
      >
        <Text style={styles.sectionTitle}>Top Spenders</Text>
        {summary?.topSpenders?.length === 0 ? (
          <Text style={styles.emptyText}>No data available yet.</Text>
        ) : (
          summary?.topSpenders?.slice(0, 3).map((spender, index) => (
            <View key={spender.uid} style={styles.listCard}>
              <View
                style={[
                  styles.listIconContainer,
                  { backgroundColor: index === 0 ? "#fffef3" : "#f8fafc" },
                ]}
              >
                <Ionicons
                  name={index === 0 ? "trophy" : "person-outline"}
                  size={20}
                  color={index === 0 ? "#DAA520" : "#64748b"}
                />
              </View>
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>
                  {spender.name || (spender as any).email || spender.uid}
                </Text>
                {(() => {
                  const title = spender.name || "";
                  const email = (spender as any).email || "";
                  if (email && email !== title) {
                    return <Text style={styles.listSubtitle}>{email}</Text>;
                  }
                  if (!title && email) {
                    const local = email.split("@")[0];
                    return <Text style={styles.listSubtitle}>{local}</Text>;
                  }
                  return null;
                })()}
              </View>
              <Text style={styles.listValue}>
                Rs {spender.amount.toFixed(0)}
              </Text>
            </View>
          ))
        )}
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(500).springify()}
        style={{ marginTop: 24 }}
      >
        <Text style={styles.sectionTitle}>By Category</Text>
        {Object.entries(summary?.expensesByCategory || {}).map(
          ([category, amount]) => (
            <View key={category} style={styles.listCard}>
              <View style={styles.listIconContainer}>
                <Ionicons name="pricetag-outline" size={18} color="#DAA520" />
              </View>
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{category}</Text>
              </View>
              <Text style={styles.listValue}>Rs {amount.toFixed(0)}</Text>
            </View>
          )
        )}
      </Animated.View>
    </View>
  );

  const renderBalancesTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Member Status</Text>
      {summary?.balances?.map((balance, index) => (
        <Animated.View
          key={balance.uid}
          entering={FadeInDown.delay(index * 100).springify()}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <View style={styles.balanceAvatar}>
              {balance.photoURL ? (
                <Image
                  source={{ uri: balance.photoURL }}
                  style={{ width: "100%", height: "100%", borderRadius: 12 }}
                />
              ) : (
                <Text style={styles.balanceInitials}>
                  {(
                    balance.name ||
                    balance.displayName ||
                    balance.email ||
                    balance.uid
                  )
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.balanceName} numberOfLines={1}>
                {balance.name ||
                  balance.displayName ||
                  balance.email ||
                  balance.uid}
              </Text>
              {balance.email &&
              balance.email !== (balance.name || balance.displayName || "") ? (
                <Text style={styles.balanceBadgeText} numberOfLines={1}>
                  {balance.email}
                </Text>
              ) : null}
              <View style={styles.balanceBadge}>
                <Text style={styles.balanceBadgeText}>
                  {balance.balance === 0
                    ? "Settled"
                    : balance.balance > 0
                    ? "Owed Money"
                    : "Owing Money"}
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.statValue,
                { color: balance.balance >= 0 ? "#059669" : "#dc2626" },
              ]}
            >
              {balance.balance >= 0 ? "+" : "-"}Rs{" "}
              {Math.abs(balance.balance).toFixed(0)}
            </Text>
          </View>

          <View style={styles.balanceStats}>
            <View style={styles.balanceStatItem}>
              <Text style={styles.balanceStatLabel}>Paid</Text>
              <Text style={styles.balanceStatValue}>
                Rs {balance.totalPaid.toFixed(0)}
              </Text>
            </View>
            <View style={styles.balanceStatDivider} />
            <View style={styles.balanceStatItem}>
              <Text style={styles.balanceStatLabel}>Share</Text>
              <Text style={styles.balanceStatValue}>
                Rs {balance.totalOwes.toFixed(0)}
              </Text>
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );

  const renderSettlementsTab = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Settle Up</Text>
      </View>

      {summary?.settlements?.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={64} color="#059669" />
          <Text style={styles.emptyTitle}>Perfectly Balanced!</Text>
          <Text style={styles.emptyText}>
            Everyone in the group is settled. No payments needed.
          </Text>
        </View>
      ) : (
        summary?.settlements?.map((settlement, index) => {
          // Find balances for display data (names, emails, avatars)
          const fromUserBalance = summary?.balances?.find(
            (b) => b.uid === settlement.fromUser
          );
          const toUserBalance = summary?.balances?.find(
            (b) => b.uid === settlement.toUser
          );

          // Prefer name/displayName, then email, avoid duplicates
          const fromPrimaryName =
            fromUserBalance?.name ||
            fromUserBalance?.displayName ||
            settlement.fromUserName ||
            settlement.fromUser ||
            "User";
          const fromEmail = fromUserBalance?.email || settlement.fromUser || "";
          const showFromEmail = !!fromEmail;
          const fromDisplayName = (() => {
            if (fromPrimaryName && fromPrimaryName !== fromEmail)
              return fromPrimaryName;
            if (fromEmail) return fromEmail.split("@")[0];
            return fromPrimaryName;
          })();

          const toPrimaryName =
            toUserBalance?.name ||
            toUserBalance?.displayName ||
            settlement.toUserName ||
            settlement.toUser ||
            "User";
          const toEmail = toUserBalance?.email || settlement.toUser || "";
          const showToEmail = !!toEmail;
          const toDisplayName = (() => {
            if (toPrimaryName && toPrimaryName !== toEmail)
              return toPrimaryName;
            if (toEmail) return toEmail.split("@")[0];
            return toPrimaryName;
          })();

          const currentEmail = (user?.email || "").toLowerCase();
          const isInvolved =
            (settlement.fromUser || "").toLowerCase() === currentEmail ||
            (settlement.toUser || "").toLowerCase() === currentEmail;
          const confirmations = (settlement.confirmations || []).map((c) =>
            (c || "").toLowerCase()
          );
          const alreadyConfirmed = confirmations.includes(currentEmail);
          const isSettled =
            !!settlement.settled || settlement.status === "settled";
          const isPending = !isSettled && confirmations.length > 0;

          return (
            <Animated.View
              key={index}
              entering={FadeInDown.delay(index * 100).springify()}
              style={styles.settlementCard}
            >
              <View style={styles.settlementFlow}>
                <View style={styles.settlementUser}>
                  <View
                    style={[
                      styles.balanceAvatar,
                      {
                        width: 44,
                        height: 44,
                        marginRight: 0,
                        marginBottom: 8,
                        backgroundColor: "#dc2626",
                      },
                    ]}
                  >
                    {fromUserBalance?.photoURL ? (
                      <Image
                        source={{ uri: fromUserBalance.photoURL }}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: 12,
                        }}
                      />
                    ) : (
                      <Text style={styles.balanceInitials}>
                        {(settlement.fromUserName || settlement.fromUser || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.listTitle} numberOfLines={1}>
                    {fromDisplayName.split(" ")[0]}
                  </Text>
                  {showFromEmail && (
                    <Text style={styles.listSubtitle} numberOfLines={1}>
                      {fromEmail}
                    </Text>
                  )}
                </View>

                <View style={styles.settlementArrow}>
                  <Ionicons name="arrow-forward" size={20} color="#DAA520" />
                </View>

                <View style={styles.settlementUser}>
                  <View
                    style={[
                      styles.balanceAvatar,
                      {
                        width: 44,
                        height: 44,
                        marginRight: 0,
                        marginBottom: 8,
                        backgroundColor: "#059669",
                      },
                    ]}
                  >
                    {toUserBalance?.photoURL ? (
                      <Image
                        source={{ uri: toUserBalance.photoURL }}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: 12,
                        }}
                      />
                    ) : (
                      <Text style={styles.balanceInitials}>
                        {(settlement.toUserName || settlement.toUser || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.listTitle} numberOfLines={1}>
                    {toDisplayName.split(" ")[0]}
                  </Text>
                  {showToEmail && (
                    <Text style={styles.listSubtitle} numberOfLines={1}>
                      {toEmail}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.settlementAmountBox}>
                <Text style={styles.settlementLabel}>Suggested Payment</Text>
                <Text style={styles.settlementAmount}>
                  Rs {settlement.amount.toFixed(1)}
                </Text>
                {isSettled ? (
                  <View style={{ marginTop: 10 }}>
                    <Text
                      style={[styles.settlementLabel, { color: "#059669" }]}
                    >
                      Settled
                    </Text>
                  </View>
                ) : isPending ? (
                  <View style={{ marginTop: 10 }}>
                    <Text
                      style={[styles.settlementLabel, { color: "#b45309" }]}
                    >
                      The amount settles only when both users click ‘Settled’
                    </Text>
                  </View>
                ) : null}
                {isInvolved && !alreadyConfirmed && !isSettled && (
                  <TouchableOpacity
                    style={{
                      marginTop: 12,
                      backgroundColor: "#DAA520",
                      borderRadius: 12,
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      alignSelf: "center",
                    }}
                    onPress={async () => {
                      try {
                        const currentEmailLower = (
                          user!.email || ""
                        ).toLowerCase();
                        const otherEmailLower =
                          (settlement.fromUser || "").toLowerCase() ===
                          currentEmailLower
                            ? (settlement.toUser || "").toLowerCase()
                            : (settlement.fromUser || "").toLowerCase();
                        const confirmationsLower = (
                          settlement.confirmations || []
                        ).map((c: string) => (c || "").toLowerCase());
                        const willBeSettled =
                          confirmationsLower.includes(otherEmailLower);

                        await confirmSettlement(
                          groupId as string,
                          settlement.fromUser,
                          settlement.toUser,
                          settlement.amount,
                          user!.email!
                        );
                        Alert.alert(
                          willBeSettled
                            ? "Settlement completed"
                            : "Confirmation recorded",
                          willBeSettled
                            ? "Both parties have confirmed. This payment is now marked as Settled."
                            : "Thanks — your confirmation has been recorded. The amount settles only when both users click 'Settled'."
                        );
                        handleRefresh();
                      } catch (e) {}
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "800" }}>
                      Settled
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          );
        })
      )}
    </View>
  );

  const renderAnalyticsTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Trends</Text>
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        {Object.entries(summary?.expensesByMonth || {})
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([month, amount]) => (
            <View key={month} style={styles.listCard}>
              <View style={styles.listIconContainer}>
                <Ionicons name="calendar-outline" size={20} color="#DAA520" />
              </View>
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{month}</Text>
              </View>
              <Text style={styles.listValue}>Rs {amount.toFixed(0)}</Text>
            </View>
          ))}
      </Animated.View>

      <View style={{ marginTop: 24 }}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <Animated.View
          entering={FadeInUp.delay(300).springify()}
          style={[styles.statsGrid, { marginTop: 16 }]}
        >
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Avg Bill</Text>
            <Text style={styles.statValue}>
              Rs{" "}
              {summary?.totalExpenses
                ? (summary.totalAmount / summary.totalExpenses).toFixed(0)
                : 0}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Per Person</Text>
            <Text style={styles.statValue}>
              Rs{" "}
              {group?.members?.length
                ? (summary!.totalAmount / group.members.length).toFixed(0)
                : 0}
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DAA520" />
        <Text style={styles.loadingText}>Analyzing group finances...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={["#B8860B", "#DAA520", "#FFD700"]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack?.()) {
                router.back();
              } else {
                router.replace("/(tabs)/home" as any);
              }
            }}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Financial Report
          </Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {group?.name || "Loading group..."}
        </Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { key: "overview", label: "Insights", icon: "pie-chart-outline" },
          { key: "balances", label: "Balances", icon: "wallet-outline" },
          {
            key: "settlements",
            label: "Settle",
            icon: "swap-horizontal-outline",
          },
          { key: "analytics", label: "Trends", icon: "bar-chart-outline" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab(tab.key as TabType)}
          >
            <Ionicons
              name={tab.icon as any}
              size={22}
              color={activeTab === tab.key ? "#DAA520" : "#94a3b8"}
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
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#DAA520"
            />
          }
        >
          {activeTab === "overview" && renderOverviewTab()}
          {activeTab === "balances" && renderBalancesTab()}
          {activeTab === "settlements" && renderSettlementsTab()}
          {activeTab === "analytics" && renderAnalyticsTab()}
        </ScrollView>
      </View>
    </View>
  );
}
