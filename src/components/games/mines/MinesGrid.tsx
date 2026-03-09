"use client";

import { useMinesStore } from "@/stores/mines-store";
import MineTile from "./MineTile";

interface MinesGridProps {
  onReveal: (tileIndex: number) => void;
}

export default function MinesGrid({ onReveal }: MinesGridProps) {
  const { grid, isActive, isRevealing } = useMinesStore();

  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2 md:gap-2.5 w-full max-w-[min(520px,calc(100vh-320px))] mx-auto">
      {grid.map((state, index) => (
        <MineTile
          key={index}
          state={state}
          index={index}
          disabled={!isActive || isRevealing}
          onClick={() => onReveal(index)}
        />
      ))}
    </div>
  );
}
