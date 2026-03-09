"use client";

import { create } from "zustand";

interface SiteConfigState {
  showProvablyFair: boolean;
  loaded: boolean;
  setShowProvablyFair: (show: boolean) => void;
  fetchConfig: () => Promise<void>;
}

export const useSiteConfigStore = create<SiteConfigState>()((set) => ({
  showProvablyFair: true,
  loaded: false,
  setShowProvablyFair: (showProvablyFair) => set({ showProvablyFair }),
  fetchConfig: async () => {
    try {
      const res = await fetch("/api/site-config");
      if (res.ok) {
        const data = await res.json();
        set({ showProvablyFair: data.showProvablyFair, loaded: true });
      }
    } catch {
      // Default to showing provably fair on error
      set({ loaded: true });
    }
  },
}));
