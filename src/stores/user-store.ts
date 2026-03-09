"use client";

import { create } from "zustand";

interface UserState {
  balance: number;
  username: string;
  role: string;
  setBalance: (balance: number) => void;
  setUser: (data: { balance: number; username: string; role: string }) => void;
  updateBalance: (delta: number) => void;
}

export const useUserStore = create<UserState>()((set) => ({
  balance: 0,
  username: "",
  role: "USER",
  setBalance: (balance) => set({ balance: Math.round(balance * 100) / 100 }),
  setUser: (data) => set(data),
  updateBalance: (delta) =>
    set((state) => ({ balance: state.balance + delta })),
}));
