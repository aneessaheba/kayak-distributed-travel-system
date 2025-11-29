// Redux-based auth store with Zustand-like API for backward compatibility
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login as loginAction, loginAdmin as loginAdminAction, logout as logoutAction, updateUser as updateUserAction } from '../store/slices/authSlice';
import type { User, Admin } from '../types';

// Hook that provides Zustand-like API but uses Redux under the hood
export const useAuthStore = () => {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);

  return {
    // State
    user: authState.user,
    admin: authState.admin,
    isAuthenticated: authState.isAuthenticated,
    isAdmin: authState.isAdmin,
    token: authState.token,

    // Actions (same API as before)
    login: (user: User, token: string) => {
      localStorage.setItem('kayak-token', token);
      dispatch(loginAction({ user, token }));
    },
    loginAdmin: (admin: Admin, token: string) => {
      localStorage.setItem('kayak-token', token);
      dispatch(loginAdminAction({ admin, token }));
    },
    logout: () => {
      localStorage.removeItem('kayak-token');
      dispatch(logoutAction());
    },
    updateUser: (updates: Partial<User>) => {
      dispatch(updateUserAction(updates));
    },
  };
};

// Re-export types for convenience
export type { User, Admin };
