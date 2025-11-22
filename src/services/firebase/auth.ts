import {
  createUserWithEmailAndPassword,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./config";

export const signUpUser = async (email: string, password: string, displayName?: string) => {
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with display name if provided
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    
    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName || "",
      emailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    // Send email verification - make this blocking to ensure it's sent
    try {
      await sendEmailVerification(user);
      console.log("Verification email sent successfully");
    } catch (emailError: any) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail signup but log the error
    }
    
    return user;
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error("Failed to sign out. Please try again.");
  }
};

// Email verification functions
export const sendVerificationEmail = async () => {
  try {
    console.log("🔍 Starting email verification process...");
    
    if (!auth.currentUser) {
      console.error("❌ No user is currently signed in");
      throw new Error("No user is currently signed in.");
    }
    
    const user = auth.currentUser;
    console.log("📋 User details:", {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      isAnonymous: user.isAnonymous,
      providerData: user.providerData
    });
    
    // Force refresh user data to ensure we have latest info
    await user.reload();
    console.log("🔄 User data refreshed");
    
    // Check if email is already verified after refresh
    if (user.emailVerified) {
      console.log("✅ Email is already verified, no need to send");
      throw new Error("Email is already verified.");
    }
    
    console.log("📧 Attempting to send verification email to:", user.email);
    console.log("🔧 Firebase Auth domain:", auth.app.options.authDomain);
    
    // Send verification email with action code settings for better debugging
    const actionCodeSettings = {
      url: `https://${auth.app.options.authDomain}/?email=${user.email}`,
      handleCodeInApp: false
    };
    
    await sendEmailVerification(user, actionCodeSettings);
    
    console.log("✅ sendEmailVerification() completed successfully");
    console.log("📬 Email should be sent to:", user.email);
    console.log("⏰ Current time:", new Date().toISOString());
    
    return {
      success: true,
      userEmail: user.email,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error("❌ Email verification error details:", {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    // Check for specific Firebase error codes
    if (error.code === 'auth/too-many-requests') {
      throw new Error("Too many email requests. Please wait a few minutes before trying again.");
    } else if (error.code === 'auth/user-disabled') {
      throw new Error("This account has been disabled.");
    } else if (error.code === 'auth/user-not-found') {
      throw new Error("User account not found. Please sign up again.");
    }
    
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

export const checkEmailVerification = async () => {
  try {
    console.log("🔍 Checking email verification status...");
    
    if (!auth.currentUser) {
      console.error("❌ No current user found");
      throw new Error("No user is currently signed in.");
    }
    
    const user = auth.currentUser;
    console.log("👤 Current user before reload:", {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified
    });
    
    // Force reload user data from Firebase servers
    await reload(user);
    console.log("🔄 User data reloaded from server");
    
    console.log("👤 Current user after reload:", {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified
    });
    
    if (user.emailVerified) {
      console.log("✅ Email verification confirmed!");
      return true;
    } else {
      console.log("❌ Email still not verified");
      return false;
    }
  } catch (error: any) {
    console.error("❌ Error checking verification status:", error);
    throw new Error(`Failed to check email verification: ${error.message}`);
  }
};

// Helper function to provide user-friendly error messages
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password is too weak. Please choose a stronger password.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
      return "No account found with this email address.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/invalid-credential":
      return "Invalid email or password. Please check your credentials.";
    default:
      return "An error occurred during authentication. Please try again.";
  }
};
