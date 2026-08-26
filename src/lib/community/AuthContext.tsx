"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { subscribeAuth, type User } from "./auth";

interface AuthContextValue {
  user: User | null;
  authLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, authLoading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    return subscribeAuth((u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  return <AuthContext.Provider value={{ user, authLoading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
