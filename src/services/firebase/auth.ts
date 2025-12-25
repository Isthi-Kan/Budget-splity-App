import {
    createUserWithEmailAndPassword,
    reload,
    sendEmailVerification,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from "firebase/auth";
import { auth } from "./config";
import { createUserDocument, getUserDocument, updateLastSeen } from "./users";

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
    await createUserDocument(user.uid, user.email!, displayName);
    
    // Send email verification - make this blocking to ensure it's sent
    try {
      await sendEmailVerification(user);
      
    } catch (emailError: any) {
      
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
    
    
    const user = userCredential.user;
    
    // Check if user document exists in Firestore (fallback for old users)
    
    const existingUserDoc = await getUserDocument(user.uid);
    
    if (!existingUserDoc) {
      
      try {
        await createUserDocument(user.uid, user.email!, user.displayName || '');
        
      } catch (docError: any) {
        
        // Don't fail login if user document creation fails
      }
    } else {
      
    }
    
    // Update last seen timestamp
    try {
      await updateLastSeen(user.uid);
      
    } catch (lastSeenError: any) {
      
      // Don't fail login if last seen update fails
    }
    
    return user;
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
    
    
    if (!auth.currentUser) {
      
      throw new Error("No user is currently signed in.");
    }
    
    const user = auth.currentUser;
    
    // Force refresh user data to ensure we have latest info
    await user.reload();
    
    
    // Check if email is already verified after refresh
    if (user.emailVerified) {
      
      throw new Error("Email is already verified.");
    }
    
    
    
    // Send verification email with action code settings for better debugging
    const actionCodeSettings = {
      url: `https://${auth.app.options.authDomain}/?email=${user.email}`,
      handleCodeInApp: false
    };
    
    await sendEmailVerification(user, actionCodeSettings);
    
    
    
    return {
      success: true,
      userEmail: user.email,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    
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
    
    
    if (!auth.currentUser) {
      
      throw new Error("No user is currently signed in.");
    }
    
    const user = auth.currentUser;
    
    // Force reload user data from Firebase servers
    await reload(user);
    
    
    if (user.emailVerified) {
      
      return true;
    } else {
      
      return false;
    }
  } catch (error: any) {
    
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
