import { Dimensions, Platform, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  background: {
    flex: 1,
  },
  iconComposition: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: "#fffbeb",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#DAA520",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    transform: [{ rotate: '45deg' }],
  },
  logoSection: {
    alignItems: "center",
    marginVertical: 40,
  },
  appName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#ffffffff",
    marginTop: 30,
    letterSpacing: 2,
  },
  appTagline: {
    fontSize: 14,
    color: "#000000ff",
    fontWeight: "600",
    marginTop: 4,
  },
  header: {
    height: height * 0.45,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 40 : 20,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  
  imageContainer: {
    width: width * 0.7,
    height: width * 0.7,
    maxWidth: 280,
    maxHeight: 280,
    justifyContent: "center",
    alignItems: "center",
  },
  heroImage: {
    width: "120%",
    height: "120%",
  },
  contentSheet: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -30,
    paddingHorizontal: 32,
    paddingTop: 40,
    alignItems: "center",
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
  textContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    width: "100%",
    paddingBottom: 40,
  },
  getStartedButton: {
    backgroundColor: "#DAA520",
    paddingVertical: 18,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#DAA520",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  getStartedText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  authContainer: {
    width: "100%",
    gap: 16,
  },
  loginButton: {
    backgroundColor: "#f8fafc",
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  loginText: {
    color: "#64748b",
    fontSize: 18,
    fontWeight: "bold",
  },
  signupButton: {
    backgroundColor: "#DAA520",
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#DAA520",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  signupText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
