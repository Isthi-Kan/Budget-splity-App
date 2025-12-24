import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  calculateGroupSummary,
  getGroupExpenses,
} from "../../../services/firebase/expenses";
import { getGroup } from "../../../services/firebase/groups";
import { getUserDocument } from "../../../services/firebase/users";
import { useApp } from "../../../store";
import { Balance, Expense, Group, User } from "../../../types";
import { styles } from "./styles";

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { state } = useApp();
  const { user } = state;

  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Floating animation for the header summary balance status
  const summaryFloat = useSharedValue(0);

  useEffect(() => {
    summaryFloat.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2500 }),
        withTiming(0, { duration: 2500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedSummaryStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: summaryFloat.value }],
  }));

  const loadGroupData = async () => {
    if (!id || !user) return;

    try {
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
      const groupExpenses = await getGroupExpenses(id);
      setExpenses(groupExpenses);

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
    loadGroupData();
  }, [id, user?.uid]);

  const handleRefresh = () => {
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
        message: `Join my expense group "${group.name}" on Splitify with invite code: ${group.inviteCode}`,
        title: "Join Splitify Group",
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
      const memberData = await Promise.all(
        group.members.map(async (memberId) => {
          try {
            const userData = await getUserDocument(memberId);
            if (userData) return userData;
            
            const isEmailUid = memberId.includes("@") && memberId.includes(".");
            return {
              uid: memberId,
              email: isEmailUid ? memberId : "",
              name: isEmailUid ? memberId : `User ${memberId.substring(0, 8)}`,
              createdAt: null,
              lastSeen: null,
            } as User;
          } catch (error) {
            return {
                uid: memberId,
                email: "",
                name: `User ${memberId.substring(0, 8)}`,
                createdAt: null,
                lastSeen: null,
            } as User;
          }
        })
      );
      setMembers(memberData);
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const userBalance = balances.find(b => b.uid === user?.email || b.uid === user?.uid)?.balance || 0;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#DAA520" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Premium Golden Header */}
      <LinearGradient
        colors={["#B8860B", "#DAA520", "#FFD700"]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/(tabs)/home")}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{group?.name}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleShareInviteCode}>
                <Ionicons name="share-social-outline" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleShowMembers}>
                <Ionicons name="people-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View style={[styles.summaryCard, animatedSummaryStyle]}>
            <Text style={styles.summaryLabel}>Your Balance</Text>
            <Text style={styles.summaryAmount}>Rs {Math.abs(userBalance).toFixed(2)}</Text>
            <Text style={[styles.summaryStatus, { color: userBalance >= 0 ? "#fff" : "#fee2e2" }]}>
                {userBalance === 0 ? "You are settled" : userBalance > 0 ? "You get back" : "You owe"}
            </Text>
        </Animated.View>
      </LinearGradient>

      {/* White Content Sheet */}
      <View style={styles.contentSheet}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#DAA520" />}
        >
          {/* Members Subsection */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Group Members</Text>
              <TouchableOpacity onPress={() => router.push(`/group-summary?groupId=${id}` as any)}>
                <Text style={styles.seeAllText}>Summary</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.memberScroll}
            >
              {balances.map((item, index) => (
                <View key={item.uid} style={styles.memberCard}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberInitials}>{item.uid.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.memberName} numberOfLines={1}>{item.uid.split('@')[0]}</Text>
                  <Text style={[styles.memberBalance, { color: item.balance >= 0 ? "#059669" : "#dc2626" }]}>
                    {item.balance === 0 ? "Settled" : `${item.balance > 0 ? "+" : "-"}Rs ${Math.abs(item.balance).toFixed(2)}`}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Activity Subsection */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <View style={styles.expenseListHeader}>
              <Text style={styles.sectionTitle}>Activity</Text>
            </View>

            {expenses.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="receipt-outline" size={40} color="#cbd5e1" />
                </View>
                <Text style={styles.emptyTitle}>No expenses yet</Text>
                <Text style={styles.emptyText}>Tap the + button to add your first expense for this group.</Text>
              </View>
            ) : (
              <View style={styles.expenseList}>
                {expenses.map((item, index) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.expenseCard}
                    activeOpacity={0.7}
                    onPress={() => {
                        Alert.alert(item.title, `Paid by ${item.paidBy}\nTotal: Rs ${item.amount.toFixed(2)}\nDate: ${new Date(item.createdAt).toLocaleDateString()}`);
                    }}
                  >
                    <View style={styles.expenseIconContainer}>
                      <Ionicons name="cash-outline" size={24} color="#DAA520" />
                    </View>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.expenseMeta}>Paid by {item.paidBy.split('@')[0]}</Text>
                    </View>
                    <View style={styles.expenseAmountContainer}>
                      <Text style={styles.expenseAmount}>Rs {item.amount.toFixed(2)}</Text>
                      <Text style={styles.expenseDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </View>

      {/* Premium FAB */}
      <Animated.View entering={FadeInUp.delay(600).springify()}>
        <TouchableOpacity style={styles.fab} onPress={handleAddExpense} activeOpacity={0.8}>
           <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      </Animated.View>

      {/* Members List Modal */}
      <Modal
        visible={showMembersModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Group Members</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowMembersModal(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {loadingMembers ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color="#DAA520" />
            </View>
          ) : (
            <FlatList
              data={members}
              keyExtractor={(item) => item.uid}
              contentContainerStyle={styles.membersList}
              renderItem={({ item }) => (
                <View style={styles.memberListCard}>
                   <View style={[styles.memberAvatar, { width: 44, height: 44, marginBottom: 0, marginRight: 16 }]}>
                     <Text style={[styles.memberInitials, { fontSize: 16 }]}>
                        {(item.name || item.email || "?").charAt(0).toUpperCase()}
                     </Text>
                   </View>
                   <View style={styles.memberListInfo}>
                     <Text style={styles.memberListName}>{item.name || "Splitify User"}</Text>
                     <Text style={styles.memberListEmail}>{item.email}</Text>
                   </View>
                   {item.uid === group?.hostId && (
                     <View style={styles.hostBadge}>
                        <Text style={styles.hostBadgeText}>Host</Text>
                     </View>
                   )}
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
