// Firestore expenses service
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { Balance, Expense, GroupSummary, Settlement } from '../../types';
import { db } from './config';
import { deleteExpenseProof } from './storage';
import { getUserDocument } from './users';

/**
 * Recursively clean undefined fields from an object
 */
const cleanUndefinedFields = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefinedFields).filter(item => item !== undefined);
  }
  
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = cleanUndefinedFields(value);
    }
  }
  
  return cleaned;
};

/**
 * Add expense to group with optional proof image
 */
export const addExpense = async (
  groupId: string, 
  expenseData: Omit<Expense, 'id' | 'createdAt'>,
  proofImageUrl?: string,
  proofImagePath?: string
): Promise<string> => {
  console.log("💰 Adding expense to group:", groupId);
  
  try {
    const expense: Omit<Expense, 'id'> = {
      ...expenseData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      paidAt: expenseData.paidAt || serverTimestamp(),
    };

    // Only add proof image fields if they exist
    if (proofImageUrl) {
      expense.proofImageUrl = proofImageUrl;
    }
    if (proofImagePath) {
      expense.proofImagePath = proofImagePath;
    }

    // Calculate shares if not provided
    if (!expense.shares && expense.splitType === 'equal') {
      expense.shares = calculateEqualShares(expense.amount, expense.participants);
    }

    console.log("🔄 Adding to expenses collection...");
    
    // Use the structure you created: expenses/{groupId}/expenses/{expenseId}
    const expensesRef = collection(db, 'expenses', groupId, 'expenses');
    const docRef = await addDoc(expensesRef, expense);
    
    console.log("✅ Expense added successfully:", docRef.id);
    
    // Invalidate group summary cache
    await invalidateGroupSummary(groupId);
    
    return docRef.id;
  } catch (error: any) {
    console.error("❌ Error adding expense:", error);
    throw new Error(`Failed to add expense: ${error.message}`);
  }
};

/**
 * Get expenses for a group
 */
export const getGroupExpenses = async (groupId: string): Promise<Expense[]> => {
  console.log("📊 Getting expenses for group:", groupId);
  
  try {
    // Use your database structure: expenses/{groupId}/expenses/{expenseId}
    const expensesRef = collection(db, 'expenses', groupId, 'expenses');
    const q = query(expensesRef, orderBy('createdAt', 'desc'));
    
    // Add timeout protection
    const queryPromise = getDocs(q);
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout after 15 seconds')), 15000)
    );
    
    const querySnapshot = await Promise.race([queryPromise, timeoutPromise]);
    const expenses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Expense[];
    
    console.log("✅ Expenses loaded:", expenses.length);
    return expenses;
  } catch (error: any) {
    if (error.message?.includes('timeout')) {
      console.error("❌ Expense query timed out for group:", groupId);
      throw new Error('Request timed out. Please check your internet connection and try again.');
    } else if (error.code === 'permission-denied') {
      console.error("❌ Permission denied for group expenses:", groupId);
      throw new Error('You do not have permission to access this group\'s expenses.');
    } else {
      console.error("❌ Error getting expenses:", error);
      throw new Error(`Failed to get expenses: ${error.message || 'Unknown error'}`);
    }
  }
};

/**
 * Get single expense
 */
export const getExpense = async (groupId: string, expenseId: string): Promise<Expense | null> => {
  try {
    // Use your database structure: expenses/{groupId}/expenses/{expenseId}
    const docRef = doc(db, 'expenses', groupId, 'expenses', expenseId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Expense;
    }
    return null;
  } catch (error: any) {
    throw new Error(`Failed to get expense: ${error.message}`);
  }
};

/**
 * Update expense
 */
export const updateExpense = async (
  groupId: string, 
  expenseId: string, 
  updates: Partial<Expense>
): Promise<void> => {
  try {
    // Use your database structure: expenses/{groupId}/expenses/{expenseId}
    const expenseRef = doc(db, 'expenses', groupId, 'expenses', expenseId);
    await updateDoc(expenseRef, updates);
  } catch (error: any) {
    throw new Error(`Failed to update expense: ${error.message}`);
  }
};

/**
 * Delete expense
 */
