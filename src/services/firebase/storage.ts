// Firebase Storage service for handling proof images
import {
    deleteObject,
    getDownloadURL,
    ref,
    uploadBytes,
    uploadBytesResumable
} from 'firebase/storage';
import { Platform } from 'react-native';
import { storage } from './config';

/**
 * Upload proof image for an expense
 */
export const uploadExpenseProof = async (
  groupId: string,
  expenseId: string,
  imageUri: string,
  fileName?: string
): Promise<{ url: string; storagePath: string }> => {
  console.log('📸 Uploading expense proof image...');
  
  try {
    // Generate unique filename if not provided
    const timestamp = Date.now();
    const finalFileName = fileName || `proof_${timestamp}.jpg`;
    
    // Create storage reference
    const storagePath = `expenses/${groupId}/${expenseId}/${finalFileName}`;
    const storageRef = ref(storage, storagePath);
    
    // Prepare image for upload
    let blob: Blob;
    
    if (Platform.OS === 'web') {
      // Web: fetch the image and convert to blob
      const response = await fetch(imageUri);
      blob = await response.blob();
    } else {
      // Mobile: convert URI to blob
      const response = await fetch(imageUri);
      blob = await response.blob();
    }
    
    console.log('📤 Uploading image blob...');
    
    // Upload the image
    const uploadResult = await uploadBytes(storageRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    console.log('✅ Image uploaded successfully:', downloadURL);
    
    return {
      url: downloadURL,
      storagePath: storagePath
    };
    
  } catch (error: any) {
    console.error('❌ Error uploading image:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Upload proof image with progress tracking
 */
export const uploadExpenseProofWithProgress = (
  groupId: string,
  expenseId: string,
  imageUri: string,
  onProgress?: (progress: number) => void,
  fileName?: string
): Promise<{ url: string; storagePath: string }> => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('📸 Uploading expense proof with progress tracking...');
      
      // Generate unique filename if not provided
      const timestamp = Date.now();
      const finalFileName = fileName || `proof_${timestamp}.jpg`;
      
      // Create storage reference
      const storagePath = `expenses/${groupId}/${expenseId}/${finalFileName}`;
      const storageRef = ref(storage, storagePath);
      
      // Prepare image for upload
      let blob: Blob;
      
      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        blob = await response.blob();
      } else {
        const response = await fetch(imageUri);
        blob = await response.blob();
      }
      
      // Create upload task with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, blob);
      
      // Monitor upload progress
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`📊 Upload progress: ${progress.toFixed(1)}%`);
          onProgress?.(progress);
        },
        (error) => {
          console.error('❌ Upload error:', error);
          reject(new Error(`Upload failed: ${error.message}`));
        },
        async () => {
          try {
            // Upload completed successfully
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('✅ Image uploaded successfully with progress tracking');
            
            resolve({
              url: downloadURL,
              storagePath: storagePath
            });
          } catch (error: any) {
            reject(new Error(`Failed to get download URL: ${error.message}`));
          }
        }
      );
      
    } catch (error: any) {
      console.error('❌ Error starting upload:', error);
      reject(new Error(`Failed to start upload: ${error.message}`));
    }
  });
};

/**
 * Delete proof image from storage
 */
export const deleteExpenseProof = async (storagePath: string): Promise<void> => {
  console.log('🗑️ Deleting expense proof:', storagePath);
  
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    
    console.log('✅ Image deleted successfully');
  } catch (error: any) {
    console.error('❌ Error deleting image:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * Get download URL for existing image
 */
export const getExpenseProofUrl = async (storagePath: string): Promise<string> => {
  try {
    const storageRef = ref(storage, storagePath);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error: any) {
    console.error('❌ Error getting image URL:', error);
    throw new Error(`Failed to get image URL: ${error.message}`);
  }
};

/**
 * Upload user profile image
 */
export const uploadUserProfileImage = async (
  userId: string,
  imageUri: string,
  fileName?: string
): Promise<{ url: string; storagePath: string }> => {
  console.log('👤 Uploading user profile image...');
  
  try {
    const timestamp = Date.now();
    const finalFileName = fileName || `profile_${timestamp}.jpg`;
    const storagePath = `users/${userId}/profile/${finalFileName}`;
    const storageRef = ref(storage, storagePath);
    
    let blob: Blob;
    
    if (Platform.OS === 'web') {
      const response = await fetch(imageUri);
      blob = await response.blob();
    } else {
      const response = await fetch(imageUri);
      blob = await response.blob();
    }
    
    const uploadResult = await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    console.log('✅ Profile image uploaded successfully');
    
    return {
      url: downloadURL,
      storagePath: storagePath
    };
    
  } catch (error: any) {
    console.error('❌ Error uploading profile image:', error);
    throw new Error(`Failed to upload profile image: ${error.message}`);
  }
};

/**
 * Upload group image
 */
export const uploadGroupImage = async (
  groupId: string,
  imageUri: string,
  fileName?: string
): Promise<{ url: string; storagePath: string }> => {
  console.log('🏷️ Uploading group image...');
  
  try {
    const timestamp = Date.now();
    const finalFileName = fileName || `group_${timestamp}.jpg`;
    const storagePath = `groups/${groupId}/${finalFileName}`;
    const storageRef = ref(storage, storagePath);
    
    let blob: Blob;
    
    if (Platform.OS === 'web') {
      const response = await fetch(imageUri);
      blob = await response.blob();
    } else {
      const response = await fetch(imageUri);
      blob = await response.blob();
    }
    
    const uploadResult = await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    console.log('✅ Group image uploaded successfully');
    
    return {
      url: downloadURL,
      storagePath: storagePath
    };
    
  } catch (error: any) {
    console.error('❌ Error uploading group image:', error);
    throw new Error(`Failed to upload group image: ${error.message}`);
  }
};