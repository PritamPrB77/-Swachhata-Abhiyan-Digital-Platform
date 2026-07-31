import { createContext, useContext, useMemo, useState, useCallback } from "react";
import {
  User,
  clearSession,
  getStoredUser,
  getToken,
  setSession,
} from "@/lib/api";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loginSuccess: (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getToken());

  const loginSuccess = useCallback((t: string, u: User) => {
    setSession(t, u);
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, loginSuccess, logout }),
    [user, token, loginSuccess, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
