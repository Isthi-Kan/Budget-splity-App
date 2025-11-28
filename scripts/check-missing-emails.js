// Script to check and potentially fix missing user emails
import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
} from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  // Add your config here
  projectId: "splitify-e4a16",
  // ... other config
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// UIDs that are showing as "User xyz" instead of emails
const problemUIDs = [
  "1z5nnoztxSgYCm1xPTD8ZyDK0N72",
  "qJEUjAid9QZWVEVfypERUZfsRZk2",
];

async function checkMissingEmails() {
  console.log("🔍 Checking user documents for problem UIDs...");

  for (const uid of problemUIDs) {
    console.log(`\n--- Checking ${uid} ---`);

    try {
      const userDoc = await getDoc(doc(db, "users", uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("✅ User document exists:", {
          email: userData.email,
          name: userData.name,
          createdAt: userData.createdAt,
        });

        if (!userData.email) {
          console.log("❌ Missing email field!");
        }
      } else {
        console.log("❌ No user document found for this UID");
        console.log("   This user might need to create their profile");
      }
    } catch (error) {
      console.error("❌ Error fetching user:", error);
    }
  }

  // Also check all users to see the overall state
  console.log("\n🗂️ All users in database:");
  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(
        `${doc.id}: ${data.email || "NO EMAIL"} (${data.name || "NO NAME"})`
      );
    });
  } catch (error) {
    console.error("Error fetching all users:", error);
  }
}

export { checkMissingEmails };