export const deleteExpense = async (groupId: string, expenseId: string): Promise<void> => {
  try {
    // Use your database structure: expenses/{groupId}/expenses/{expenseId}
    const expenseRef = doc(db, 'expenses', groupId, 'expenses', expenseId);
    await deleteDoc(expenseRef);
  } catch (error: any) {
    throw new Error(`Failed to delete expense: ${error.message}`);
  }
};

/**
 * Calculate equal shares for participants
 */
export const calculateEqualShares = (amount: number, participants: string[]): Record<string, number> => {
  const shareAmount = Math.round((amount / participants.length) * 100) / 100;
  const shares: Record<string, number> = {};
  
  // Assign equal share to all participants
  participants.forEach((uid, index) => {
    shares[uid] = shareAmount;
  });
  
  // Adjust last participant for rounding differences
  const totalAssigned = Object.values(shares).reduce((sum, share) => sum + share, 0);
  const difference = Math.round((amount - totalAssigned) * 100) / 100;
  
  if (difference !== 0 && participants.length > 0) {
    const lastParticipant = participants[participants.length - 1];
    shares[lastParticipant] = Math.round((shares[lastParticipant] + difference) * 100) / 100;
  }
  
  return shares;
};

/**
 * Validate custom shares
 */
export const validateCustomShares = (
  shares: Record<string, number>, 
  amount: number, 
  participants: string[]
): { isValid: boolean; message?: string } => {
  // Check all participants have shares
  for (const uid of participants) {
    if (!(uid in shares) || shares[uid] < 0) {
      return { isValid: false, message: 'All participants must have valid share amounts' };
    }
  }
  
  // Check shares sum to total amount
  const totalShares = Object.values(shares).reduce((sum, share) => sum + share, 0);
  const difference = Math.abs(totalShares - amount);
  
  if (difference > 0.01) { // Allow for small rounding differences
    return { isValid: false, message: 'Shares must add up to the total amount' };
  }
  
  return { isValid: true };
};

/**
 * Calculate percentage shares
 */
export const calculatePercentageShares = (
  amount: number, 
  percentages: Record<string, number>
): Record<string, number> => {
  const shares: Record<string, number> = {};
  
  Object.entries(percentages).forEach(([uid, percentage]) => {
    shares[uid] = Math.round((amount * percentage / 100) * 100) / 100;
  });
  
  return shares;
};

/**
 * Calculate group balance summary with proper user consolidation
 */
