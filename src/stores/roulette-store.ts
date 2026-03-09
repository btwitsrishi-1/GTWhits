"use client";

import { create } from "zustand";
import type { BetType, RouletteBet } from "@/lib/games/roulette";

interface RouletteState {
  bets: RouletteBet[];
  selectedChip: number;
  isSpinning: boolean;
  winningNumber: number | null;
  lastProfit: number | null;
  lastPayout: number | null;
  winningBets: RouletteBet[];

  setSelectedChip: (chip: number) => void;
  addBet: (type: BetType, numbers: number[]) => void;
  removeBet: (index: number) => void;
  clearBets: () => void;
  setSpinning: (spinning: boolean) => void;
  setResult: (
    winningNumber: number,
    payout: number,
    profit: number,
    winningBets: RouletteBet[]
  ) => void;
  reset: () => void;
  totalBet: () => number;
}

export const useRouletteStore = create<RouletteState>()((set, get) => ({
  bets: [],
  selectedChip: 10,
  isSpinning: false,
  winningNumber: null,
  lastProfit: null,
  lastPayout: null,
  winningBets: [],

  setSelectedChip: (chip) => set({ selectedChip: chip }),

  addBet: (type, numbers) => {
    const { selectedChip, bets } = get();
    // Check if same bet type + numbers already exists, if so increase amount
    const existingIndex = bets.findIndex(
      (b) =>
        b.type === type &&
        b.numbers.length === numbers.length &&
        b.numbers.every((n, i) => n === numbers[i])
    );

    if (existingIndex >= 0) {
      const updated = [...bets];
      updated[existingIndex] = {
        ...updated[existingIndex],
        amount: updated[existingIndex].amount + selectedChip,
      };
      set({ bets: updated });
    } else {
      set({ bets: [...bets, { type, numbers, amount: selectedChip }] });
    }
  },

  removeBet: (index) => {
    const { bets } = get();
    set({ bets: bets.filter((_, i) => i !== index) });
  },

  clearBets: () => set({ bets: [] }),

  setSpinning: (spinning) => set({ isSpinning: spinning }),

  setResult: (winningNumber, payout, profit, winningBets) =>
    set({ winningNumber, lastPayout: payout, lastProfit: profit, winningBets }),

  reset: () =>
    set({
      winningNumber: null,
      lastProfit: null,
      lastPayout: null,
      winningBets: [],
    }),

  totalBet: () => get().bets.reduce((sum, b) => sum + b.amount, 0),
}));
