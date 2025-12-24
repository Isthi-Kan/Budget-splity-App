import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { User } from "../../../../types";
import { styles } from "../styles";

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  onViewProfile: () => void;
  onLogout: () => void;
}

const ACTION_ITEMS = (onViewProfile: () => void, onLogout: () => void) => [
  {
    id: "profile",
    title: "View Profile",
    icon: "person-outline",
    color: "#DAA520",
    onPress: onViewProfile,
  },
  {
    id: "logout",
    title: "Logout Account",
    icon: "log-out-outline",
    color: "#ef4444",
    onPress: onLogout,
    isLogout: true,
  },
];

export const ProfileModal = ({
  visible,
  onClose,
  user,
  onViewProfile,
  onLogout,
}: ProfileModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
          <View style={styles.modalIndicator} />

          <View style={styles.profileHeader}>
            <View style={styles.largeProfileCircle}>
              <Text style={styles.largeProfileInitials}>
                {user?.name?.charAt(0).toUpperCase() ||
                  user?.email?.charAt(0).toUpperCase() ||
                  "U"}
              </Text>
            </View>
            <Text style={styles.userName}>{user?.name || "User"}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>

          <View style={styles.modalActions}>
            {ACTION_ITEMS(onViewProfile, onLogout).map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(100 * index).springify()}
              >
                <TouchableOpacity
                  style={[
                    styles.modalActionButton,
                    item.isLogout ? styles.logoutButton : null,
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalActionIcon}>
                    <Ionicons
                      name={item.icon as any}
                      size={22}
                      color={item.color}
                    />
                  </View>
                  <Text
                    style={[
                      styles.modalActionText,
                      item.isLogout ? styles.logoutText : null,
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={item.isLogout ? "#fee2e2" : "#cbd5e1"}
                  />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};
