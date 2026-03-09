"use client";

import { create } from "zustand";

export type TileState = "hidden" | "gem" | "mine";

interface MinesState {
  gameSessionId: string | null;
  mineCount: number;
  grid: TileState[];
  gemsRevealed: number;
  currentMultiplier: number;
  nextMultiplier: number;
  isActive: boolean;
  isRevealing: boolean;
  minePositions: number[];
  betAmount: number;
  serverSeedHash: string | null;

  setMineCount: (count: number) => void;
  setBetAmount: (amount: number) => void;
  startGame: (gameSessionId: string, serverSeedHash: string) => void;
  revealGem: (tileIndex: number, multiplier: number, nextMultiplier: number) => void;
  revealMine: (tileIndex: number, minePositions: number[]) => void;
  cashout: (minePositions: number[]) => void;
  setIsRevealing: (revealing: boolean) => void;
  reset: () => void;
}

const INITIAL_GRID: TileState[] = Array(25).fill("hidden");

export const useMinesStore = create<MinesState>()((set) => ({
  gameSessionId: null,
  mineCount: 3,
  grid: [...INITIAL_GRID],
  gemsRevealed: 0,
  currentMultiplier: 1,
  nextMultiplier: 1,
  isActive: false,
  isRevealing: false,
  minePositions: [],
  betAmount: 10,
  serverSeedHash: null,

  setMineCount: (count) => set({ mineCount: count }),
  setBetAmount: (amount) => set({ betAmount: amount }),

  startGame: (gameSessionId, serverSeedHash) =>
    set({
      gameSessionId,
      serverSeedHash,
      grid: [...INITIAL_GRID],
      gemsRevealed: 0,
      currentMultiplier: 1,
      nextMultiplier: 1,
      isActive: true,
      minePositions: [],
    }),

  revealGem: (tileIndex, multiplier, nextMultiplier) =>
    set((state) => {
      const newGrid = [...state.grid];
      newGrid[tileIndex] = "gem";
      return {
        grid: newGrid,
        gemsRevealed: state.gemsRevealed + 1,
        currentMultiplier: multiplier,
        nextMultiplier,
      };
    }),

  revealMine: (tileIndex, minePositions) =>
    set((state) => {
      const newGrid = [...state.grid];
      newGrid[tileIndex] = "mine";
      // Reveal all mine positions
      minePositions.forEach((pos) => {
        if (newGrid[pos] === "hidden") {
          newGrid[pos] = "mine";
        }
      });
      return {
        grid: newGrid,
        minePositions,
        isActive: false,
        currentMultiplier: 0,
      };
    }),

  cashout: (minePositions) =>
    set((state) => {
      const newGrid = [...state.grid];
      minePositions.forEach((pos) => {
        if (newGrid[pos] === "hidden") {
          newGrid[pos] = "mine";
        }
      });
      return {
        grid: newGrid,
        minePositions,
        isActive: false,
      };
    }),

  setIsRevealing: (revealing) => set({ isRevealing: revealing }),

  reset: () =>
    set({
      gameSessionId: null,
      grid: [...INITIAL_GRID],
      gemsRevealed: 0,
      currentMultiplier: 1,
      nextMultiplier: 1,
      isActive: false,
      isRevealing: false,
      minePositions: [],
      serverSeedHash: null,
    }),
}));
