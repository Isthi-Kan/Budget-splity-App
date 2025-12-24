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
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        height: height * 0.35,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: Platform.OS === "ios" ? 40 : 20,
    },
    iconComposition: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    glassCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: "rgba(255, 255, 255, 0.25)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "rgba(255, 255, 255, 0.45)",
    },
    headerTitle: {
        fontSize: 36,
        fontWeight: "900",
        color: "white",
        letterSpacing: 6,
        marginBottom: 6,
        textShadowColor: "rgba(0, 0, 0, 0.12)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },
    headerSubtitle: {
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.95)",
        fontWeight: "600",
        letterSpacing: 2,
        textTransform: "uppercase",
    },
    contentSheet: {
        flex: 1,
        backgroundColor: "white",
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        marginTop: -30,
        paddingHorizontal: 32,
        paddingTop: 44,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -12 },
                shadowOpacity: 0.12,
                shadowRadius: 20,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    welcomeText: {
        fontSize: 30,
        fontWeight: "800",
        color: "#0f172a",
        marginBottom: 8,
    },
    instructionText: {
        fontSize: 17,
        color: "#64748b",
        marginBottom: 36,
    },
    inputContainer: {
        marginBottom: 22,
    },
    label: {
        fontSize: 14,
        fontWeight: "700",
        color: "#475569",
        marginBottom: 10,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: "#f1f5f9",
        paddingHorizontal: 20,
        height: 64,
    },
    inputWrapperError: {
        borderColor: "#fee2e2",
        backgroundColor: "#fffafb",
    },
    inputIcon: {
        marginRight: 14,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: "#0f172a",
        height: "100%",
        fontWeight: "500",
    },
    eyeIcon: {
        padding: 4,
    },
    loginButton: {
        backgroundColor: "#DAA520",
        paddingVertical: 20,
        borderRadius: 22,
        alignItems: "center",
        marginTop: 16,
        shadowColor: "#DAA520",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 36,
        paddingBottom: 40,
    },
    footerText: {
        color: "#94a3b8",
        fontSize: 16,
        fontWeight: "500",
    },
    signupText: {
        color: "#DAA520",
        fontWeight: "700",
        fontSize: 16,
    },
    errorText: {
        color: "#ef4444",
        fontSize: 13,
        marginTop: 8,
        marginLeft: 8,
        fontWeight: "600",
    },
    generalErrorContainer: {
        backgroundColor: "#fff1f2",
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#fecaca",
    },
    generalErrorText: {
        color: "#be123c",
        textAlign: "center",
        fontSize: 14,
        fontWeight: "600",
    },
});
