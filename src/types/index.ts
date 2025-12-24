// User types
export interface User {
  uid: string;
  name?: string;
  email: string;
  photoURL?: string;
  emailVerified?: boolean;
  createdAt: any;
  lastSeen?: any;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  displayName: string;
  confirmPassword: string;
}

// Group types
export interface Group {
  id: string;
  name: string;
  description?: string;
  hostId: string;
  inviteCode?: string;
  members: string[];
  createdAt: any;
}

// Expense types
export interface Expense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  currency?: string;
  paidBy: string;
  paidByName?: string; // Display name for UI
  participants: string[];
  participantNames?: Record<string, string>; // Map of uid to display name
  shares?: Record<string, number>;
  splitType: "equal" | "custom" | "percentage";
  category?: string;
  proofImageUrl?: string;
  proofImagePath?: string; // Storage path for deletion
  note?: string;
  createdAt: any;
  updatedAt?: any;
  paidAt?: any;
  location?: string;
  tags?: string[];
}

// Enhanced expense with calculated fields
export interface ExpenseWithCalculations extends Expense {
  individualShare: number;
  userOwes: number;
  userPaid: boolean;
}

// Proof image type
export interface ProofImage {
  id: string;
  expenseId: string;
  groupId: string;
  url: string;
  storagePath: string;
  uploadedBy: string;
  uploadedAt: any;
  fileName: string;
  size: number;
  contentType: string;
}

// Member types
export interface Member {
  uid: string;
  role: "member" | "admin" | "host";
  joinedAt: any;
  displayName: string;
}

// Balance calculation types
export interface Balance {
  uid: string;
  name?: string;
  email?: string;
  displayName?: string;
  totalPaid: number;
  totalOwes: number;
  balance: number; // positive = should receive, negative = owes
  expenses: string[]; // expense IDs
}

export interface Settlement {
  id: string;
  groupId: string;
  fromUser: string;
  fromUserName?: string;
  toUser: string;
  toUserName?: string;
  amount: number;
  settled: boolean;
  settledAt?: any;
  createdAt: any;
  note?: string;
}

// Group summary type
export interface GroupSummary {
  id: string;
  groupId: string;
  totalExpenses: number;
  totalAmount: number;
  balances: Balance[];
  settlements: Settlement[];
  lastUpdated: any;
  expensesByCategory?: Record<string, number>;
  expensesByMonth?: Record<string, number>;
  topSpenders?: Array<{ uid: string; name?: string; amount: number }>;
}

// Navigation types
export type RootStackParamList = {
  Root: undefined;
  Auth: undefined;
  NotFound: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  VerifyEmail: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  CreateGroup: undefined;
  Profile: undefined;
  "group/[groupId]": { groupId: string };
  AddExpense: { groupId: string };
  "summary/[groupId]": { groupId: string };
};