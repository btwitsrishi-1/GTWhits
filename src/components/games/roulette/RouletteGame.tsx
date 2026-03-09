"use client";

import { useCallback } from "react";
import { useRouletteStore } from "@/stores/roulette-store";
import { useUserStore } from "@/stores/user-store";
import { useSound } from "@/lib/sounds/use-sound";
import { useToastStore } from "@/stores/toast-store";
import { useBigWinStore } from "@/components/ui/BigWinOverlay";
import GameLayout from "@/components/games/GameLayout";
import RouletteWheel from "./RouletteWheel";
import BettingTable from "./BettingTable";
import ChipSelector from "./ChipSelector";
import { getNumberColor } from "@/lib/games/roulette";

export default function RouletteGame() {
  const {
    bets,
    isSpinning,
    winningNumber,
    lastProfit,
    clearBets,
    setSpinning,
    setResult,
    reset,
    totalBet,
  } = useRouletteStore();

  const { setBalance } = useUserStore();
  const { play } = useSound();
  const addToast = useToastStore((s) => s.addToast);
  const triggerBigWin = useBigWinStore((s) => s.triggerBigWin);

  const handleSpin = useCallback(async () => {
    if (isSpinning || bets.length === 0) return;

    try {
      reset();
      play("bet");
      setSpinning(true);
      play("roulette-spin");

      const res = await fetch("/api/games/roulette", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bets }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Failed to spin", "error");
        setSpinning(false);
        return;
      }

      setResult(data.winningNumber, data.totalPayout, data.profit, data.winningBets);
      setBalance(data.balance);
    } catch {
      addToast("Network error", "error");
      setSpinning(false);
    }
  }, [bets, isSpinning, reset, setSpinning, setResult, setBalance, play, addToast]);

  const handleSpinComplete = useCallback(() => {
    const state = useRouletteStore.getState();
    if (state.lastProfit !== null && state.lastProfit > 0) {
      play("win");
      // Check for big win (profit >= 10x any single bet)
      const maxBet = Math.max(...state.bets.map((b) => b.amount));
      if (state.lastProfit >= maxBet * 10) {
        triggerBigWin(state.lastProfit / state.totalBet() + 1, state.lastProfit, "Roulette");
      }
    } else {
      play("lose");
    }
    // Keep spinning state for a moment to show result
    setTimeout(() => {
      setSpinning(false);
    }, 2000);
  }, [setSpinning, play, triggerBigWin]);

  const total = totalBet();

  const controls = (
    <div className="space-y-4">
      {/* Chip selector */}
      <ChipSelector />

      {/* Total bet display */}
      <div className="flex justify-between text-xs">
        <span className="text-casino-text-muted">Total Bet</span>
        <span className="text-casino-text font-semibold">${total.toFixed(2)}</span>
      </div>

      {/* Bets count */}
      <div className="flex justify-between text-xs">
        <span className="text-casino-text-muted">Bets Placed</span>
        <span className="text-casino-text">{bets.length}</span>
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        <button
          onClick={handleSpin}
          disabled={isSpinning || bets.length === 0}
          className="w-full bg-casino-green hover:bg-casino-green-hover text-casino-bg font-bold py-3 rounded-casino text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSpinning ? "Spinning..." : "Spin"}
        </button>

        <button
          onClick={clearBets}
          disabled={isSpinning || bets.length === 0}
          className="w-full bg-casino-elevated hover:bg-casino-hover border border-casino-border text-casino-text text-sm py-2 rounded-casino transition-colors disabled:opacity-30"
        >
          Clear Bets
        </button>
      </div>

      {/* Last result */}
      {winningNumber !== null && !isSpinning && (
        <div className="space-y-2 pt-2 border-t border-casino-border">
          <div className="flex justify-between text-xs">
            <span className="text-casino-text-muted">Winning Number</span>
            <span
              className={`font-bold ${
                getNumberColor(winningNumber) === "red"
                  ? "text-red-500"
                  : getNumberColor(winningNumber) === "green"
                  ? "text-green-500"
                  : "text-casino-text"
              }`}
            >
              {winningNumber}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-casino-text-muted">Profit</span>
            <span
              className={
                lastProfit !== null && lastProfit > 0
                  ? "text-casino-green"
                  : "text-casino-red"
              }
            >
              {lastProfit !== null
                ? lastProfit > 0
                  ? `+$${lastProfit.toFixed(2)}`
                  : `-$${Math.abs(lastProfit).toFixed(2)}`
                : "$0.00"}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <GameLayout title="Roulette" controls={controls}>
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Result display */}
        {winningNumber !== null && !isSpinning && (
          <div className="text-center">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-casino ${
                getNumberColor(winningNumber) === "red"
                  ? "bg-red-700/20 border border-red-700"
                  : getNumberColor(winningNumber) === "green"
                  ? "bg-green-700/20 border border-green-700"
                  : "bg-gray-700/20 border border-gray-600"
              }`}
            >
              <span className="text-2xl font-bold text-white">
                {winningNumber}
              </span>
            </div>
            {lastProfit !== null && (
              <p
                className={`text-lg font-bold mt-2 ${
                  lastProfit > 0 ? "text-casino-green" : "text-casino-red"
                }`}
              >
                {lastProfit > 0
                  ? `+$${lastProfit.toFixed(2)}`
                  : `-$${Math.abs(lastProfit).toFixed(2)}`}
              </p>
            )}
          </div>
        )}

        {/* Wheel */}
        <RouletteWheel
          winningNumber={winningNumber}
          isSpinning={isSpinning}
          onSpinComplete={handleSpinComplete}
        />

        {/* Betting table */}
        <BettingTable disabled={isSpinning} />

        {/* Instructions */}
        {bets.length === 0 && !isSpinning && winningNumber === null && (
          <p className="text-casino-text-muted text-sm text-center">
            Select a chip value, place your bets on the table, then click Spin
          </p>
        )}
      </div>
    </GameLayout>
  );
}
