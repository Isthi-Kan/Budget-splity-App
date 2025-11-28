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
  console.log("🏗️ CreateGroup called", { hostUid, name, description, initialMembers });
  
  try {
    console.log("🔄 Generating invite code...");
    const inviteCode = generateInviteCode();
    console.log("✅ Invite code generated:", inviteCode);
    
    const members = [hostUid, ...initialMembers.filter(uid => uid !== hostUid)];
    console.log("👥 Members list:", members);
    
    const groupData: Omit<Group, 'id'> = {
      name,
      description: description || '',
      hostId: hostUid,
      inviteCode,
      members,
      createdAt: serverTimestamp(),
    };
    console.log("📊 Group data prepared:", groupData);

    console.log("🔄 Adding document to Firestore...");
    const docRef = await addDoc(collection(db, 'groups'), groupData);
    console.log("✅ Document added successfully, ID:", docRef.id);
    
    // Clear cache so new group appears immediately
    clearGroupsCache(hostUid);
    
    return docRef.id;
  } catch (error: any) {
    console.error("❌ CreateGroup error:", error);
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
    console.log("🗑️ Cleared groups cache for user:", uid);
  } else {
    groupsCache = {};
    console.log("🗑️ Cleared all groups cache");
  }
};

export const getUserGroups = async (uid: string, useCache = true): Promise<Group[]> => {
  console.log("🔍 getUserGroups called for uid:", uid);
  console.log("🔐 Auth state check:", {
    currentUser: auth.currentUser?.uid,
    isAuthenticated: !!auth.currentUser,
    emailVerified: auth.currentUser?.emailVerified
  });
  
  // Check cache first for instant loading
  if (useCache && groupsCache[uid]) {
    const cached = groupsCache[uid];
    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
    if (!isExpired) {
      console.log("⚡ Returning cached groups instantly:", cached.groups.length);
      return cached.groups;
    }
    console.log("🗑️ Cache expired, fetching fresh data");
  }
  
  try {
    // Double-check authentication before query
    if (!auth.currentUser) {
      console.error("❌ No authenticated user found");
      throw new Error("User not authenticated");
    }
    
    if (auth.currentUser.uid !== uid) {
      console.warn("⚠️ UID mismatch:", {
        requestedUid: uid,
        actualUid: auth.currentUser.uid
      });
    }
    
    console.log("🔄 Executing fast Firestore query...");
    const startTime = Date.now();
    
    // Use the simplest possible query
    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, where('members', 'array-contains', uid));
    
    console.log("📊 About to execute query:", {
      collection: 'groups',
      whereField: 'members',
      whereValue: uid
    });
    
    const querySnapshot = await getDocs(q);
    const queryTime = Date.now() - startTime;
    
    console.log("⚡ Fast query completed:", {
      documentsFound: querySnapshot.docs.length,
      queryTimeMs: queryTime
    });
    
    if (querySnapshot.empty) {
      console.log("📋 No groups found");
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
    
    console.log("✅ Groups loaded and cached:", groups.length, "in", queryTime, "ms");
    return groups;
  } catch (error: any) {
    console.error("❌ getUserGroups error:", error);
    // Return cached data if available, even if expired
    if (groupsCache[uid]) {
      console.log("⚠️ Returning stale cache due to error");
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
      console.error("❌ Group query timed out for group:", groupId);
      throw new Error('Request timed out. Please check your internet connection and try again.');
    } else if (error.code === 'permission-denied') {
      console.error("❌ Permission denied for group:", groupId);
      throw new Error('You do not have permission to access this group.');
    } else {
      console.error("❌ Error getting group:", error);
      throw new Error(`Failed to get group: ${error.message || 'Unknown error'}`);
    }
  }
};

/**
 * Add member to group by email
 */
export const addMemberByEmail = async (groupId: string, email: string): Promise<void> => {
  console.log("📧 AddMemberByEmail called", { groupId, email });
  
  try {
    console.log("🔍 Searching for user by email...");
    // First, find user by email
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', email.toLowerCase().trim())
    );
    
    const userSnapshot = await getDocs(usersQuery);
    console.log("📊 User query result:", { empty: userSnapshot.empty, size: userSnapshot.size });
    
    if (userSnapshot.empty) {
      console.log("❌ User not found with email:", email);
      throw new Error('User not found with this email address');
    }
    
    const userDoc = userSnapshot.docs[0];
    const uid = userDoc.id;
    console.log("✅ User found:", { uid, email });
    
    // Add user to group members
    console.log("🔄 Adding user to group...");
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      members: arrayUnion(uid)
    });
    console.log("✅ User added to group successfully");
  } catch (error: any) {
    console.error("❌ AddMemberByEmail error:", error);
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