export const calculateGroupSummary = async (groupId: string): Promise<{
  balances: Balance[];
  settlements: Settlement[];
}> => {
  try {
    const expenses = await getGroupExpenses(groupId);
    
    console.log("💰 Raw expenses data:", expenses.map(exp => ({
      id: exp.id,
      amount: exp.amount,
      paidBy: exp.paidBy,
      shares: exp.shares,
      description: exp.description
    })));
    
    // Calculate total paid and total owed for each member
    const totalPaid: Record<string, number> = {};
    const totalOwed: Record<string, number> = {};
    
    expenses.forEach(expense => {
      console.log(`📋 Processing expense: ${expense.description || 'Unnamed'} - $${expense.amount} paid by ${expense.paidBy}`);
      
      // Add to total paid
      if (!totalPaid[expense.paidBy]) totalPaid[expense.paidBy] = 0;
      totalPaid[expense.paidBy] += expense.amount;
      
      // Add to total owed (shares)
      if (expense.shares) {
        console.log(`   Shares:`, expense.shares);
        Object.entries(expense.shares).forEach(([uid, share]) => {
          if (!totalOwed[uid]) totalOwed[uid] = 0;
          totalOwed[uid] += share;
        });
      } else {
        console.log(`   ⚠️ No shares found for expense ${expense.id}`);
      }
    });
    
    console.log("📊 Total paid by each UID:", totalPaid);
    console.log("📊 Total owed by each UID:", totalOwed);
    
    // Get all unique UIDs
    const allMembers = new Set([
      ...Object.keys(totalPaid),
      ...Object.keys(totalOwed)
    ]);
    
    // Fetch user data for all members with timeout protection
    const userDataPromises = Array.from(allMembers).map(async (uid) => {
      try {
        const userPromise = getUserDocument(uid);
        const timeoutPromise = new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error(`User fetch timeout for ${uid}`)), 5000)
        );
        
        const user = await Promise.race([userPromise, timeoutPromise]);
        console.log(`User data for ${uid}:`, { 
          email: user?.email, 
          name: user?.name,
          exists: !!user
        });
        return user;
      } catch (error) {
        console.warn(`Could not fetch user data for ${uid}:`, error);
        return null;
      }
    });
    const userData = await Promise.all(userDataPromises);
    const userMap = new Map();
    userData.forEach((user, index) => {
      const uid = Array.from(allMembers)[index];
      userMap.set(uid, user);
    });
    
    // Create balances for each UID (maintaining original structure for compatibility)
    const balances: Balance[] = [];
    
    allMembers.forEach(uid => {
      const paid = totalPaid[uid] || 0;
      const owed = totalOwed[uid] || 0;
      const balance = Math.round((paid - owed) * 100) / 100;
      const userExpenses = expenses.filter(exp => exp.paidBy === uid || (exp.shares && exp.shares[uid] > 0)).map(exp => exp.id);
      const user = userMap.get(uid);
      
      console.log(`👤 User ${uid}: paid=$${paid}, owes=$${owed}, balance=$${balance}`);
      
      // Smart email detection: use uid if it looks like an email, otherwise use user data
      const isEmailUid = uid && uid.includes('@') && uid.includes('.');
      let displayEmail = '';
      let displayName = '';
      
      if (user?.email) {
        // User has proper email in document
        displayEmail = user.email;
        displayName = user.email;
      } else if (isEmailUid) {
        // UID is an email address
        displayEmail = uid;
        displayName = uid;
      } else if (user?.name && !user.name.startsWith('User ')) {
        // User has a proper name
        displayName = user.name;
        displayEmail = '';
      } else {
        // Missing user data - need better display
        displayName = `User ${uid.substring(0, 8)} (Missing Profile)`;
        displayEmail = '';
        console.warn(`⚠️ User ${uid} has no profile. They should complete signup to add their email.`);
      }
      
      balances.push({ 
        uid, 
        name: displayName,
        email: displayEmail,
        displayName: displayName,
        totalPaid: paid,
        totalOwes: owed,
        balance,
        expenses: userExpenses
      });
    });
    
    // Generate settlement suggestions with email consolidation
    console.log("🎯 Final balances before settlement calculation:", balances.map(b => ({
      uid: b.uid,
      name: b.displayName || b.name,
      email: b.email,
      balance: b.balance,
      paid: b.totalPaid,
      owes: b.totalOwes
    })));
    
    const settlements = settleBalancesWithEmailConsolidation(balances);
    
    console.log("✅ Generated settlements:", settlements.map((s: Settlement) => ({
      from: s.fromUserName,
      to: s.toUserName,
      amount: s.amount,
      id: s.id
    })));
    
    // Set groupId for settlements
    settlements.forEach((settlement: Settlement) => {
      settlement.groupId = groupId;
    });
    
    return { balances, settlements };
  } catch (error: any) {
    console.error("❌ Error in calculateGroupSummary:", error);
    throw new Error(`Failed to calculate group summary: ${error.message}`);
  }
};

/**
 * Generate optimal settlement suggestions with email consolidation
 * This algorithm consolidates duplicate users by email and calculates net settlements
 */
