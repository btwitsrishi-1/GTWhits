"use client";

import { useCallback } from "react";
import { useMinesStore } from "@/stores/mines-store";
import { useUserStore } from "@/stores/user-store";
import { useSound } from "@/lib/sounds/use-sound";
import { useToastStore } from "@/stores/toast-store";
import { useBigWinStore } from "@/components/ui/BigWinOverlay";
import GameLayout from "@/components/games/GameLayout";
import BetControls from "@/components/games/BetControls";
import MinesGrid from "./MinesGrid";

export default function MinesGame() {
  const {
    gameSessionId,
    mineCount,
    gemsRevealed,
    currentMultiplier,
    nextMultiplier,
    isActive,
    isRevealing,
    betAmount,
    setMineCount,
    setBetAmount,
    startGame,
    revealGem,
    revealMine,
    cashout,
    setIsRevealing,
    reset,
  } = useMinesStore();

  const { setBalance } = useUserStore();
  const { play } = useSound();
  const addToast = useToastStore((s) => s.addToast);
  const triggerBigWin = useBigWinStore((s) => s.triggerBigWin);

  const handleStartGame = useCallback(async () => {
    try {
      const res = await fetch("/api/games/mines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount, mineCount }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Failed to start game", "error");
        return;
      }
      startGame(data.gameSessionId, data.serverSeedHash);
      setBalance(data.balance);
      play("bet");
    } catch {
      addToast("Network error", "error");
    }
  }, [betAmount, mineCount, startGame, setBalance, play, addToast]);

  const handleReveal = useCallback(
    async (tileIndex: number) => {
      if (!gameSessionId || isRevealing) return;
      setIsRevealing(true);

      try {
        const res = await fetch("/api/games/mines/reveal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameSessionId, tileIndex }),
        });
        const data = await res.json();
        if (!res.ok) {
          addToast(data.error || "Failed to reveal tile", "error");
          setIsRevealing(false);
          return;
        }

        if (data.isMine) {
          revealMine(tileIndex, data.minePositions);
          play("mine-explode");
        } else if (data.gameOver && data.autoCashout) {
          revealGem(tileIndex, data.multiplier, 0);
          play("gem-reveal");
          // Auto-cashout: all gems found
          setTimeout(() => {
            cashout(data.minePositions);
            setBalance(data.balance);
            play("win");
            if (data.multiplier >= 10) {
              triggerBigWin(data.multiplier, betAmount * data.multiplier - betAmount, "Mines");
            }
          }, 500);
        } else {
          revealGem(tileIndex, data.multiplier, data.nextMultiplier);
          play("gem-reveal");
        }
      } catch {
        addToast("Network error", "error");
      } finally {
        setIsRevealing(false);
      }
    },
    [gameSessionId, isRevealing, setIsRevealing, revealGem, revealMine, cashout, setBalance, play, addToast, triggerBigWin, betAmount]
  );

  const handleCashout = useCallback(async () => {
    if (!gameSessionId) return;

    try {
      const res = await fetch("/api/games/mines/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameSessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Failed to cash out", "error");
        return;
      }
      cashout(data.minePositions);
      setBalance(data.balance);
      play("cashout");
      const mult = useMinesStore.getState().currentMultiplier;
      if (mult >= 10) {
        triggerBigWin(mult, betAmount * mult - betAmount, "Mines");
      }
    } catch {
      addToast("Network error", "error");
    }
  }, [gameSessionId, cashout, setBalance, play, addToast, triggerBigWin, betAmount]);

  const controls = (
    <BetControls
      betAmount={betAmount}
      onBetChange={setBetAmount}
      onAction={isActive ? handleCashout : handleStartGame}
      actionLabel={
        isActive
          ? `Cashout ${(betAmount * currentMultiplier).toFixed(2)}`
          : "Bet"
      }
      disabled={isActive ? gemsRevealed === 0 : false}
      isPlaying={isActive}
    >
      {/* Mine count selector */}
      <div>
        <label className="text-xs text-casino-text-muted mb-1.5 block">
          Mines
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {[1, 3, 5, 10, 15, 20, 24].map((count) => (
            <button
              key={count}
              onClick={() => setMineCount(count)}
              disabled={isActive}
              className={`py-1.5 text-xs rounded-casino border transition-colors ${
                mineCount === count
                  ? "bg-casino-green/20 border-casino-green text-casino-green"
                  : "bg-casino-bg border-casino-border text-casino-text-secondary hover:text-casino-text hover:border-casino-text-muted"
              } disabled:opacity-30`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Game info when active */}
      {isActive && (
        <div className="space-y-2 pt-2 border-t border-casino-border">
          <div className="flex justify-between text-xs">
            <span className="text-casino-text-muted">Mines</span>
            <span className="text-casino-red">{mineCount}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-casino-text-muted">Gems Found</span>
            <span className="text-casino-green">{gemsRevealed}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-casino-text-muted">Current</span>
            <span className="text-casino-text font-semibold">
              {currentMultiplier.toFixed(2)}x
            </span>
          </div>
          {nextMultiplier > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-casino-text-muted">Next</span>
              <span className="text-casino-text-secondary">
                {nextMultiplier.toFixed(2)}x
              </span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-casino-text-muted">Profit on Cashout</span>
            <span
              className={
                betAmount * currentMultiplier - betAmount > 0
                  ? "text-casino-green"
                  : "text-casino-text"
              }
            >
              ${(betAmount * currentMultiplier - betAmount).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* New game button after game ends */}
      {!isActive && gameSessionId && (
        <button
          onClick={reset}
          className="w-full bg-casino-elevated hover:bg-casino-hover border border-casino-border text-casino-text text-sm py-2 rounded-casino transition-colors"
        >
          New Game
        </button>
      )}
    </BetControls>
  );

  return (
    <GameLayout title="Mines" controls={controls}>
      <div className="flex flex-col items-center gap-4">
        {/* Multiplier display */}
        {isActive && gemsRevealed > 0 && (
          <div className="text-center">
            <span className="text-3xl font-bold text-casino-green">
              {currentMultiplier.toFixed(2)}x
            </span>
          </div>
        )}

        {/* Game over display */}
        {!isActive && gameSessionId && (
          <div className="text-center">
            <span
              className={`text-3xl font-bold ${
                currentMultiplier > 0 ? "text-casino-green" : "text-casino-red"
              }`}
            >
              {currentMultiplier > 0
                ? `+$${(betAmount * currentMultiplier - betAmount).toFixed(2)}`
                : `-$${betAmount.toFixed(2)}`}
            </span>
          </div>
        )}

        {/* The grid */}
        <MinesGrid onReveal={handleReveal} />

        {/* Instructions */}
        {!isActive && !gameSessionId && (
          <p className="text-casino-text-muted text-sm text-center">
            Set your bet and mine count, then click Bet to start
          </p>
        )}
      </div>
    </GameLayout>
  );
}
