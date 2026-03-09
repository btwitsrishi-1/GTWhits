"use client";

import { useRouletteStore } from "@/stores/roulette-store";

const CHIP_VALUES = [1, 5, 10, 25, 100, 500];

export default function ChipSelector() {
  const { selectedChip, setSelectedChip } = useRouletteStore();

  return (
    <div>
      <label className="text-xs text-casino-text-muted mb-1.5 block">
        Chip Value
      </label>
      <div className="grid grid-cols-3 gap-1.5">
        {CHIP_VALUES.map((value) => (
          <button
            key={value}
            onClick={() => setSelectedChip(value)}
            className={`py-1.5 text-xs rounded-casino border transition-colors ${
              selectedChip === value
                ? "bg-casino-orange/20 border-casino-orange text-casino-orange"
                : "bg-casino-bg border-casino-border text-casino-text-secondary hover:text-casino-text hover:border-casino-text-muted"
            }`}
          >
            ${value}
          </button>
        ))}
      </div>
    </div>
  );
}
