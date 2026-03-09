"use client";

import { useUserStore } from "@/stores/user-store";

interface BetControlsProps {
  betAmount: number;
  onBetChange: (amount: number) => void;
  onAction: () => void;
  actionLabel: string;
  disabled?: boolean;
  isPlaying?: boolean;
  children?: React.ReactNode;
}

export default function BetControls({
  betAmount,
  onBetChange,
  onAction,
  actionLabel,
  disabled = false,
  isPlaying = false,
  children,
}: BetControlsProps) {
  const { balance } = useUserStore();

  function handleInputChange(value: string) {
    const num = parseFloat(value);
    if (isNaN(num)) {
      onBetChange(0);
    } else {
      onBetChange(Math.max(0, num));
    }
  }

  function adjustBet(multiplier: number) {
    const newAmount = Math.max(1, Math.min(balance, betAmount * multiplier));
    onBetChange(parseFloat(newAmount.toFixed(2)));
  }

  return (
    <div className="space-y-4">
      {/* Bet Amount */}
      <div>
        <label className="text-xs text-casino-text-muted mb-1.5 block">Bet Amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-casino-text-muted text-sm">
            $
          </span>
          <input
            type="number"
            value={betAmount || ""}
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={isPlaying}
            className="w-full bg-casino-bg border border-casino-border rounded-casino pl-7 pr-3 py-2.5 text-casino-text text-sm focus:outline-none focus:border-casino-green disabled:opacity-50"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Quick adjust buttons */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => onBetChange(1)}
          disabled={isPlaying}
          className="bg-casino-bg border border-casino-border rounded-casino py-1.5 text-xs text-casino-text-secondary hover:text-casino-text hover:border-casino-text-muted transition-colors disabled:opacity-30"
        >
          Min
        </button>
        <button
          onClick={() => adjustBet(0.5)}
          disabled={isPlaying}
          className="bg-casino-bg border border-casino-border rounded-casino py-1.5 text-xs text-casino-text-secondary hover:text-casino-text hover:border-casino-text-muted transition-colors disabled:opacity-30"
        >
          1/2x
        </button>
        <button
          onClick={() => adjustBet(2)}
          disabled={isPlaying}
          className="bg-casino-bg border border-casino-border rounded-casino py-1.5 text-xs text-casino-text-secondary hover:text-casino-text hover:border-casino-text-muted transition-colors disabled:opacity-30"
        >
          2x
        </button>
        <button
          onClick={() => onBetChange(balance)}
          disabled={isPlaying}
          className="bg-casino-bg border border-casino-border rounded-casino py-1.5 text-xs text-casino-text-secondary hover:text-casino-text hover:border-casino-text-muted transition-colors disabled:opacity-30"
        >
          Max
        </button>
      </div>

      {/* Game-specific controls */}
      {children}

      {/* Action button */}
      <button
        onClick={onAction}
        disabled={disabled || betAmount <= 0 || betAmount > balance}
        className="w-full bg-casino-green hover:bg-casino-green-hover text-casino-bg font-bold py-3 rounded-casino text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {actionLabel}
      </button>

      {/* Balance display */}
      <div className="flex items-center justify-between text-xs text-casino-text-muted pt-2 border-t border-casino-border">
        <span>Balance</span>
        <span className="text-casino-text">
          ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}
