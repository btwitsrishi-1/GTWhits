"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SoundState {
  enabled: boolean;
  volume: number;
  toggle: () => void;
  setVolume: (volume: number) => void;
}

export const useSoundStore = create<SoundState>()(
  persist(
    (set) => ({
      enabled: true,
      volume: 0.5,
      toggle: () => set((state) => ({ enabled: !state.enabled })),
      setVolume: (volume) => set({ volume }),
    }),
    {
      name: "sound-settings",
    }
  )
);
