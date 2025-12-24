import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    addMemberByEmail,
    clearGroupsCache,
    createGroup,
} from "../../services/firebase/groups";
import { useApp } from "../../store";

export default function CreateGroup() {
  const router = useRouter();
  const { state } = useApp();
  const { user } = state;

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [memberEmails, setMemberEmails] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async () => {
    console.log("🏗️ Group creation started");

    if (!user) {
      console.log("❌ No user found");
      Alert.alert("Error", "You must be logged in to create a group");
      return;
    }

    if (!groupName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    console.log("✅ Validation passed, starting creation...");
    setLoading(true);

    // Add timeout protection
    const createTimeout = setTimeout(() => {
      console.error("⏰ Group creation timeout after 30 seconds");
      setLoading(false);
      Alert.alert(
        "Timeout",
        "Group creation timed out. Please check your connection and try again."
      );
    }, 30000);

    try {
      // Parse member emails
      console.log("📧 Parsing member emails...");
      const emails = memberEmails
        .split(/[,\n]/)
        .map((email) => email.trim())
        .filter((email) => email.length > 0);
      console.log("📧 Parsed emails:", emails);

      // Validate emails
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emails.filter((email) => !emailRegex.test(email));

      if (invalidEmails.length > 0) {
        console.log("❌ Invalid emails found:", invalidEmails);
        clearTimeout(createTimeout);
        Alert.alert(
          "Invalid Emails",
          `These emails are invalid: ${invalidEmails.join(", ")}`
        );
        setLoading(false);
        return;
      }

      console.log("🔄 Calling createGroup function...");
      const groupId = await createGroup(
        user.uid,
        groupName.trim(),
        description.trim() || undefined,
        [] // We'll add members by email after group creation
      );
      console.log("✅ Group created with ID:", groupId);

      clearTimeout(createTimeout);

      // If there are member emails, send invitations
      let successfulInvites = 0;
      let failedInvites: string[] = [];

      if (emails.length > 0) {
        console.log("📨 Sending email invitations to:", emails);

        for (const email of emails) {
          try {
            console.log("📨 Sending invitation to:", email);
            await addMemberByEmail(groupId, email);
            console.log(`✅ Successfully invited ${email}`);
            successfulInvites++;
          } catch (emailError: any) {
            console.warn(`⚠️ Failed to invite ${email}:`, emailError.message);
            failedInvites.push(email);
          }
        }

        console.log("📨 Email invitation summary:", {
          successful: successfulInvites,
          failed: failedInvites.length,
          failedEmails: failedInvites,
        });
      }

      console.log("🎉 Group creation completed successfully");

      // Clear cache to ensure new group appears immediately
      if (user?.uid) {
        clearGroupsCache(user.uid);
      }

      // Clear form state
      console.log("🧹 Clearing form state...");
      const createdGroupName = groupName; // Store before clearing
      setGroupName("");
      setDescription("");
      setMemberEmails("");

      // Navigate to home
      console.log("🔄 Navigating to home...");
      router.push("/(tabs)/home");

      // Show appropriate success message based on invitation results
      setTimeout(() => {
        if (failedInvites.length === 0 && successfulInvites > 0) {
          Alert.alert(
            "Group Created!",
            `Group "${createdGroupName}" created successfully! All ${successfulInvites} members were invited.`
          );
        } else if (failedInvites.length > 0 && successfulInvites > 0) {
          Alert.alert(
            "Group Created!",
            `Group "${createdGroupName}" created successfully!\n\n✅ ${successfulInvites} members invited\n⚠️ ${
              failedInvites.length
            } invitations failed (users not found):\n${failedInvites.join(
              ", "
            )}\n\nTip: Users must sign up for the app before they can be added to groups.`
          );
        } else if (failedInvites.length > 0 && successfulInvites === 0) {
          Alert.alert(
            "Group Created!",
            `Group "${createdGroupName}" created successfully!\n\nNote: Member invitations failed because these users haven't signed up yet:\n${failedInvites.join(
              ", "
            )}\n\nYou can invite them later using the group's invite code once they create an account.`
          );
        } else {
          Alert.alert(
            "Group Created!",
            `Group "${createdGroupName}" created successfully!`
          );
        }
      }, 500);
    } catch (error: any) {
      console.error("❌ Group creation error:", error);
      clearTimeout(createTimeout);
      Alert.alert("Error", error.message || "Failed to create group");
    } finally {
      clearTimeout(createTimeout);
      console.log("🔄 Setting loading to false");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create New Group</Text>
          <Text style={styles.subtitle}>
            Create a group to start splitting expenses with friends
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Group Name *</Text>
            <TextInput
              style={styles.input}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Enter group name (e.g., 'Trip to Paris')"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add a description for your group..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Invite Members (Optional)</Text>
            <Text style={styles.helperText}>
              Enter email addresses separated by commas. Note: Users must have
              an account to be added automatically. Others can join later with
              the invite code.
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={memberEmails}
              onChangeText={setMemberEmails}
              placeholder="friend1@email.com, friend2@email.com"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.tipText}>
              💡 Tip: Users without accounts can join later using the group's
              invite code
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 How it works:</Text>
            <Text style={styles.infoText}>
              • You'll be added as the group admin{"\n"}• Invited members will
              receive email invitations{"\n"}• Others can join using the invite
              code{"\n"}• You can add more members later
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            // Navigate to home screen safely instead of router.back()
            router.replace("/(tabs)/home");
          }}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.disabledButton]}
          onPress={handleCreateGroup}
          disabled={loading || !groupName.trim()}
        >
          <Text style={styles.createButtonText}>
            {loading ? "Creating..." : "Create Group"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
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
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 24,
  },
  form: {
    padding: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: "#059669",
    marginTop: 8,
    fontStyle: "italic",
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1f2937",
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  infoBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#1e40af",
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4b5563",
  },
  createButton: {
    flex: 2,
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
  disabledButton: {
    backgroundColor: "#9ca3af",
  },
});
