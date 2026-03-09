"use client";

import { create } from "zustand";
import type { GameOutcome } from "@/lib/games/blackjack";

interface CardData {
  suit: string;
  rank: string;
}

interface BlackjackState {
  gameSessionId: string | null;
  betAmount: number;
  playerCards: CardData[];
  dealerCards: CardData[];
  dealerUpCard: CardData | null;
  playerValue: number;
  dealerValue: number | null;
  playerIsSoft: boolean;
  isActive: boolean;
  isDealing: boolean;
  gameOver: boolean;
  outcome: GameOutcome | null;
  multiplier: number;
  payout: number;
  profit: number;
  canDouble: boolean;

  setBetAmount: (amount: number) => void;
  startGame: (data: {
    gameSessionId: string;
    playerCards: CardData[];
    dealerUpCard: CardData;
    playerValue: number;
    playerIsSoft: boolean;
    isBlackjack: boolean;
    dealerBlackjack: boolean;
    gameOver: boolean;
    outcome: GameOutcome | null;
    dealerCards?: CardData[];
    dealerValue?: number;
    multiplier: number;
    payout: number;
    profit: number;
  }) => void;
  handleAction: (data: {
    playerCards: CardData[];
    playerValue: number;
    playerIsSoft: boolean;
    playerIsBust: boolean;
    gameOver: boolean;
    outcome: GameOutcome | null;
    dealerCards?: CardData[];
    dealerValue?: number;
    multiplier: number;
    payout: number;
    profit: number;
  }) => void;
  setIsDealing: (dealing: boolean) => void;
  reset: () => void;
}

export const useBlackjackStore = create<BlackjackState>()((set) => ({
  gameSessionId: null,
  betAmount: 10,
  playerCards: [],
  dealerCards: [],
  dealerUpCard: null,
  playerValue: 0,
  dealerValue: null,
  playerIsSoft: false,
  isActive: false,
  isDealing: false,
  gameOver: false,
  outcome: null,
  multiplier: 0,
  payout: 0,
  profit: 0,
  canDouble: false,

  setBetAmount: (amount) => set({ betAmount: amount }),

  startGame: (data) =>
    set({
      gameSessionId: data.gameSessionId,
      playerCards: data.playerCards,
      dealerUpCard: data.dealerUpCard,
      dealerCards: data.gameOver && data.dealerCards ? data.dealerCards : [],
      playerValue: data.playerValue,
      dealerValue: data.dealerValue ?? null,
      playerIsSoft: data.playerIsSoft,
      isActive: !data.gameOver,
      gameOver: data.gameOver,
      outcome: data.outcome,
      multiplier: data.multiplier,
      payout: data.payout,
      profit: data.profit,
      canDouble: !data.gameOver && data.playerCards.length === 2,
      isDealing: false,
    }),

  handleAction: (data) =>
    set({
      playerCards: data.playerCards,
      playerValue: data.playerValue,
      playerIsSoft: data.playerIsSoft,
      dealerCards: data.gameOver && data.dealerCards ? data.dealerCards : [],
      dealerValue: data.dealerValue ?? null,
      isActive: !data.gameOver,
      gameOver: data.gameOver,
      outcome: data.outcome,
      multiplier: data.multiplier,
      payout: data.payout,
      profit: data.profit,
      canDouble: false,
      isDealing: false,
    }),

  setIsDealing: (dealing) => set({ isDealing: dealing }),

  reset: () =>
    set({
      gameSessionId: null,
      playerCards: [],
      dealerCards: [],
      dealerUpCard: null,
      playerValue: 0,
      dealerValue: null,
      playerIsSoft: false,
      isActive: false,
      isDealing: false,
      gameOver: false,
      outcome: null,
      multiplier: 0,
      payout: 0,
      profit: 0,
      canDouble: false,
    }),
}));
