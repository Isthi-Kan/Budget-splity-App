import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import InputModal from "../../components/InputModal";
import { joinGroupByInviteCode } from "../../services/firebase/groups";
import { useApp } from "../../store";
import { fetchGroupsAction, logoutAction } from "../../store/actions";
import { Group, User } from "../../types";

const { width, height } = Dimensions.get("window");


// Component for user profile circle with initials
const ProfileCircle = ({
  user,
  onPress,
}: {
  user: User | null;
  onPress: () => void;
}) => {
  const getInitials = (currentUser: User | null) => {
    if (currentUser?.name) {
      return currentUser.name
        .split(" ")
        .map((name: string) => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <TouchableOpacity style={styles.profileCircle} onPress={onPress}>
      <Text style={styles.profileInitials}>{getInitials(user)}</Text>
    </TouchableOpacity>
  );
};

// Component for curved separator
const CurvedSeparator = () => {
  return (
    <Svg height="50" width={width} style={styles.curvedSeparator}>
      <Path
        d={`M0,0 Q${width / 2},50 ${width},0 L${width},50 L0,50 Z`}
        fill="#3b82f6"
      />
    </Svg>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const { user, groups, isLoading: isGlobalLoading } = state;
  
  const [refreshing, setRefreshing] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const loadGroups = async (forceRefresh = false) => {
    if (!user) {
      console.log("⚠️ No user found, skipping group load");
      return;
    }

    // If fetching in background (refreshing), don't set global loading if we already have groups
    // But fetchGroupsAction sets loading if forceRefresh is true.
    // Ideally, we want 'refreshing' state for Pull-to-Refresh.
    
    await fetchGroupsAction(dispatch, user.uid, forceRefresh);
    setRefreshing(false);
  };

  useEffect(() => {
    // Initial load when user is available
    if (user && groups.length === 0) {
      loadGroups(false);
    }
  }, [user]); // Groups dependency removed to avoid loops, only load on user chage or empty

  // Refresh groups when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        // We can do a silent refresh here if needed
        // fetchGroupsAction(dispatch, user.uid, true); 
        // For now, let's just rely on initial load or manual refresh to save reads
      }
    }, [user])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadGroups(true);
  };

  const handleProfilePress = () => {
    setShowProfileModal(true);
  };

  const handleProfileModalClose = () => {
    setShowProfileModal(false);
  };

  const handleViewProfile = () => {
    setShowProfileModal(false);
    router.push("/(tabs)/profile");
  };

  const handleLogoutPress = () => {
    setShowProfileModal(false);
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await logoutAction(dispatch);
    router.replace("/(auth)/login");
    // Navigation protection in _layout will also handle the redirect, but explicit replace is fine.
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const handleCreateGroup = () => {
    router.push("/create-group");
  };

  const handleJoinGroup = () => {
    setShowJoinModal(true);
  };

  const handleJoinModalCancel = () => {
    setShowJoinModal(false);
  };

  const handleJoinModalSubmit = async (code: string) => {
    setShowJoinModal(false);

    if (!user) {
      Alert.alert("Error", "You must be logged in to join a group");
      return;
    }

    try {
      console.log("🔗 Attempting to join group with code:", code);
      // Join group logic is not yet in store actions, using service directly
      await joinGroupByInviteCode(code.trim().toUpperCase(), user.uid);
      Alert.alert("Success", "Joined group successfully!");
      loadGroups(true); // Force refresh to show new group
    } catch (error: any) {
      console.error("❌ Join group error:", error);
      Alert.alert("Error", error.message || "Failed to join group");
    }
  };

  const handleGroupPress = (group: Group) => {
    router.push(`/group/${group.id}`);
  };

  const renderGroupItem = ({ item }: { item: Group }) => {
    if (!item) return null;

    return (
      <TouchableOpacity
        style={styles.modernGroupCard}
        onPress={() => handleGroupPress(item)}
      >
        <View style={styles.groupCardHeader}>
          <View style={styles.groupIcon}>
            <Text style={styles.groupIconText}>
              {(item.name || "U").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.modernGroupName}>
              {item.name || "Unnamed Group"}
            </Text>
            <Text style={styles.modernMemberCount}>
              {item.members?.length || 0} members
            </Text>
          </View>
          <View style={styles.groupArrow}>
            <Text style={styles.arrowText}>›</Text>
          </View>
        </View>
        {item.description && (
          <Text style={styles.groupDescription}>{item.description}</Text>
        )}
        <Text style={styles.groupDate}>
          Created{" "}
          {item.createdAt
            ? new Date(item.createdAt).toLocaleDateString()
            : "Unknown"}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.modernEmptyState}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>📊</Text>
      </View>
      <Text style={styles.modernEmptyTitle}>No groups yet</Text>
      <Text style={styles.modernEmptyText}>
        Create your first group or join one with an invite code to start
        splitting expenses with friends!
      </Text>
    </View>
  );

  // Show loading screen only on initial load if we have no groups
  // If refreshing, we show the refresh control instead
  if (isGlobalLoading && groups.length === 0) {
    return (
      <View style={styles.modernContainer}>
        <LinearGradient
          colors={["#3b82f6", "#1e40af"]}
          style={styles.loadingHeader}
        >
          <Text style={styles.loadingText}>Loading your groups...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.modernContainer}>
      {/* Blue Header Section with Profile */}
      <LinearGradient
        colors={["#3b82f6", "#1e40af"]}
        style={styles.modernHeader}
      >
        <View style={styles.headerContent}>
          <View style={styles.welcomeSection}>
            <Text style={styles.modernTitle}>My Groups</Text>
            <Text style={styles.modernSubtitle}>
              Hello, {user?.name || user?.email?.split("@")[0] || "User"}
              ! 👋
            </Text>
          </View>
          <ProfileCircle user={user} onPress={handleProfilePress} />
        </View>
      </LinearGradient>

      {/* Curved Separator */}
      <CurvedSeparator />

      {/* White Content Section */}
      <View style={styles.contentSection}>
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroupItem}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          style={styles.modernGroupsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            groups.length === 0 ? styles.emptyListContainer : {}
          }
        />

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.modernJoinButton}
            onPress={handleJoinGroup}
          >
            <Text style={styles.joinButtonText}>Join Group</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modernCreateButton}
            onPress={handleCreateGroup}
          >
            <Text style={styles.createButtonText}>Create Group</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Join Group Modal */}
      <InputModal
        visible={showJoinModal}
        title="Join Group"
        message="Enter the 6-character invite code to join an existing group"
        placeholder="ABC123"
        onCancel={handleJoinModalCancel}
        onSubmit={handleJoinModalSubmit}
        submitText="Join"
        cancelText="Cancel"
      />

      {/* Profile Modal */}
      {showProfileModal && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={handleProfileModalClose}
          />
          <View style={styles.profileModal}>
            <View style={styles.profileModalHeader}>
              <Text style={styles.profileModalTitle}>Profile</Text>
            </View>
            <View style={styles.profileModalContent}>
              <View style={styles.userInfo}>
                <View style={styles.largeProfileCircle}>
                  <Text style={styles.largeProfileInitials}>
                    {user?.name
                      ?.split(" ")
                      .map((name: string) => name[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) ||
                      user?.email?.slice(0, 2).toUpperCase() ||
                      "U"}
                  </Text>
                </View>
                <Text style={styles.userName}>
                  {user?.name || "User"}
                </Text>
                <Text style={styles.userEmail}>
                  {user?.email || "No email"}
                </Text>
              </View>
              <View style={styles.profileActions}>
                <TouchableOpacity
                  style={styles.profileActionButton}
                  onPress={handleViewProfile}
                >
                  <Text style={styles.profileActionText}>View Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.profileActionButton, styles.logoutAction]}
                  onPress={handleLogoutPress}
                >
                  <Text
                    style={[styles.profileActionText, styles.logoutActionText]}
                  >
                    Logout
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleLogoutCancel}
        >
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={styles.logoutConfirmModal}
              activeOpacity={1}
              onPress={() => {}} // Prevent closing when tapping modal content
            >
              <View style={styles.logoutModalHeader}>
                <Text style={styles.logoutModalTitle}>Logout</Text>
              </View>
              <View style={styles.logoutModalContent}>
                <Text style={styles.logoutModalMessage}>
                  Are you sure you want to logout?
                </Text>
                <View style={styles.logoutModalButtons}>
                  <TouchableOpacity
                    style={[styles.logoutModalButton, styles.cancelButton]}
                    onPress={handleLogoutCancel}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.logoutModalButton, styles.confirmButton]}
                    onPress={handleLogoutConfirm}
                  >
                    <Text style={styles.confirmButtonText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Modern Container
  modernContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Modern Header with Gradient
  modernHeader: {
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },

  loadingHeader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },

  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },

  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  welcomeSection: {
    flex: 1,
  },

  modernTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },

  modernSubtitle: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },

  // Profile Circle
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  profileInitials: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },

  // Curved Separator
  curvedSeparator: {
    position: "absolute",
    top: 140,
    left: 0,
    right: 0,
    zIndex: 1,
  },

  // Content Section
  contentSection: {
    flex: 1,
    backgroundColor: "white",
    marginTop: 30,
    paddingTop: 40,
  },

  // Modern Groups List
  modernGroupsList: {
    flex: 1,
    paddingHorizontal: 20,
  },

  emptyListContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },

  // Modern Group Card
  modernGroupCard: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },

  groupCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  groupIconText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },

  groupInfo: {
    flex: 1,
  },

  modernGroupName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },

  modernMemberCount: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },

  groupArrow: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  arrowText: {
    fontSize: 20,
    color: "#cbd5e1",
    fontWeight: "300",
  },

  groupDescription: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
    lineHeight: 20,
  },

  groupDate: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },

  // Modern Empty State
  modernEmptyState: {
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },

  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },

  emptyIconText: {
    fontSize: 40,
  },

  modernEmptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
    textAlign: "center",
  },

  modernEmptyText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },

  modernJoinButton: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#3b82f6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },

  joinButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3b82f6",
  },

  modernCreateButton: {
    flex: 1,
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },

  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },

  // Profile Modal
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    zIndex: 100,
  },

  modalBackdrop: {
    flex: 1,
  },

  profileModal: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },

  profileModalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    alignItems: "center",
  },

  profileModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },

  profileModalContent: {
    padding: 24,
  },

  userInfo: {
    alignItems: "center",
    marginBottom: 32,
  },

  largeProfileCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  largeProfileInitials: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },

  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },

  userEmail: {
    fontSize: 16,
    color: "#64748b",
  },

  profileActions: {
    gap: 12,
  },

  profileActionButton: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  profileActionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#334155",
  },

  logoutAction: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },

  logoutActionText: {
    color: "#ef4444",
  },

  // Logout Confirmation Modal (nested inside modalOverlay)
  logoutConfirmModal: {
    backgroundColor: "white",
    borderRadius: 20,
    marginHorizontal: 30,
    marginTop: height / 3, // Center vertically roughly
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },

  logoutModalHeader: {
    alignItems: "center",
    marginBottom: 16,
  },

  logoutModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },

  logoutModalContent: {
    alignItems: "center",
  },

  logoutModalMessage: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
  },

  logoutModalButtons: {
    flexDirection: "row",
    gap: 12,
  },

  logoutModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  cancelButton: {
    backgroundColor: "#f1f5f9",
  },

  confirmButton: {
    backgroundColor: "#ef4444",
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },

  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});
