// User types
export interface User {
  uid: string;
  name?: string;
  email: string;
  photoURL?: string;
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
  amount: number;
  currency?: string;
  paidBy: string;
  participants: string[];
  shares?: Record<string, number>;
  splitType: "equal" | "custom" | "percentage";
  note?: string;
  createdAt: any;
  paidAt?: any;
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
  balance: number;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
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