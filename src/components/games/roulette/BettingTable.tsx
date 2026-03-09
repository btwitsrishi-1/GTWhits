"use client";

import { useRouletteStore } from "@/stores/roulette-store";
import { RED_NUMBERS, getNumberColor, type BetType } from "@/lib/games/roulette";

interface BettingTableProps {
  disabled: boolean;
}

export default function BettingTable({ disabled }: BettingTableProps) {
  const { addBet, bets } = useRouletteStore();

  function placeBet(type: BetType, numbers: number[]) {
    if (disabled) return;
    addBet(type, numbers);
  }

  // Get total amount bet on specific numbers
  function getChipAmount(numbers: number[]): number {
    return bets
      .filter(
        (b) =>
          b.numbers.length === numbers.length &&
          b.numbers.every((n, i) => n === numbers[i])
      )
      .reduce((sum, b) => sum + b.amount, 0);
  }

  function ChipIndicator({ numbers }: { numbers: number[] }) {
    const amount = getChipAmount(numbers);
    if (amount === 0) return null;
    return (
      <div className="absolute top-0.5 right-0.5 bg-casino-orange text-[8px] text-white rounded-full w-4 h-4 flex items-center justify-center font-bold z-10">
        {amount >= 1000 ? `${(amount / 1000).toFixed(0)}k` : amount}
      </div>
    );
  }

  const numberCell = (num: number) => {
    const color = getNumberColor(num);
    const bgClass =
      color === "red"
        ? "bg-red-700 hover:bg-red-600"
        : color === "black"
        ? "bg-gray-800 hover:bg-gray-700"
        : "bg-green-700 hover:bg-green-600";

    return (
      <button
        key={num}
        onClick={() => placeBet("straight", [num])}
        disabled={disabled}
        className={`${bgClass} text-white text-xs font-bold py-2 px-1 rounded-sm relative transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {num}
        <ChipIndicator numbers={[num]} />
      </button>
    );
  };

  // Build the 3-column grid (rows of 3: 1-2-3, 4-5-6, ..., 34-35-36)
  const rows: number[][] = [];
  for (let i = 1; i <= 36; i += 3) {
    rows.push([i, i + 1, i + 2]);
  }

  return (
    <div className="w-full max-w-[520px]">
      {/* Zero */}
      <div className="grid grid-cols-3 gap-1 mb-1">
        <button
          onClick={() => placeBet("straight", [0])}
          disabled={disabled}
          className="col-span-3 bg-green-700 hover:bg-green-600 text-white text-sm font-bold py-2 rounded-sm relative transition-colors disabled:opacity-50"
        >
          0
          <ChipIndicator numbers={[0]} />
        </button>
      </div>

      {/* Number grid - 12 rows x 3 columns */}
      <div className="grid grid-cols-3 gap-1 mb-1">
        {rows.map((row) => row.map((num) => numberCell(num)))}
      </div>

      {/* Column bets */}
      <div className="grid grid-cols-3 gap-1 mb-2">
        {[1, 2, 3].map((col) => {
          const numbers = Array.from({ length: 12 }, (_, i) => i * 3 + col);
          return (
            <button
              key={`col-${col}`}
              onClick={() => placeBet("column", numbers)}
              disabled={disabled}
              className="bg-casino-elevated hover:bg-casino-hover border border-casino-border text-casino-text text-[10px] font-semibold py-1.5 rounded-sm relative transition-colors disabled:opacity-50"
            >
              Col {col}
              <ChipIndicator numbers={numbers} />
            </button>
          );
        })}
      </div>

      {/* Dozen bets */}
      <div className="grid grid-cols-3 gap-1 mb-1">
        {[
          { label: "1-12", value: 1 },
          { label: "13-24", value: 2 },
          { label: "25-36", value: 3 },
        ].map(({ label, value }) => {
          const numbers = Array.from(
            { length: 12 },
            (_, i) => i + 1 + (value - 1) * 12
          );
          return (
            <button
              key={label}
              onClick={() => placeBet("dozen", numbers)}
              disabled={disabled}
              className="bg-casino-elevated hover:bg-casino-hover border border-casino-border text-casino-text text-[10px] font-semibold py-1.5 rounded-sm relative transition-colors disabled:opacity-50"
            >
              {label}
              <ChipIndicator numbers={numbers} />
            </button>
          );
        })}
      </div>

      {/* Outside bets */}
      <div className="grid grid-cols-6 gap-1">
        {[
          {
            label: "1-18",
            type: "low" as BetType,
            numbers: Array.from({ length: 18 }, (_, i) => i + 1),
          },
          {
            label: "Even",
            type: "even" as BetType,
            numbers: Array.from({ length: 36 }, (_, i) => i + 1).filter(
              (n) => n % 2 === 0
            ),
          },
          {
            label: "Red",
            type: "red" as BetType,
            numbers: [...RED_NUMBERS],
            className: "bg-red-700 hover:bg-red-600 text-white",
          },
          {
            label: "Black",
            type: "black" as BetType,
            numbers: Array.from({ length: 36 }, (_, i) => i + 1).filter(
              (n) => !RED_NUMBERS.includes(n)
            ),
            className: "bg-gray-800 hover:bg-gray-700 text-white",
          },
          {
            label: "Odd",
            type: "odd" as BetType,
            numbers: Array.from({ length: 36 }, (_, i) => i + 1).filter(
              (n) => n % 2 === 1
            ),
          },
          {
            label: "19-36",
            type: "high" as BetType,
            numbers: Array.from({ length: 18 }, (_, i) => i + 19),
          },
        ].map(({ label, type, numbers, className }) => (
          <button
            key={label}
            onClick={() => placeBet(type, numbers)}
            disabled={disabled}
            className={`${
              className ??
              "bg-casino-elevated hover:bg-casino-hover border border-casino-border text-casino-text"
            } text-[10px] font-semibold py-2 rounded-sm relative transition-colors disabled:opacity-50`}
          >
            {label}
            <ChipIndicator numbers={numbers} />
          </button>
        ))}
      </div>
    </div>
  );
}
