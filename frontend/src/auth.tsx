// ============================================================
// Workis - Authentication state management
// ============================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authApi, setAuthToken, usersApi } from "./api";
import type {
  AppUser,
  CreateInvitedUserRequest,
  CreateUserRequest,
  LoginRequest,
} from "./types";

const TOKEN_KEY = "workis_token";
const USER_ID_KEY = "workis_user_id";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  login: (req: LoginRequest) => Promise<void>;
  register: (req: CreateUserRequest) => Promise<void>;
  registerWithInvitation: (req: CreateInvitedUserRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userId = localStorage.getItem(USER_ID_KEY);

    if (!token || !userId) {
      setUser(null);
      setLoading(false);
      return;
    }

    setAuthToken(token);

    try {
      const data = await usersApi.get(Number(userId));
      setUser({
        id: data.id,
        name: data.name,
        lastname: data.lastname,
        username: data.username,
        email: data.email,
        companyRole: data.companyRole,
        companyId: data.companyId,
      });
    } catch {
      // Token may be invalid/expired - clear it.
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_ID_KEY);
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const applySession = useCallback(async (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);

    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.userId as number;
    localStorage.setItem(USER_ID_KEY, String(userId));

    const data = await usersApi.get(userId);
    setUser({
      id: data.id,
      name: data.name,
      lastname: data.lastname,
      username: data.username,
      email: data.email,
      companyRole: data.companyRole,
      companyId: data.companyId,
    });
  }, []);

  const login = useCallback(
    async (req: LoginRequest) => {
      const res = await authApi.login(req);
      await applySession(res.token);
    },
    [applySession]
  );

  const register = useCallback(
    async (req: CreateUserRequest) => {
      const res = await authApi.register(req);
      await applySession(res.token);
    },
    [applySession]
  );

  const registerWithInvitation = useCallback(
    async (req: CreateInvitedUserRequest) => {
      const res = await authApi.registerWithInvitation(req);
      await applySession(res.token);
    },
    [applySession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    setAuthToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        registerWithInvitation,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
