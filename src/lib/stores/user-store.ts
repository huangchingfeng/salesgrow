import { create } from "zustand";
import type { User } from "@supabase/supabase-js";

interface UserState {
  isAuthenticated: boolean;
  id: string | null;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  locale: string;
  setUser: (user: { id: string; name: string; email: string; avatarUrl?: string | null }) => void;
  setFromSession: (user: User) => void;
  clearUser: () => void;
  setLocale: (locale: string) => void;
  signOut: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  isAuthenticated: false,
  id: null,
  name: null,
  email: null,
  avatarUrl: null,
  locale: "en",
  setUser: (user) =>
    set({
      isAuthenticated: true,
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || null,
    }),
  setFromSession: (user) =>
    set({
      isAuthenticated: true,
      id: user.id,
      name: user.user_metadata?.full_name || user.email?.split("@")[0] || null,
      email: user.email || null,
      avatarUrl: user.user_metadata?.avatar_url || null,
    }),
  clearUser: () =>
    set({
      isAuthenticated: false,
      id: null,
      name: null,
      email: null,
      avatarUrl: null,
    }),
  setLocale: (locale) => set({ locale }),
  signOut: () =>
    set({
      isAuthenticated: false,
      id: null,
      name: null,
      email: null,
      avatarUrl: null,
    }),
}));
