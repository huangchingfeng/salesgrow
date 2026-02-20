import { create } from "zustand";

interface UserState {
  isAuthenticated: boolean;
  id: string | null;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  locale: string;
  setUser: (user: { id: string; name: string; email: string; avatarUrl?: string }) => void;
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
