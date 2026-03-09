"use client";

import { useCallback } from "react";
import { usePlinkoStore } from "@/stores/plinko-store";
import { useUserStore } from "@/stores/user-store";
import { useSound } from "@/lib/sounds/use-sound";
import { useToastStore } from "@/stores/toast-store";
import { useBigWinStore } from "@/components/ui/BigWinOverlay";
import GameLayout from "@/components/games/GameLayout";
import BetControls from "@/components/games/BetControls";
import PlinkoCanvas from "./PlinkoCanvas";
import MultiplierSlots from "./MultiplierSlots";
import type { PlinkoRisk, PlinkoRows } from "@/lib/games/plinko";

const ROWS_OPTIONS: PlinkoRows[] = [8, 12, 16];
const RISK_OPTIONS: PlinkoRisk[] = ["low", "medium", "high"];

export default function PlinkoGame() {
  const {
    rows,
    risk,
    betAmount,
    isDropping,
    currentPath,
    currentSlotIndex,
    lastMultiplier,
    lastProfit,
    setRows,
    setRisk,
    setBetAmount,
    setIsDropping,
    setResult,
  } = usePlinkoStore();

  const { setBalance } = useUserStore();
  const { play } = useSound();
  const addToast = useToastStore((s) => s.addToast);
  const triggerBigWin = useBigWinStore((s) => s.triggerBigWin);

  const handleDrop = useCallback(async () => {
    if (isDropping) return;

    try {
      const res = await fetch("/api/games/plinko", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount, rows, risk }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Failed to drop ball", "error");
        return;
      }

      play("bet");
      setIsDropping(true);
      setResult(data.path, data.slotIndex, data.multiplier, data.payout, data.profit);
      setBalance(data.balance);
    } catch {
      addToast("Network error", "error");
    }
  }, [betAmount, rows, risk, isDropping, setIsDropping, setResult, setBalance, play, addToast]);

  const handleBallLanded = useCallback(() => {
    play("plinko-land");
    const state = usePlinkoStore.getState();
    if (state.lastMultiplier !== null && state.lastMultiplier > 1) {
      play("win");
    }
    if (state.lastMultiplier !== null && state.lastMultiplier >= 10 && state.lastProfit !== null) {
      triggerBigWin(state.lastMultiplier, state.lastProfit, "Plinko");
    }
    setTimeout(() => {
      setIsDropping(false);
    }, 1000);
  }, [setIsDropping, play, triggerBigWin]);

  const controls = (
    <BetControls
      betAmount={betAmount}
      onBetChange={setBetAmount}
      onAction={handleDrop}
      actionLabel={isDropping ? "Dropping..." : "Drop Ball"}
      disabled={isDropping}
      isPlaying={isDropping}
    >
      {/* Risk selector */}
      <div>
        <label className="text-xs text-casino-text-muted mb-1.5 block">Risk</label>
        <div className="grid grid-cols-3 gap-1.5">
          {RISK_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRisk(r)}
              disabled={isDropping}
              className={`py-1.5 text-xs rounded-casino border capitalize transition-colors ${
                risk === r
                  ? r === "low"
                    ? "bg-casino-green/20 border-casino-green text-casino-green"
                    : r === "medium"
                    ? "bg-orange-500/20 border-orange-500 text-orange-500"
                    : "bg-casino-red/20 border-casino-red text-casino-red"
                  : "bg-casino-bg border-casino-border text-casino-text-secondary hover:text-casino-text hover:border-casino-text-muted"
              } disabled:opacity-30`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Rows selector */}
      <div>
        <label className="text-xs text-casino-text-muted mb-1.5 block">Rows</label>
        <div className="grid grid-cols-3 gap-1.5">
          {ROWS_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRows(r)}
              disabled={isDropping}
              className={`py-1.5 text-xs rounded-casino border transition-colors ${
                rows === r
                  ? "bg-casino-green/20 border-casino-green text-casino-green"
                  : "bg-casino-bg border-casino-border text-casino-text-secondary hover:text-casino-text hover:border-casino-text-muted"
              } disabled:opacity-30`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Last result display */}
      {lastMultiplier !== null && (
        <div className="space-y-2 pt-2 border-t border-casino-border">
          <div className="flex justify-between text-xs">
            <span className="text-casino-text-muted">Multiplier</span>
            <span
              className={
                lastMultiplier >= 2
                  ? "text-casino-green font-bold"
                  : lastMultiplier >= 1
                  ? "text-casino-text"
                  : "text-casino-red"
              }
            >
              {lastMultiplier.toFixed(1)}x
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
    </BetControls>
  );

  return (
    <GameLayout title="Plinko" controls={controls}>
      <div className="flex flex-col items-center gap-3 w-full">
        {/* Result display */}
        {lastMultiplier !== null && !isDropping && (
          <div className="text-center">
            <span
              className={`text-3xl font-bold ${
                lastMultiplier >= 2
                  ? "text-casino-green"
                  : lastMultiplier >= 1
                  ? "text-casino-text"
                  : "text-casino-red"
              }`}
            >
              {lastMultiplier.toFixed(1)}x
            </span>
          </div>
        )}

        {/* Canvas */}
        <PlinkoCanvas
          rows={rows}
          path={currentPath}
          isDropping={isDropping}
          onBallLanded={handleBallLanded}
        />

        {/* Multiplier slots */}
        <MultiplierSlots
          rows={rows}
          risk={risk}
          activeSlot={!isDropping ? currentSlotIndex : null}
        />
      </div>
    </GameLayout>
  );
}
