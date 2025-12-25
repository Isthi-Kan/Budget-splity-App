// Photo upload functionality removed; storage operations are disabled.

/**
 * Upload proof image for an expense
 */
export const uploadExpenseProof = async (
  groupId: string,
  expenseId: string,
  imageUri: string,
  fileName?: string
): Promise<{ url: string; storagePath: string }> => {
  throw new Error('Photo upload is disabled');
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
  return Promise.reject(new Error('Photo upload is disabled'));
};

/**
 * Delete proof image from storage
 */
export const deleteExpenseProof = async (): Promise<void> => {
  throw new Error('Photo upload is disabled');
};

/**
 * Get download URL for existing image
 */
export const getExpenseProofUrl = async (): Promise<string> => {
  throw new Error('Photo upload is disabled');
};

/**
 * Upload user profile image
 */
export const uploadUserProfileImage = async (
  userId: string,
  imageUri: string,
  fileName?: string
): Promise<{ url: string; storagePath: string }> => {
  throw new Error('Photo upload is disabled');
};

/**
 * Upload group image
 */
export const uploadGroupImage = async (
  groupId: string,
  imageUri: string,
  fileName?: string
): Promise<{ url: string; storagePath: string }> => {
  throw new Error('Photo upload is disabled');
};