// Firebase Storage service for handling proof images
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  uploadString
} from 'firebase/storage';
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

    const metadata = { contentType: 'image/jpeg' };

    let downloadURL: string;

    if (imageUri.startsWith('data:image') || !imageUri.includes('://')) {
      console.log('📤 Uploading expense proof as Base64 string...', storagePath);
      const base64Data = imageUri.includes('base64,') ? imageUri.split('base64,')[1] : imageUri;
      const snapshot = await uploadString(storageRef, base64Data, 'base64', metadata);
      downloadURL = await getDownloadURL(snapshot.ref);
    } else {
      // Prepare image for upload
      const blob: any = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response);
        };
        xhr.onerror = function (e) {
          console.error('Blob conversion error:', e);
          reject(new TypeError("Network request failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", imageUri, true);
        xhr.send(null);
      });

      console.log('📤 Uploading image blob...', storagePath);

      // Upload the image using Resumable task for better reliability
      const uploadTask = uploadBytesResumable(storageRef, blob, metadata);

      downloadURL = await new Promise<string>((resolve, reject) => {
        uploadTask.on('state_changed',
          null,
          (error) => reject(error),
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });
    }

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
      const blob: any = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response);
        };
        xhr.onerror = function (e) {
          console.error('Blob conversion error:', e);
          reject(new TypeError("Network request failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", imageUri, true);
        xhr.send(null);
      });

      // Create upload task with progress tracking
      const metadata = { contentType: 'image/jpeg' };
      const uploadTask = uploadBytesResumable(storageRef, blob, metadata);

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
    const metadata = { contentType: 'image/jpeg' };

    let downloadURL: string;

    if (imageUri.startsWith('data:image') || !imageUri.includes('://')) {
      console.log('📤 Uploading profile image as Base64 string...', storagePath);
      const base64Data = imageUri.includes('base64,') ? imageUri.split('base64,')[1] : imageUri;
      const snapshot = await uploadString(storageRef, base64Data, 'base64', metadata);
      downloadURL = await getDownloadURL(snapshot.ref);
    } else {
      // Prepare image for upload
      const blob: any = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response);
        };
        xhr.onerror = function (e) {
          console.error('Blob conversion error:', e);
          reject(new TypeError("Network request failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", imageUri, true);
        xhr.send(null);
      });

      console.log('📤 Uploading profile image blob...', storagePath);
      const uploadTask = uploadBytesResumable(storageRef, blob, metadata);

      downloadURL = await new Promise<string>((resolve, reject) => {
        uploadTask.on('state_changed',
          null,
          (error) => reject(error),
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });
    }

    console.log('✅ Profile image uploaded successfully:', downloadURL);

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
    const metadata = { contentType: 'image/jpeg' };

    let downloadURL: string;

    if (imageUri.startsWith('data:image') || !imageUri.includes('://')) {
      console.log('📤 Uploading group image as Base64 string...', storagePath);
      const base64Data = imageUri.includes('base64,') ? imageUri.split('base64,')[1] : imageUri;
      const snapshot = await uploadString(storageRef, base64Data, 'base64', metadata);
      downloadURL = await getDownloadURL(snapshot.ref);
    } else {
      // Prepare image for upload
      const blob: any = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response);
        };
        xhr.onerror = function (e) {
          console.error('Blob conversion error:', e);
          reject(new TypeError("Network request failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", imageUri, true);
        xhr.send(null);
      });

      console.log('📤 Uploading group image blob...', storagePath);

      const uploadTask = uploadBytesResumable(storageRef, blob, metadata);

      downloadURL = await new Promise<string>((resolve, reject) => {
        uploadTask.on('state_changed',
          null,
          (error) => reject(error),
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });
    }

    console.log('✅ Group image uploaded successfully:', downloadURL);

    return {
      url: downloadURL,
      storagePath: storagePath
    };

  } catch (error: any) {
    console.error('❌ Error uploading group image:', error);
    throw new Error(`Failed to upload group image: ${error.message}`);
  }
};