"use client";

import { create } from "zustand";

interface GameState {
  isPlaying: boolean;
  betAmount: number;
  currentMultiplier: number;
  lastResult: {
    won: boolean;
    multiplier: number;
    profit: number;
  } | null;
  showResult: boolean;

  setIsPlaying: (playing: boolean) => void;
  setBetAmount: (amount: number) => void;
  setCurrentMultiplier: (multiplier: number) => void;
  setLastResult: (result: { won: boolean; multiplier: number; profit: number } | null) => void;
  setShowResult: (show: boolean) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>()((set) => ({
  isPlaying: false,
  betAmount: 10,
  currentMultiplier: 1,
  lastResult: null,
  showResult: false,

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setBetAmount: (amount) => set({ betAmount: amount }),
  setCurrentMultiplier: (multiplier) => set({ currentMultiplier: multiplier }),
  setLastResult: (result) => set({ lastResult: result }),
  setShowResult: (show) => set({ showResult: show }),
  reset: () =>
    set({
      isPlaying: false,
      currentMultiplier: 1,
      lastResult: null,
      showResult: false,
    }),
}));
