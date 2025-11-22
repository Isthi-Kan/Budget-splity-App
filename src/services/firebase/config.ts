// firebase/config.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCxgxCIrNXdmaZIhMiLt0ZhSXo1KdOaKT0",
  authDomain: "splitify-a9448.firebaseapp.com",
  projectId: "splitify-a9448",
  storageBucket: "splitify-a9448.firebasestorage.app",
  messagingSenderId: "852037653414",
  appId: "1:852037653414:web:b20a48d2b273029c34f567",
  measurementId: "G-4E2DT9DMX4"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Export Auth + Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
