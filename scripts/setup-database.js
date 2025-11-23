// Firebase Firestore Database Setup Script
// Run this once to initialize your database structure

import { initializeApp } from "firebase/app";
import { doc, getFirestore, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCxgxCIrNXdmaZIhMiLt0ZhSXo1KdOaKT0",
  authDomain: "splitify-a9448.firebaseapp.com",
  projectId: "splitify-a9448",
  storageBucket: "splitify-a9448.firebasestorage.app",
  messagingSenderId: "852037653414",
  appId: "1:852037653414:web:b20a48d2b273029c34f567",
  measurementId: "G-4E2DT9DMX4",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setupDatabase() {
  try {
    console.log("🔥 Setting up Splitify database structure...");

    // Create a sample user document structure (won't overwrite existing)
    console.log("👤 Creating users collection structure...");

    // Create sample group document structure
    console.log("👥 Creating groups collection structure...");

    // These are just for structure - they won't interfere with your data
    const structureDoc = {
      _readme: "This is a structure reference document",
      collections: {
        users: {
          fields: ["email", "name", "createdAt", "lastSeen"],
        },
        groups: {
          fields: [
            "name",
            "description",
            "hostId",
            "inviteCode",
            "members",
            "createdAt",
          ],
        },
        expenses: {
          fields: [
            "title",
            "amount",
            "paidBy",
            "participants",
            "splitType",
            "shares",
            "note",
            "createdAt",
          ],
        },
      },
    };

    await setDoc(doc(db, "_structure", "splitify"), structureDoc);

    console.log("✅ Database structure created successfully!");
    console.log("📝 Next steps:");
    console.log("1. Set up security rules in Firebase Console");
    console.log("2. Create database indexes for better performance");
    console.log("3. Start using your app!");
  } catch (error) {
    console.error("❌ Error setting up database:", error);
  }
}

setupDatabase();
