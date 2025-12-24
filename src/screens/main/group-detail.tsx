import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../services/firebase/config";
import {
  calculateGroupSummary,
  getGroupExpenses,
} from "../../services/firebase/expenses";
import { getGroup } from "../../services/firebase/groups";
import { getUserDocument } from "../../services/firebase/users";
import { Balance, Expense, Group, User } from "../../types";

export default function GroupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = auth.currentUser;

  console.log("🔍 GroupDetail component initialized with ID:", id);

  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Early return if no ID (this prevents infinite loading)
  if (!id) {
    console.error("❌ No group ID in URL parameters");
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Invalid group ID</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/(tabs)/home")}
        >
          <Text style={styles.backButtonText}>Go Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const loadGroupData = async () => {
    if (!id || !user) return;

    try {
      // Load group details
      const groupData = await getGroup(id);
      if (!groupData) {
        Alert.alert("Error", "Group not found", [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)/home"),
          },
        ]);
        return;
      }

      setGroup(groupData);

      // Load expenses
      const groupExpenses = await getGroupExpenses(id);
      setExpenses(groupExpenses);

      // Calculate balances
      const summary = await calculateGroupSummary(id);
      setBalances(summary.balances);
    } catch (error) {
      console.error("Error loading group data:", error);
      Alert.alert("Error", "Failed to load group data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    console.log("🔄 useEffect triggered - ID:", id, "User:", user?.uid);

    loadGroupData();
  }, [id, user?.uid]); // Use user?.uid instead of user to prevent unnecessary rerenders

  const handleRefresh = () => {
    console.log("🔄 Manual refresh triggered");
    setRefreshing(true);

    loadGroupData();
  };

  const handleAddExpense = () => {
    router.push(`/(tabs)/add-expense?groupId=${id}` as any);
  };

  const handleShareInviteCode = async () => {
    if (!group) return;

    try {
      await Share.share({
        message: `Join my expense group "${group.name}" with invite code: ${group.inviteCode}`,
        title: "Join my expense group",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleShowMembers = async () => {
    if (!group) return;

    setShowMembersModal(true);
    setLoadingMembers(true);

    try {
      // Fetch user details for all members
      const memberData = await Promise.all(
        group.members.map(async (memberId) => {
          try {
            const userData = await getUserDocument(memberId);
            if (userData) {
              return userData;
            } else {
              // Create a fallback user object if no document exists
              const isEmailUid =
                memberId.includes("@") && memberId.includes(".");
              return {
                uid: memberId,
                email: isEmailUid ? memberId : "",
                name: isEmailUid
                  ? memberId
                  : `User ${memberId.substring(0, 8)}`,
                createdAt: null,
                lastSeen: null,
              } as User;
            }
          } catch (error) {
            console.warn(`Failed to fetch user ${memberId}:`, error);
            // Create fallback user object
            const isEmailUid = memberId.includes("@") && memberId.includes(".");
            return {
              uid: memberId,
              email: isEmailUid ? memberId : "",
              name: isEmailUid
                ? memberId
                : `User ${memberId.substring(0, 8)} (Missing Profile)`,
              createdAt: null,
              lastSeen: null,
            } as User;
          }
        })
      );

      setMembers(memberData);
    } catch (error) {
      console.error("Error loading members:", error);
      Alert.alert("Error", "Failed to load group members");
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleExpensePress = (expense: Expense) => {
    // For now, just show expense details in an alert
    Alert.alert(
      expense.title,
      `Amount: $${expense.amount.toFixed(2)}\nPaid by: ${expense.paidBy}\n${
        expense.note ? `Note: ${expense.note}` : ""
      }`,
      [{ text: "OK" }]
    );
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity
      style={styles.expenseCard}
      onPress={() => handleExpensePress(item)}
    >
      <View style={styles.expenseHeader}>
        <Text style={styles.expenseDescription}>{item.title}</Text>
        <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
      </View>
      <View style={styles.expenseFooter}>
        <Text style={styles.expensePaidBy}>Paid by {item.paidBy}</Text>
        <Text style={styles.expenseDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderBalanceItem = ({ item }: { item: Balance }) => {
    const isPositive = item.balance > 0;
    const isZero = item.balance === 0;

    return (
      <View style={styles.balanceCard}>
        <Text style={styles.balanceEmail}>{item.uid}</Text>
        <Text
          style={[
            styles.balanceAmount,
            isPositive && styles.positiveAmount,
            !isPositive && !isZero && styles.negativeAmount,
            isZero && styles.zeroAmount,
          ]}
        >
          {isZero
            ? "Settled"
            : isPositive
            ? `Gets $${item.balance.toFixed(2)}`
            : `Owes $${Math.abs(item.balance).toFixed(2)}`}
        </Text>
      </View>
    );
  };

  const renderEmptyExpenses = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No expenses yet</Text>
      <Text style={styles.emptyText}>
        Add your first expense to start tracking group spending
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading group details...</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Group not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{group.name}</Text>
        {group.description && (
          <Text style={styles.description}>{group.description}</Text>
        )}

        <View style={styles.groupInfo}>
          <Text style={styles.memberCount}>{group.members.length} members</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.membersButton}
            onPress={handleShowMembers}
          >
            <Text style={styles.membersButtonText}>Show Members</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.summaryButton}
            onPress={() => router.push(`/group-summary?groupId=${id}` as any)}
          >
            <Text style={styles.summaryButtonText}>Group Summary</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareInviteCode}
          >
            <Text style={styles.shareButtonText}>Share Code</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <View style={styles.tab}>
          <Text style={styles.tabTitle}>Balances</Text>
        </View>
      </View>

      <FlatList
        data={balances}
        keyExtractor={(item) => item.uid}
        renderItem={renderBalanceItem}
        style={styles.balancesList}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.expensesHeader}>
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpenseItem}
        ListEmptyComponent={renderEmptyExpenses}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        style={styles.expensesList}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.addExpenseButton}
        onPress={handleAddExpense}
      >
        <Text style={styles.addExpenseButtonText}>Add Expense</Text>
      </TouchableOpacity>

      {/* Members Modal */}
      <Modal
        visible={showMembersModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Group Members</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowMembersModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loadingMembers ? (
            <View style={styles.modalLoadingContainer}>
              <Text style={styles.modalLoadingText}>Loading members...</Text>
            </View>
          ) : (
            <FlatList
              data={members}
              keyExtractor={(item) => item.uid}
              renderItem={({ item }) => (
                <View style={styles.memberCard}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberInitials}>
                      {(item.email || item.name || item.uid)
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {item.email ||
                        item.name ||
                        `User ${item.uid.substring(0, 8)}`}
                    </Text>
                    <Text style={styles.memberEmail}>
                      {item.email ? "Email Verified" : "Profile Incomplete"}
                    </Text>
                    {item.name && item.name.includes("Missing Profile") && (
                      <Text style={styles.missingProfileText}>
                        Needs to complete signup
                      </Text>
                    )}
                  </View>
                  <View style={styles.memberRole}>
                    <Text style={styles.roleText}>
                      {item.uid === group?.hostId ? "Host" : "Member"}
                    </Text>
                  </View>
                </View>
              )}
              style={styles.membersList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 16,
    lineHeight: 24,
  },
  groupInfo: {
    marginTop: 8,
  },
  memberCount: {
    fontSize: 14,
    color: "#6b7280",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  shareButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    maxWidth: "30%",
    alignItems: "center",
  },
  shareButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
    marginTop: 12,
    flexWrap: "nowrap",
  },
  membersButton: {
    backgroundColor: "#8b5cf6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    maxWidth: "30%",
    alignItems: "center",
  },
  membersButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  summaryButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    maxWidth: "35%",
    alignItems: "center",
  },
  summaryButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  tabsContainer: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  tabTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3b82f6",
  },
  balancesList: {
    maxHeight: 200,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  balanceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  balanceEmail: {
    fontSize: 16,
    color: "#1f2937",
    flex: 1,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  positiveAmount: {
    color: "#059669",
  },
  negativeAmount: {
    color: "#dc2626",
  },
  zeroAmount: {
    color: "#6b7280",
  },
  expensesHeader: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  expensesList: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  expenseCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#059669",
  },
  expenseFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expensePaidBy: {
    fontSize: 14,
    color: "#6b7280",
  },
  expenseDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    marginBottom: 20,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  addExpenseButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    padding: 16,
    margin: 24,
    alignItems: "center",
  },
  addExpenseButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 18,
    color: "#6b7280",
    fontWeight: "bold",
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalLoadingText: {
    fontSize: 16,
    color: "#6b7280",
  },
  membersList: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  memberInitials: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: "#6b7280",
  },
  missingProfileText: {
    fontSize: 12,
    color: "#f59e0b",
    fontStyle: "italic",
    marginTop: 2,
  },
  memberRole: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
});