export const settleBalancesWithEmailConsolidation = (balances: Balance[]): Settlement[] => {
  const settlements: Settlement[] = [];
  
  console.log("🔄 Starting settlement with email consolidation");
  
  try {
    // Step 1: Consolidate balances by email address
    const consolidatedBalances = new Map<string, {
      email: string,
      totalBalance: number,
      totalPaid: number,
      totalOwes: number,
      displayName: string
    }>();
    
    balances.forEach(balance => {
      // Use email as the key, fallback to UID if no email
      const key = balance.email || balance.uid;
      const displayName = balance.email || balance.displayName || balance.name || `User ${balance.uid.substring(0, 8)}`;
      
      if (consolidatedBalances.has(key)) {
        // Consolidate with existing entry
        const existing = consolidatedBalances.get(key)!;
        existing.totalBalance += balance.balance;
        existing.totalPaid += balance.totalPaid;
        existing.totalOwes += balance.totalOwes;
      } else {
        // Create new entry
        consolidatedBalances.set(key, {
          email: key,
          totalBalance: balance.balance,
          totalPaid: balance.totalPaid,
          totalOwes: balance.totalOwes,
          displayName: displayName
        });
      }
    });
    
    console.log("📊 Consolidated balances by email:", Array.from(consolidatedBalances.entries()).map(([email, data]) => ({
      email,
      netBalance: Math.round(data.totalBalance * 100) / 100,
      totalPaid: data.totalPaid,
      totalOwes: data.totalOwes,
      displayName: data.displayName
    })));
    
    // Step 2: Separate creditors and debtors
    const creditors: Array<{email: string, amount: number, displayName: string}> = [];
    const debtors: Array<{email: string, amount: number, displayName: string}> = [];
    
    consolidatedBalances.forEach((data, email) => {
      const netBalance = Math.round(data.totalBalance * 100) / 100;
      
      if (netBalance > 0.01) {
        creditors.push({
          email,
          amount: netBalance,
          displayName: data.displayName
        });
      } else if (netBalance < -0.01) {
        debtors.push({
          email,
          amount: Math.abs(netBalance),
          displayName: data.displayName
        });
      }
    });
    
    // Sort for optimal matching
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);
    
    console.log("💰 Creditors (owed money):", creditors);
    console.log("💸 Debtors (owe money):", debtors);
    
    // Step 3: Generate minimal settlements with safety checks
    let settlementId = 1;
    const workingCreditors = [...creditors];
    const workingDebtors = [...debtors];
    
    while (workingCreditors.length > 0 && workingDebtors.length > 0 && settlementId <= 20) {
      const creditor = workingCreditors[0];
      const debtor = workingDebtors[0];
      
      // Safety check for valid amounts
      if (!creditor || !debtor || creditor.amount <= 0 || debtor.amount <= 0) {
        console.warn("⚠️ Invalid creditor or debtor, breaking settlement loop");
        break;
      }
      
      const settlementAmount = Math.min(creditor.amount, debtor.amount);
      const roundedAmount = Math.round(settlementAmount * 100) / 100;
      
      if (roundedAmount <= 0.01) {
        console.log("⚠️ Settlement amount too small, breaking loop");
        break;
      }
      
      console.log(`💳 Settlement ${settlementId}: ${debtor.displayName} pays $${roundedAmount} to ${creditor.displayName}`);
      
      settlements.push({
        id: `consolidated-settlement-${settlementId}-${Date.now()}`,
        groupId: '', // Will be set by caller
        fromUser: debtor.email,
        fromUserName: debtor.displayName,
        toUser: creditor.email,
        toUserName: creditor.displayName,
        amount: roundedAmount,
        settled: false,
        createdAt: serverTimestamp()
      });
      
      // Update amounts
      creditor.amount = Math.round((creditor.amount - roundedAmount) * 100) / 100;
      debtor.amount = Math.round((debtor.amount - roundedAmount) * 100) / 100;
      
      // Remove settled parties
      if (creditor.amount <= 0.01) {
        workingCreditors.shift();
      }
      if (debtor.amount <= 0.01) {
        workingDebtors.shift();
      }
      
      settlementId++;
    }
    
    if (settlementId > 20) {
      console.error("⚠️ Settlement calculation exceeded maximum iterations");
    }
    
    console.log(`✅ Generated ${settlements.length} consolidated settlements`);
    settlements.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.fromUserName} → ${s.toUserName}: $${s.amount}`);
    });
    
    return settlements;
    
  } catch (error: any) {
    console.error("❌ Error in settlement calculation:", error);
    return []; // Return empty array if calculation fails
  }
};

/**
 * Delete expense with proof image cleanup
 */
export const deleteExpenseWithCleanup = async (
  groupId: string, 
  expenseId: string
): Promise<void> => {
  console.log("🗑️ Deleting expense with cleanup:", expenseId);
  
  try {
    // Get expense data first to check for proof image
    const expenseDoc = await getExpense(groupId, expenseId);
    
    if (expenseDoc?.proofImagePath) {
      // Delete proof image from storage
      await deleteExpenseProof(expenseDoc.proofImagePath);
    }
    
    // Delete expense document
    const docRef = doc(db, 'expenses', groupId, 'expenses', expenseId);
    await deleteDoc(docRef);
    
    // Invalidate group summary cache
    await invalidateGroupSummary(groupId);
    
    console.log("✅ Expense and proof image deleted successfully");
  } catch (error: any) {
    console.error("❌ Error deleting expense:", error);
    throw new Error(`Failed to delete expense: ${error.message}`);
  }
};

/**
 * Update expense with proof image support
 */
export const updateExpenseWithProof = async (
  groupId: string, 
  expenseId: string, 
  updates: Partial<Expense>,
  newProofImageUrl?: string,
  newProofImagePath?: string
): Promise<void> => {
  console.log("✏️ Updating expense with proof support:", expenseId);
  
  try {
    const docRef = doc(db, 'expenses', groupId, 'expenses', expenseId);
    
    // Get current expense to handle proof image replacement
    const currentExpense = await getExpense(groupId, expenseId);
    
    // If there's a new proof image and an old one exists, delete the old one
    if (newProofImageUrl && currentExpense?.proofImagePath && 
        currentExpense.proofImagePath !== newProofImagePath) {
      await deleteExpenseProof(currentExpense.proofImagePath);
    }
    
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
      ...(newProofImageUrl && { proofImageUrl: newProofImageUrl }),
      ...(newProofImagePath && { proofImagePath: newProofImagePath }),
    };
    
    await updateDoc(docRef, updateData);
    
    // Invalidate group summary cache
    await invalidateGroupSummary(groupId);
    
    console.log("✅ Expense updated successfully");
  } catch (error: any) {
    console.error("❌ Error updating expense:", error);
    throw new Error(`Failed to update expense: ${error.message}`);
  }
};

/**
 * Get comprehensive group summary with caching
 */
/**
 * Calculate group summary with timeout protection
 */
const calculateGroupSummaryWithTimeout = async (groupId: string): Promise<{
  summary: { balances: Balance[]; settlements: Settlement[] };
  expenses: Expense[];
}> => {
  console.log("🔄 Force invalidating cache and calculating fresh summary...");
  await invalidateGroupSummary(groupId);
  
  // Calculate fresh summary
  const summary = await calculateGroupSummary(groupId);
  const expenses = await getGroupExpenses(groupId);
  
  return { summary, expenses };
};

/**
 * Get comprehensive group summary with caching
 */
export const getGroupSummary = async (groupId: string): Promise<GroupSummary> => {
  console.log("📊 Getting comprehensive group summary:", groupId);
  
  try {
    // Add timeout protection for the entire summary calculation
    const summaryPromise = calculateGroupSummaryWithTimeout(groupId);
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Group summary calculation timed out after 20 seconds')), 20000)
    );
    
    const { summary, expenses } = await Promise.race([summaryPromise, timeoutPromise]);
    
    console.log("🧮 Raw settlement calculation result:", summary.settlements.map((s: Settlement) => ({
      from: s.fromUserName,
      to: s.toUserName,
      amount: s.amount,
      id: s.id
    })));
    
    // Enhance with additional metrics
    const totalExpenses = expenses.length || 0;
    const totalAmount = expenses.reduce((sum: number, exp: Expense) => sum + (exp.amount || 0), 0);
    
    // Group expenses by category
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach(exp => {
      const category = exp.category || 'Other';
      const amount = exp.amount || 0;
      expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;
    });
    
    // Group expenses by month - only process expenses with valid dates
    const expensesByMonth: Record<string, number> = {};
    expenses.forEach(exp => {
      if (exp.createdAt && typeof exp.createdAt.toDate === 'function') {
        try {
          const date = exp.createdAt.toDate();
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const amount = exp.amount || 0;
          expensesByMonth[monthKey] = (expensesByMonth[monthKey] || 0) + amount;
        } catch (error) {
          console.warn("Invalid date for expense:", exp.id);
        }
      }
    });
    
    // Calculate top spenders
    const spenderTotals: Record<string, number> = {};
    expenses.forEach(exp => {
      if (exp.paidBy && exp.amount) {
        spenderTotals[exp.paidBy] = (spenderTotals[exp.paidBy] || 0) + exp.amount;
      }
    });
    
    const topSpenders = Object.entries(spenderTotals)
      .map(([uid, amount]) => {
        const userBalance = summary.balances.find(b => b.uid === uid);
        // Smart email detection for top spenders using same logic
        const isEmailUid = uid && uid.includes('@') && uid.includes('.');
        
        let displayName = '';
        if (userBalance?.email) {
          displayName = userBalance.email;
        } else if (isEmailUid) {
          displayName = uid;
        } else if (userBalance?.name && !userBalance.name.startsWith('User ')) {
          displayName = userBalance.name;
        } else {
          // For expenses that might have stored names
          const expenseWithName = expenses.find(e => e.paidBy === uid && e.paidByName);
          displayName = expenseWithName?.paidByName || `User ${uid.substring(0, 8)} (Missing Profile)`;
        }
        
        return { 
          uid: uid || '', 
          amount: amount || 0, 
          name: displayName
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    // Create summary with guaranteed no undefined values
    const cleanSummary = {
      id: groupId || '',
      groupId: groupId || '',
      totalExpenses: totalExpenses,
      totalAmount: totalAmount,
      balances: summary.balances || [],
      settlements: summary.settlements || [],
      lastUpdated: serverTimestamp(),
      expensesByCategory: expensesByCategory,
      expensesByMonth: expensesByMonth,
      topSpenders: topSpenders,
    };
    
    // Double-check: recursively clean any undefined values
    const comprehensiveSummary = cleanUndefinedFields(cleanSummary);
    
    // Cache the summary using setDoc to handle creation/update
    const summaryRef = doc(db, 'groupSummaries', groupId);
    await setDoc(summaryRef, comprehensiveSummary, { merge: true });
    
    console.log("✅ Group summary calculated and cached");
    return comprehensiveSummary as GroupSummary;
    
  } catch (error: any) {
    console.error("❌ Error getting group summary:", error);
    throw new Error(`Failed to get group summary: ${error.message}`);
  }
};

/**
 * Invalidate group summary cache
 */
export const invalidateGroupSummary = async (groupId: string): Promise<void> => {
  try {
    const summaryRef = doc(db, 'groupSummaries', groupId);
    await setDoc(summaryRef, { 
      lastUpdated: serverTimestamp() // Update with current time
    }, { merge: true });
  } catch (error) {
    // If there's an error, log it but don't throw
    console.log("📋 Could not invalidate summary cache:", error);
  }
};

/**
 * Get expenses with user details
 */
export const getGroupExpensesWithDetails = async (groupId: string): Promise<Expense[]> => {
  console.log("📊 Getting group expenses with user details:", groupId);
  
  try {
    const expenses = await getGroupExpenses(groupId);
    
    // For now, return expenses as-is
    // In a real app, you'd fetch user details to populate paidByName and participantNames
    return expenses;
    
  } catch (error: any) {
    console.error("❌ Error getting detailed expenses:", error);
    throw new Error(`Failed to get detailed expenses: ${error.message}`);
  }
};

/**
 * Get expenses by category
 */
export const getExpensesByCategory = async (
  groupId: string, 
  category: string
): Promise<Expense[]> => {
  try {
    const expensesRef = collection(db, 'expenses', groupId, 'expenses');
    const q = query(
      expensesRef, 
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const expenses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Expense[];
    
    return expenses;
  } catch (error: any) {
    throw new Error(`Failed to get expenses by category: ${error.message}`);
  }
};

/**
 * Get expenses by date range
 */
export const getExpensesByDateRange = async (
  groupId: string,
  startDate: Date,
  endDate: Date
): Promise<Expense[]> => {
  try {
    const expensesRef = collection(db, 'expenses', groupId, 'expenses');
    const q = query(
      expensesRef,
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const expenses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Expense[];
    
    return expenses;
  } catch (error: any) {
    throw new Error(`Failed to get expenses by date range: ${error.message}`);
  }
};