import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { styles } from "../styles";

interface LogoutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutModal = ({
  visible,
  onClose,
  onConfirm,
}: LogoutModalProps) => {
  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="fade"
      statusBarTranslucent={true}
    >
      <TouchableOpacity
        style={[styles.modalOverlay, { justifyContent: "center", paddingHorizontal: 20 }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View entering={FadeInUp} style={styles.logoutModal}>
          <Text style={styles.logoutTitle}>Confirm Logout</Text>
          <Text style={styles.logoutMessage}>
            Are you sure you want to sign out from Splitify?
          </Text>
          <View style={styles.logoutButtonsRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Wait, No</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmLogoutButton}
              onPress={onConfirm}
            >
              <Text style={styles.confirmLogoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};
