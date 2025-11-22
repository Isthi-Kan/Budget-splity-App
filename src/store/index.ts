// Global store types and state management
// You can add Redux, Zustand, or Context API setup here

export interface AppState {
  user: any;
  theme: 'light' | 'dark';
  isLoading: boolean;
}

export const initialState: AppState = {
  user: null,
  theme: 'light',
  isLoading: false,
};