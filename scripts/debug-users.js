// Debug script to check user data in Firebase
import { initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore } from "firebase/firestore";

// Firebase config (you may need to update this with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyABF_qRjp4S73pF5r7-KFT4o8O0m-QoVrQ",
  authDomain: "splitify-e4a16.firebaseapp.com",
  projectId: "splitify-e4a16",
  storageBucket: "splitify-e4a16.firebasestorage.app",
  messagingSenderId: "1011159796588",
  appId: "1:1011159796588:web:68d0bee45c56c89b90b83c",
  measurementId: "G-44H8FPZJN5",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugUsers() {
  console.log("🔍 Fetching all users to debug display names...");

  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    console.log(`Found ${snapshot.size} users:`);

    snapshot.forEach((doc) => {
      const userData = doc.data();
      console.log(`User ${doc.id}:`, {
        email: userData.email,
        name: userData.name,
        shouldDisplay:
          userData.email || userData.name || `User ${doc.id.substring(0, 8)}`,
      });

      // If name is like "User xyz123" but we have an email, we should prioritize email
      if (
        userData.name &&
        userData.name.startsWith("User ") &&
        userData.email
      ) {
        console.log(
          `  -> Should show "${userData.email}" instead of "${userData.name}"`
        );
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

// For Node.js environment, you might need to call:
// debugUsers().then(() => process.exit(0));

export { debugUsers };
