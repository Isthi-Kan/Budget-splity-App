import { Group, User } from "../types";

export interface AppState {
    user: User | null;
    groups: Group[];
    isAuthenticated: boolean;
    authInitialized: boolean;
    isLoading: boolean;
    error: string | null;
    theme: 'light' | 'dark';
}

export type Action =
    | { type: 'SET_USER'; payload: User | null }
    | { type: 'SET_GROUPS'; payload: Group[] }
    | { type: 'SET_AUTH_INITIALIZED'; payload: boolean }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_THEME'; payload: 'light' | 'dark' }
    | { type: 'LOGOUT' };
