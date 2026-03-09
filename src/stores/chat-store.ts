"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
  type: "chat" | "system" | "bigwin";
}

interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  onlineCount: number;
  connected: boolean;
  unreadCount: number;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  addMessage: (msg: ChatMessage) => void;
  setHistory: (msgs: ChatMessage[]) => void;
  setOnlineCount: (count: number) => void;
  setConnected: (connected: boolean) => void;
  clearUnread: () => void;
}

const MAX_MESSAGES = 200;

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isOpen: false,
      onlineCount: 0,
      connected: false,
      unreadCount: 0,
      setOpen: (isOpen) => set({ isOpen, unreadCount: isOpen ? 0 : get().unreadCount }),
      toggleOpen: () => {
        const next = !get().isOpen;
        set({ isOpen: next, unreadCount: next ? 0 : get().unreadCount });
      },
      addMessage: (msg) =>
        set((state) => {
          const messages = [...state.messages, msg];
          if (messages.length > MAX_MESSAGES) {
            messages.splice(0, messages.length - MAX_MESSAGES);
          }
          return {
            messages,
            unreadCount: state.isOpen ? 0 : state.unreadCount + 1,
          };
        }),
      setHistory: (msgs) => set({ messages: msgs }),
      setOnlineCount: (onlineCount) => set({ onlineCount }),
      setConnected: (connected) => set({ connected }),
      clearUnread: () => set({ unreadCount: 0 }),
    }),
    {
      name: "chat-state",
      partialize: (state) => ({ isOpen: state.isOpen }),
    }
  )
);
