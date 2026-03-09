"use client";

import { create } from "zustand";
import type { PlinkoRisk, PlinkoRows } from "@/lib/games/plinko";

interface PlinkoState {
  rows: PlinkoRows;
  risk: PlinkoRisk;
  betAmount: number;
  isDropping: boolean;
  currentPath: number[] | null;
  currentSlotIndex: number | null;
  lastMultiplier: number | null;
  lastPayout: number | null;
  lastProfit: number | null;

  setRows: (rows: PlinkoRows) => void;
  setRisk: (risk: PlinkoRisk) => void;
  setBetAmount: (amount: number) => void;
  setIsDropping: (dropping: boolean) => void;
  setResult: (path: number[], slotIndex: number, multiplier: number, payout: number, profit: number) => void;
  reset: () => void;
}

export const usePlinkoStore = create<PlinkoState>()((set) => ({
  rows: 16,
  risk: "medium",
  betAmount: 10,
  isDropping: false,
  currentPath: null,
  currentSlotIndex: null,
  lastMultiplier: null,
  lastPayout: null,
  lastProfit: null,

  setRows: (rows) => set({ rows }),
  setRisk: (risk) => set({ risk }),
  setBetAmount: (amount) => set({ betAmount: amount }),
  setIsDropping: (dropping) => set({ isDropping: dropping }),
  setResult: (path, slotIndex, multiplier, payout, profit) =>
    set({
      currentPath: path,
      currentSlotIndex: slotIndex,
      lastMultiplier: multiplier,
      lastPayout: payout,
      lastProfit: profit,
    }),
  reset: () =>
    set({
      isDropping: false,
      currentPath: null,
      currentSlotIndex: null,
      lastMultiplier: null,
      lastPayout: null,
      lastProfit: null,
    }),
}));
