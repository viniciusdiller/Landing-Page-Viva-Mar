"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { GuestUser } from "@/types";

interface GuestContextType {
  guest: GuestUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isPortalOpen: boolean;
  openPortal: () => void;
  closePortal: () => void;
  login: (token: string, guest: GuestUser) => void;
  logout: () => void;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

const TOKEN_KEY = "vivamar_guest_token";
const GUEST_KEY = "vivamar_guest_data";

export function GuestProvider({ children }: { children: React.ReactNode }) {
  const [guest, setGuest] = useState<GuestUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isPortalOpen, setIsPortalOpen] = useState(false);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedGuest = localStorage.getItem(GUEST_KEY);
      if (storedToken && storedGuest) {
        setToken(storedToken);
        setGuest(JSON.parse(storedGuest));
      }
    } catch {
      // Ignora erro em ambientes sem localStorage
    }
  }, []);

  const login = useCallback((newToken: string, newGuest: GuestUser) => {
    setToken(newToken);
    setGuest(newGuest);
    try {
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(GUEST_KEY, JSON.stringify(newGuest));
    } catch {
      // noop
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setGuest(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(GUEST_KEY);
    } catch {
      // noop
    }
  }, []);

  const openPortal = useCallback(() => setIsPortalOpen(true), []);
  const closePortal = useCallback(() => setIsPortalOpen(false), []);

  return (
    <GuestContext.Provider
      value={{
        guest,
        token,
        isAuthenticated: Boolean(token && guest),
        isPortalOpen,
        openPortal,
        closePortal,
        login,
        logout,
      }}
    >
      {children}
    </GuestContext.Provider>
  );
}

export function useGuest() {
  const context = useContext(GuestContext);
  if (!context) {
    throw new Error("useGuest deve ser usado dentro de um GuestProvider");
  }
  return context;
}

