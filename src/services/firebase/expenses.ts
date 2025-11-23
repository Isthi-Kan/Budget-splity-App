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
    updateDoc
} from 'firebase/firestore';
import { Balance, Expense, Settlement } from '../../types';
import { db } from './config';

/**
 * Add expense to group
 */
export const addExpense = async (
  groupId: string, 
  expenseData: Omit<Expense, 'id' | 'createdAt'>
): Promise<string> => {
  console.log("💰 Adding expense to group:", groupId);
  
  try {
    const expense: Omit<Expense, 'id'> = {
      ...expenseData,
      createdAt: serverTimestamp(),
      paidAt: expenseData.paidAt || serverTimestamp(),
    };

    // Calculate shares if not provided
    if (!expense.shares && expense.splitType === 'equal') {
      expense.shares = calculateEqualShares(expense.amount, expense.participants);
    }

    console.log("🔄 Adding to expenses collection...");
    // Use the structure you created: expenses/{groupId}/expenses/{expenseId}
    const expensesRef = collection(db, 'expenses', groupId, 'expenses');
    const docRef = await addDoc(expensesRef, expense);
    
    console.log("✅ Expense added successfully:", docRef.id);
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
    
    const querySnapshot = await getDocs(q);
    const expenses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Expense[];
    
    console.log("✅ Expenses loaded:", expenses.length);
    return expenses;
  } catch (error: any) {
    console.error("❌ Error getting expenses:", error);
    throw new Error(`Failed to get expenses: ${error.message}`);
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
 * Calculate group balance summary
 */
export const calculateGroupSummary = async (groupId: string): Promise<{
  balances: Balance[];
  settlements: Settlement[];
}> => {
  try {
    const expenses = await getGroupExpenses(groupId);
    
    // Calculate total paid and total owed for each member
    const totalPaid: Record<string, number> = {};
    const totalOwed: Record<string, number> = {};
    
    expenses.forEach(expense => {
      // Add to total paid
      if (!totalPaid[expense.paidBy]) totalPaid[expense.paidBy] = 0;
      totalPaid[expense.paidBy] += expense.amount;
      
      // Add to total owed (shares)
      if (expense.shares) {
        Object.entries(expense.shares).forEach(([uid, share]) => {
          if (!totalOwed[uid]) totalOwed[uid] = 0;
          totalOwed[uid] += share;
        });
      }
    });
    
    // Calculate net balances
    const allMembers = new Set([
      ...Object.keys(totalPaid),
      ...Object.keys(totalOwed)
    ]);
    
    const balances: Balance[] = [];
    
    allMembers.forEach(uid => {
      const paid = totalPaid[uid] || 0;
      const owed = totalOwed[uid] || 0;
      const balance = Math.round((paid - owed) * 100) / 100;
      
      balances.push({ uid, balance });
    });
    
    // Generate settlement suggestions
    const settlements = settleBalances(balances);
    
    return { balances, settlements };
  } catch (error: any) {
    throw new Error(`Failed to calculate group summary: ${error.message}`);
  }
};

/**
 * Generate settlement suggestions using greedy algorithm
 */
export const settleBalances = (balances: Balance[]): Settlement[] => {
  const settlements: Settlement[] = [];
  
  // Separate creditors (positive balance) and debtors (negative balance)
  const creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
  const debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);
  
  let creditorIndex = 0;
  let debtorIndex = 0;
  
  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    
    const transferAmount = Math.min(creditor.balance, Math.abs(debtor.balance));
    const roundedAmount = Math.round(transferAmount * 100) / 100;
    
    if (roundedAmount > 0.01) {
      settlements.push({
        from: debtor.uid,
        to: creditor.uid,
        amount: roundedAmount,
      });
      
      creditor.balance -= roundedAmount;
      debtor.balance += roundedAmount;
    }
    
    // Move to next creditor or debtor if balance is settled
    if (creditor.balance < 0.01) creditorIndex++;
    if (debtor.balance > -0.01) debtorIndex++;
  }
  
  return settlements;
};