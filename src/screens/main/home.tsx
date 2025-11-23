import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
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
import { logoutUser } from "../../services/firebase/auth";
import { auth } from "../../services/firebase/config";
import {
  getUserGroups,
  joinGroupByInviteCode,
} from "../../services/firebase/groups";
import { Group } from "../../types";

const { width } = Dimensions.get("window");

// Component for user profile circle with initials
const ProfileCircle = ({
  user,
  onPress,
}: {
  user: any;
  onPress: () => void;
}) => {
  const getInitials = (user: any) => {
    if (user?.displayName) {
      return user.displayName
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

function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Firebase authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log(
        "🔐 Auth state changed:",
        user ? "User logged in" : "User logged out"
      );
      setUser(user);
      setAuthLoading(false);

      // If user is not authenticated, redirect to login
      if (!user) {
        router.replace("/(auth)/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadGroups = async (forceRefresh = false) => {
    if (!user) {
      console.log("⚠️ No user found, skipping group load");
      setLoading(false);
      return;
    }

    console.log("📊 Loading groups for user:", user.uid, { forceRefresh });

    // Don't show loading for cached requests
    if (forceRefresh || groups.length === 0) {
      setLoading(true);
    }

    try {
      const startTime = Date.now();
      const userGroups = await getUserGroups(user.uid, !forceRefresh);
      const loadTime = Date.now() - startTime;

      console.log("✅ Groups loaded:", {
        count: userGroups.length,
        loadTimeMs: loadTime,
        cached: loadTime < 100,
      });

      // Filter out any null/undefined groups
      const validGroups = userGroups.filter((group) => group && group.id);
      setGroups(validGroups);

      if (loadTime > 1000) {
        console.warn("⚠️ Slow loading detected:", loadTime, "ms");
      }
    } catch (error) {
      console.error("❌ Error loading groups:", error);
      Alert.alert("Error", "Failed to load groups. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Load groups immediately on mount and when user changes
    if (user && !authLoading) {
      loadGroups();

      // Also preload in background without UI loading state
      setTimeout(() => {
        loadGroups(true);
      }, 1000);
    }
  }, [user, authLoading]);

  // Refresh groups when screen comes into focus (e.g., after creating a group)
  useFocusEffect(
    useCallback(() => {
      if (user && !authLoading) {
        console.log("🔍 Screen focused - refreshing groups...");
        loadGroups(true); // Force refresh when screen comes into focus
      }
    }, [user, authLoading])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadGroups(true); // Force refresh, bypass cache
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
    try {
      await logoutUser();
      router.replace("/(auth)/login");
    } catch (error: any) {
      Alert.alert("Error", "Failed to logout");
    }
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
    // Add null safety checks
    if (!item) {
      console.warn("⚠️ Null group item received");
      return null;
    }

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

  // Show loading screen while authenticating or fetching groups
  if (authLoading || loading) {
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
              Hello, {user?.displayName || user?.email?.split("@")[0] || "User"}
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
                    {user?.displayName
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
                  {user?.displayName || "User"}
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

      {/* Join Group Modal */}
      <InputModal
        visible={showJoinModal}
        title="Join Group"
        placeholder="Enter group code"
        onCancel={handleJoinModalCancel}
        onSubmit={handleJoinModalSubmit}
        submitText="Join"
        cancelText="Cancel"
      />

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

  logoutAction: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },

  profileActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },

  logoutActionText: {
    color: "#dc2626",
  },

  // Loading State
  loadingText: {
    fontSize: 18,
    color: "white",
    fontWeight: "500",
  },

  // Logout Confirmation Modal
  logoutConfirmModal: {
    backgroundColor: "white",
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 200, // Add top margin to position below the blue section
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },

  logoutModalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    alignItems: "center",
  },

  logoutModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },

  logoutModalContent: {
    padding: 24,
  },

  logoutModalMessage: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },

  logoutModalButtons: {
    flexDirection: "row",
    gap: 12,
  },

  logoutModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  cancelButton: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  confirmButton: {
    backgroundColor: "#dc2626",
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },

  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});

export default HomeScreen;
