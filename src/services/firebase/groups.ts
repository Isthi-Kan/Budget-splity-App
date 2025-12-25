// Firestore groups service
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { Group, User } from '../../types';
import { auth, db } from './config';

/**
 * Create a new group
 */
export const createGroup = async (
  hostUid: string, 
  name: string, 
  description?: string, 
  initialMembers: string[] = []
): Promise<string> => {
  
  
  try {
    
    const inviteCode = generateInviteCode();
    
    
    const members = [hostUid, ...initialMembers.filter(uid => uid !== hostUid)];
    
    
    const groupData: Omit<Group, 'id'> = {
      name,
      description: description || '',
      hostId: hostUid,
      inviteCode,
      members,
      createdAt: serverTimestamp(),
    };
    

    
    const docRef = await addDoc(collection(db, 'groups'), groupData);
    
    
    // Clear cache so new group appears immediately
    clearGroupsCache(hostUid);
    
    return docRef.id;
  } catch (error: any) {
    
    throw new Error(`Failed to create group: ${error.message}`);
  }
};

/**
 * Get groups where user is a member
 */
// Add caching for instant subsequent loads
let groupsCache: { [uid: string]: { groups: Group[], timestamp: number } } = {};
const CACHE_DURATION = 30000; // 30 seconds

/**
 * Clear groups cache for a user (useful after creating/joining groups)
 */
export const clearGroupsCache = (uid?: string) => {
  if (uid) {
    delete groupsCache[uid];
    
  } else {
    groupsCache = {};
    
  }
};

export const getUserGroups = async (uid: string, useCache = true): Promise<Group[]> => {
  
  
  // Check cache first for instant loading
  if (useCache && groupsCache[uid]) {
    const cached = groupsCache[uid];
    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
    if (!isExpired) {
      
      return cached.groups;
    }
    
  }
  
  try {
    // Double-check authentication before query
    if (!auth.currentUser) {
      throw new Error("User not authenticated");
    }
    
    if (auth.currentUser.uid !== uid) {
      // Continue; the query below still scopes to the provided uid
    }
    
    
    const startTime = Date.now();
    
    // Use the simplest possible query
    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, where('members', 'array-contains', uid));
    
    const querySnapshot = await getDocs(q);
    const queryTime = Date.now() - startTime;
    
    if (querySnapshot.empty) {
      groupsCache[uid] = { groups: [], timestamp: Date.now() };
      return [];
    }
    
    // Process documents quickly
    const groups: Group[] = [];
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      groups.push({
        id: doc.id,
        name: data.name || 'Unnamed',
        description: data.description || '',
        hostId: data.hostId || '',
        inviteCode: data.inviteCode || '',
        members: data.members || [],
        createdAt: data.createdAt
      });
    });
    
    // Quick sort by name instead of date for speed
    groups.sort((a, b) => a.name.localeCompare(b.name));
    
    // Cache for instant future loads
    groupsCache[uid] = { groups, timestamp: Date.now() };
    
    
    return groups;
  } catch (error: any) {
    
    // Return cached data if available, even if expired
    if (groupsCache[uid]) {
      
      return groupsCache[uid].groups;
    }
    throw new Error(`Failed to get user groups: ${error.message}`);
  }
};

/**
 * Get single group by ID
 */
export const getGroup = async (groupId: string): Promise<Group | null> => {
  try {
    const docRef = doc(db, 'groups', groupId);
    
    // Add timeout protection
    const getDocPromise = getDoc(docRef);
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000)
    );
    
    const docSnap = await Promise.race([getDocPromise, timeoutPromise]);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Group;
    }
    return null;
  } catch (error: any) {
    if (error.message?.includes('timeout')) {
      
      throw new Error('Request timed out. Please check your internet connection and try again.');
    } else if (error.code === 'permission-denied') {
      
      throw new Error('You do not have permission to access this group.');
    } else {
      
      throw new Error(`Failed to get group: ${error.message || 'Unknown error'}`);
    }
  }
};

/**
 * Add member to group by email
 */
export const addMemberByEmail = async (groupId: string, email: string): Promise<void> => {
  
  
  try {
    
    // First, find user by email
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', email.toLowerCase().trim())
    );
    
    const userSnapshot = await getDocs(usersQuery);
    
    
    if (userSnapshot.empty) {
      
      throw new Error('User not found with this email address');
    }
    
    const userDoc = userSnapshot.docs[0];
    const uid = userDoc.id;
    
    
    // Add user to group members
    
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      members: arrayUnion(uid)
    });
    
  } catch (error: any) {
    
    throw new Error(`Failed to add member: ${error.message}`);
  }
};

/**
 * Join group by invite code
 */
export const joinGroupByInviteCode = async (inviteCode: string, uid: string): Promise<string> => {
  try {
    const q = query(
      collection(db, 'groups'),
      where('inviteCode', '==', inviteCode.toUpperCase())
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Invalid invite code');
    }
    
    const groupDoc = querySnapshot.docs[0];
    const groupData = groupDoc.data() as Group;
    
    if (groupData.members.includes(uid)) {
      throw new Error('You are already a member of this group');
    }
    
    // Add user to group members
    await updateDoc(groupDoc.ref, {
      members: arrayUnion(uid)
    });
    
    return groupDoc.id;
  } catch (error: any) {
    throw new Error(`Failed to join group: ${error.message}`);
  }
};

/**
 * Get group members details
 */
export const getGroupMembers = async (memberUids: string[]): Promise<User[]> => {
  try {
    const members: User[] = [];
    
    for (const uid of memberUids) {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        members.push({
          uid: userDoc.id,
          ...userDoc.data(),
        } as User);
      }
    }
    
    return members;
  } catch (error: any) {
    throw new Error(`Failed to get group members: ${error.message}`);
  }
};

/**
 * Generate random invite code
 */
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Update group details
 */
export const updateGroup = async (groupId: string, updates: Partial<Group>): Promise<void> => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, updates);
  } catch (error: any) {
    throw new Error(`Failed to update group: ${error.message}`);
  }
};

/**
 * Delete group (host only)
 */
export const deleteGroup = async (groupId: string): Promise<void> => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    await deleteDoc(groupRef);
  } catch (error: any) {
    throw new Error(`Failed to delete group: ${error.message}`);
  }
};