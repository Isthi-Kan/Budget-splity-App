// User types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  Explore: undefined;
  Profile: undefined;
  Settings: undefined;
};