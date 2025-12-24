import { Action, AppState } from "./types";

export const initialState: AppState = {
    user: null,
    groups: [],
    isAuthenticated: false,
    authInitialized: false,
    isLoading: false,
    error: null,
    theme: 'light',
};

export const appReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_USER':
            return {
                ...state,
                user: action.payload,
                isAuthenticated: !!action.payload,
                error: null,
            };
        case 'SET_GROUPS':
            return {
                ...state,
                groups: action.payload,
            };
        case 'SET_AUTH_INITIALIZED':
            return {
                ...state,
                authInitialized: action.payload,
            };
        case 'SET_LOADING':
            return {
                ...state,
                isLoading: action.payload,
            };
        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload,
                isLoading: false,
            };
        case 'SET_THEME':
            return {
                ...state,
                theme: action.payload,
            };
        case 'LOGOUT':
            return {
                ...initialState,
                authInitialized: true, // Keep auth initialized
                theme: state.theme,
            };
        default:
            return state;
    }
};
