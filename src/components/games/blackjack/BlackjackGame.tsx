"use client";

import { useCallback } from "react";
import { useBlackjackStore } from "@/stores/blackjack-store";
import { useUserStore } from "@/stores/user-store";
import { useSound } from "@/lib/sounds/use-sound";
import { useToastStore } from "@/stores/toast-store";
import { useBigWinStore } from "@/components/ui/BigWinOverlay";
import GameLayout from "@/components/games/GameLayout";
import BetControls from "@/components/games/BetControls";
import HandDisplay from "./HandDisplay";

export default function BlackjackGame() {
  const {
    gameSessionId,
    betAmount,
    playerCards,
    dealerCards,
    dealerUpCard,
    playerValue,
    dealerValue,
    playerIsSoft,
    isActive,
    isDealing,
    gameOver,
    outcome,
    multiplier,
    payout,
    profit,
    canDouble,
    setBetAmount,
    startGame,
    handleAction,
    setIsDealing,
    reset,
  } = useBlackjackStore();

  const { setBalance } = useUserStore();
  const { play } = useSound();
  const addToast = useToastStore((s) => s.addToast);
  const triggerBigWin = useBigWinStore((s) => s.triggerBigWin);

  const handleStartGame = useCallback(async () => {
    setIsDealing(true);
    try {
      const res = await fetch("/api/games/blackjack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Failed to start game", "error");
        setIsDealing(false);
        return;
      }
      play("bet");
      startGame({
        gameSessionId: data.gameSessionId,
        playerCards: data.playerCards,
        dealerUpCard: data.dealerUpCard,
        playerValue: data.playerValue,
        playerIsSoft: data.playerIsSoft,
        isBlackjack: data.isBlackjack,
        dealerBlackjack: data.dealerBlackjack,
        gameOver: data.gameOver,
        outcome: data.outcome,
        dealerCards: data.dealerCards,
        dealerValue: data.dealerValue,
        multiplier: data.multiplier,
        payout: data.payout,
        profit: data.profit,
      });
      setBalance(data.balance);
      if (data.gameOver) {
        if (data.outcome === "win" || data.outcome === "blackjack") {
          play("win");
          if (data.multiplier >= 10) {
            triggerBigWin(data.multiplier, data.profit, "Blackjack");
          }
        } else if (data.outcome === "lose") {
          play("lose");
        }
      }
    } catch {
      addToast("Network error", "error");
      setIsDealing(false);
    }
  }, [betAmount, startGame, setBalance, setIsDealing, play, addToast, triggerBigWin]);

  const handlePlayerAction = useCallback(
    async (action: "hit" | "stand" | "double") => {
      if (!gameSessionId || isDealing) return;
      setIsDealing(true);

      try {
        const res = await fetch("/api/games/blackjack/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameSessionId, action }),
        });
        const data = await res.json();
        if (!res.ok) {
          addToast(data.error || "Action failed", "error");
          setIsDealing(false);
          return;
        }
        play("card-deal");
        handleAction({
          playerCards: data.playerCards,
          playerValue: data.playerValue,
          playerIsSoft: data.playerIsSoft,
          playerIsBust: data.playerIsBust,
          gameOver: data.gameOver,
          outcome: data.outcome,
          dealerCards: data.dealerCards,
          dealerValue: data.dealerValue,
          multiplier: data.multiplier,
          payout: data.payout,
          profit: data.profit,
        });
        setBalance(data.balance);
        if (data.gameOver) {
          if (data.outcome === "win" || data.outcome === "blackjack") {
            play("win");
            if (data.multiplier >= 10) {
              triggerBigWin(data.multiplier, data.profit, "Blackjack");
            }
          } else if (data.outcome === "lose") {
            play("lose");
          }
        }
      } catch {
        addToast("Network error", "error");
        setIsDealing(false);
      }
    },
    [gameSessionId, isDealing, handleAction, setBalance, setIsDealing, play, addToast, triggerBigWin]
  );

  const outcomeLabel = (o: string) => {
    switch (o) {
      case "blackjack":
        return "Blackjack!";
      case "win":
        return "You Win!";
      case "lose":
        return "You Lose";
      case "push":
        return "Push";
      default:
        return "";
    }
  };

  const outcomeColor = (o: string) => {
    switch (o) {
      case "blackjack":
      case "win":
        return "text-casino-green";
      case "lose":
        return "text-casino-red";
      case "push":
        return "text-casino-orange";
      default:
        return "text-casino-text";
    }
  };

  // Build dealer display cards
  const dealerDisplayCards =
    gameOver && dealerCards.length > 0
      ? dealerCards
      : dealerUpCard
        ? [dealerUpCard, { suit: "back", rank: "?" }]
        : [];

  const controls = (
    <BetControls
      betAmount={betAmount}
      onBetChange={setBetAmount}
      onAction={handleStartGame}
      actionLabel="Deal"
      disabled={isDealing || isActive || gameOver}
      isPlaying={isActive || gameOver}
    >
      {/* Game info */}
      {(isActive || gameOver) && (
        <div className="space-y-2 pt-2 border-t border-casino-border">
          <div className="flex justify-between text-xs">
            <span className="text-casino-text-muted">Bet</span>
            <span className="text-casino-text">${betAmount.toFixed(2)}</span>
          </div>
          {gameOver && outcome && (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-casino-text-muted">Result</span>
                <span className={outcomeColor(outcome)}>
                  {outcomeLabel(outcome)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-casino-text-muted">Multiplier</span>
                <span className="text-casino-text">{multiplier.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-casino-text-muted">Profit</span>
                <span
                  className={
                    profit > 0
                      ? "text-casino-green"
                      : profit < 0
                        ? "text-casino-red"
                        : "text-casino-text"
                  }
                >
                  {profit >= 0 ? "+" : ""}${profit.toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* New game button after game ends */}
      {gameOver && (
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
    <GameLayout title="Blackjack" controls={controls}>
      <div className="flex flex-col items-center gap-8 w-full max-w-[500px]">
        {/* Outcome display */}
        {gameOver && outcome && (
          <div className="text-center">
            <span className={`text-3xl font-bold ${outcomeColor(outcome)}`}>
              {outcomeLabel(outcome)}
            </span>
            <div className="mt-1">
              <span
                className={`text-lg font-semibold ${
                  profit > 0
                    ? "text-casino-green"
                    : profit < 0
                      ? "text-casino-red"
                      : "text-casino-text-secondary"
                }`}
              >
                {profit > 0 ? `+$${profit.toFixed(2)}` : profit < 0 ? `-$${Math.abs(profit).toFixed(2)}` : "$0.00"}
              </span>
            </div>
          </div>
        )}

        {/* Dealer hand */}
        {dealerDisplayCards.length > 0 && (
          <HandDisplay
            label="Dealer"
            cards={dealerDisplayCards}
            value={gameOver ? dealerValue : null}
            faceDownSecond={!gameOver}
          />
        )}

        {/* Player hand */}
        {playerCards.length > 0 && (
          <HandDisplay
            label="Player"
            cards={playerCards}
            value={playerValue}
            isSoft={playerIsSoft}
          />
        )}

        {/* Action buttons */}
        {isActive && !isDealing && (
          <div className="flex gap-3">
            <button
              onClick={() => handlePlayerAction("hit")}
              className="px-6 py-2.5 bg-casino-elevated hover:bg-casino-hover border border-casino-border text-casino-text text-sm font-semibold rounded-casino transition-colors"
            >
              Hit
            </button>
            <button
              onClick={() => handlePlayerAction("stand")}
              className="px-6 py-2.5 bg-casino-green hover:bg-casino-green-hover text-casino-bg text-sm font-semibold rounded-casino transition-colors"
            >
              Stand
            </button>
            {canDouble && (
              <button
                onClick={() => handlePlayerAction("double")}
                className="px-6 py-2.5 bg-casino-orange hover:opacity-90 text-casino-bg text-sm font-semibold rounded-casino transition-colors"
              >
                Double
              </button>
            )}
          </div>
        )}

        {/* Dealing indicator */}
        {isDealing && (
          <p className="text-casino-text-muted text-sm animate-pulse">
            Dealing...
          </p>
        )}

        {/* Instructions */}
        {!isActive && !gameOver && !isDealing && (
          <p className="text-casino-text-muted text-sm text-center">
            Set your bet and click Deal to start
          </p>
        )}
      </div>
    </GameLayout>
  );
}
