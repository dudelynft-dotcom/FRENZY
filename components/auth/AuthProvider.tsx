"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AuthMethod = "x" | "email";
export type AuthUser = { method: AuthMethod; handle: string; address: string };

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean; // becomes true after we have read any stored session
  login: (method: AuthMethod, handle: string) => AuthUser;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "ff_auth_v1";

/** Auto-generate an EVM address, exactly how an embedded wallet would at first login. */
function generateEvmAddress(): string {
  const bytes = new Uint8Array(20);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 20; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return "0x" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored) as AuthUser);
    } catch {
      // ignore malformed / unavailable storage
    }
    setReady(true);
  }, []);

  const login = (method: AuthMethod, handle: string): AuthUser => {
    const next: AuthUser = { method, handle, address: generateEvmAddress() };
    setUser(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    return next;
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return <AuthContext.Provider value={{ user, ready, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
