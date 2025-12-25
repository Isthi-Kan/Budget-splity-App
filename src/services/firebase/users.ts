// Firestore users service
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { User } from '../../types';
import { db } from './config';

/**
 * Create user document in Firestore
 */
export const createUserDocument = async (
  uid: string, 
  email: string, 
  name?: string
): Promise<void> => {
  try {
    // Ensure we have a proper name - use email prefix if name is empty
    const userName = name && name.trim() ? name.trim() : email.split('@')[0];
    
    const userData: Omit<User, 'uid'> = {
      email: email.toLowerCase().trim(),
      name: userName,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    };

    
    await setDoc(doc(db, 'users', uid), userData);
    
  } catch (error: any) {
    
    throw new Error(`Failed to create user document: ${error.message}`);
  }
};

/**
 * Get user document
 */
export const getUserDocument = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (userDoc.exists()) {
      return {
        uid: userDoc.id,
        ...userDoc.data(),
      } as User;
    }
    
    return null;
  } catch (error: any) {
    throw new Error(`Failed to get user document: ${error.message}`);
  }
};

/**
 * Update user document
 */
export const updateUserDocument = async (
  uid: string, 
  updates: Partial<User>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      lastSeen: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(`Failed to update user document: ${error.message}`);
  }
};

/**
 * Update user's last seen timestamp
 */
export const updateLastSeen = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      lastSeen: serverTimestamp(),
    });
  } catch (error: any) {
    
    // Don't throw error for last seen updates to avoid disrupting user experience
  }
};

/**
 * Get user document by email address
 */
export const getUserDocumentByEmail = async (email: string): Promise<User | null> => {
  try {
    const trimmed = email.toLowerCase().trim();
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', trimmed));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      return {
        uid: docSnap.id,
        ...docSnap.data(),
      } as User;
    }
    return null;
  } catch (error: any) {
    throw new Error(`Failed to get user by email: ${error.message}`);
  }
};