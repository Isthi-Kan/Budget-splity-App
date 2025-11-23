// Firestore users service
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
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
    const userData: Omit<User, 'uid'> = {
      email: email.toLowerCase().trim(),
      name: name || '',
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
    console.error('Failed to update last seen:', error.message);
    // Don't throw error for last seen updates to avoid disrupting user experience
  }
};