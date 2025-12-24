import { loginUser as firebaseLogin, logoutUser as firebaseLogout, signUpUser as firebaseSignUp } from '../services/firebase/auth';
import { getUserGroups } from '../services/firebase/groups';
import { User } from '../types';
import { Action } from './types';

export const signupAction = async (dispatch: React.Dispatch<Action>, email: string, password: string, name: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
        const firebaseUser = await firebaseSignUp(email, password, name);

        // Map Firebase user to our domain User
        const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || name,
            emailVerified: firebaseUser.emailVerified,
            createdAt: new Date().toISOString(),
            photoURL: firebaseUser.photoURL || undefined,
        };

        dispatch({ type: 'SET_USER', payload: user });
        return user;
    } catch (error: any) {
        console.error("Signup action error:", error);
        dispatch({ type: 'SET_ERROR', payload: error.message || "Signup failed" });
        return null;
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
};

export const loginAction = async (dispatch: React.Dispatch<Action>, email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
        const firebaseUser = await firebaseLogin(email, password);

        const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || undefined,
            emailVerified: firebaseUser.emailVerified,
            createdAt: new Date().toISOString(),
            photoURL: firebaseUser.photoURL || undefined,
        };

        dispatch({ type: 'SET_USER', payload: user });
        return user;
    } catch (error: any) {
        console.error("Login action error:", error);
        dispatch({ type: 'SET_ERROR', payload: error.message || "Login failed" });
        return null;
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
};

export const logoutAction = async (dispatch: React.Dispatch<Action>) => {
    try {
        await firebaseLogout();
        dispatch({ type: 'LOGOUT' });
        return true;
    } catch (error: any) {
        console.error("Logout action error:", error);
        return false;
    }
};

export const fetchGroupsAction = async (dispatch: React.Dispatch<Action>, userId: string, forceRefresh = false) => {
    if (forceRefresh) {
        dispatch({ type: 'SET_LOADING', payload: true });
    }
    try {
        const groups = await getUserGroups(userId, !forceRefresh);
        dispatch({ type: 'SET_GROUPS', payload: groups });
    } catch (error: any) {
        console.error("Fetch groups action error:", error);
        dispatch({ type: 'SET_ERROR', payload: error.message || "Failed to fetch groups" });
    } finally {
        if (forceRefresh) {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }
};
