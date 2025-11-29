import { createSlice } from '@reduxjs/toolkit';
import type { User, Admin } from '../../types';

interface AuthState {
  user: User | null;
  admin: Admin | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  token: string | null;
}

const initialState: AuthState = {
  user: null,
  admin: null,
  isAuthenticated: false,
  isAdmin: false,
  token: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: { payload: { user: User; token: string } }) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isAdmin = false;
      state.admin = null;
    },
    loginAdmin: (state, action: { payload: { admin: Admin; token: string } }) => {
      state.admin = action.payload.admin;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isAdmin = true;
      state.user = null;
    },
    logout: (state) => {
      state.user = null;
      state.admin = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
    },
    updateUser: (state, action: { payload: Partial<User> }) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { login, loginAdmin, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
