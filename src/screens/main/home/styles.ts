import { Dimensions, Platform, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    background: {
        flex: 1,
    },
    header: {
        height: height * 0.22,
        paddingTop: Platform.OS === "ios" ? 50 : 30,
        paddingHorizontal: 24,
    },
    headerContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    welcomeSection: {
        flex: 1,
    },
    title: {
        fontSize: 34,
        fontWeight: "bold",
        color: "white",
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 18,
        color: "rgba(255, 255, 255, 0.9)",
        fontWeight: "500",
    },
    profileCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "rgba(255, 255, 255, 0.25)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "rgba(255, 255, 255, 0.4)",
    },
    profileInitials: {
        fontSize: 16,
        fontWeight: "bold",
        color: "white",
    },
    contentSheet: {
        flex: 1,
        backgroundColor: "#f8fafc",
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        marginTop: -40,
        paddingHorizontal: 20,
        paddingTop: 30,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -10 },
                shadowOpacity: 0.08,
                shadowRadius: 15,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    listHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1e293b",
    },
    groupsList: {
        flex: 1,
    },
    emptyListContainer: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: 100,
    },
    groupCard: {
        backgroundColor: "white",
        borderRadius: 22,
        marginBottom: 16,
        padding: 18,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#f1f5f9",
        ...Platform.select({
            ios: {
                shadowColor: "#1e293b",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 12,
            },
            android: {
                elevation: 3,
            },
            web: {
                boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                cursor: "pointer",
            }
        }),
    },
    groupIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: "#fffbeb", // Light gold tint
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
        borderWidth: 1,
        borderColor: "#fef3c7",
    },
    groupInfo: {
        flex: 1,
    },
    groupName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 4,
    },
    memberCount: {
        fontSize: 14,
        color: "#64748b",
        fontWeight: "500",
    },
    groupArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#f8fafc",
        justifyContent: "center",
        alignItems: "center",
    },
    emptyState: {
        alignItems: "center",
        paddingHorizontal: 40,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#fffbeb",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#b45309", // Warm gold/brown text
        marginBottom: 10,
    },
    emptyText: {
        fontSize: 16,
        color: "#64748b",
        textAlign: "center",
        lineHeight: 24,
    },
    actionButtons: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingVertical: 24,
        gap: 12,
        backgroundColor: "white",
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
    },
    joinButton: {
        flex: 1,
        backgroundColor: "#f8fafc",
        borderWidth: 1.5,
        borderColor: "#e2e8f0",
        borderRadius: 18,
        paddingVertical: 16,
        alignItems: "center",
    },
    joinButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#64748b",
    },
    createButton: {
        flex: 1,
        backgroundColor: "#DAA520", // Golden button
        borderRadius: 18,
        paddingVertical: 16,
        alignItems: "center",
        shadowColor: "#DAA520",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "white",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "white",
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        paddingTop: 12,
        paddingBottom: Platform.OS === "ios" ? 40 : 24,
        maxHeight: height * 0.85,
    },
    modalIndicator: {
        width: 44,
        height: 6,
        backgroundColor: "#f1f5f9",
        borderRadius: 3,
        alignSelf: "center",
        marginBottom: 20,
    },
    profileHeader: {
        alignItems: "center",
        paddingBottom: 24,
    },
    largeProfileCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#fffbeb",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
        borderWidth: 3,
        borderColor: "white",
        ...Platform.select({
            ios: {
                shadowColor: "#b45309",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    largeProfileInitials: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#b45309",
    },
    userName: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#0f172a",
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        color: "#64748b",
    },
    modalActions: {
        paddingHorizontal: 24,
        gap: 12,
    },
    modalActionButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        padding: 14,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#f1f5f9",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.03,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    modalActionIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "#fffbeb",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    modalActionText: {
        fontSize: 17,
        fontWeight: "600",
        color: "#334155",
        flex: 1,
    },
    logoutButton: {
        borderColor: "#fee2e2",
        backgroundColor: "#fffafb",
    },
    logoutText: {
        color: "#ef4444",
    },
    logoutModal: {
        backgroundColor: "white",
        borderRadius: 28,
        padding: 24,
        width: width * 0.88,
        maxWidth: 400,
        alignItems: "center",
    },
    logoutTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#0f172a",
        marginBottom: 12,
    },
    logoutMessage: {
        fontSize: 16,
        color: "#64748b",
        textAlign: "center",
        marginBottom: 28,
        lineHeight: 24,
    },
    logoutButtonsRow: {
        flexDirection: "row",
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
    },
    cancelButtonText: {
        color: "#475569",
        fontWeight: "700",
        fontSize: 16,
    },
    confirmLogoutButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: "#ef4444",
        alignItems: "center",
    },
    confirmLogoutText: {
        color: "white",
        fontWeight: "700",
        fontSize: 16,
    },
});
