"use client";

import { motion } from "framer-motion";
import { getPlinkoMultiplierTable, type PlinkoRisk, type PlinkoRows } from "@/lib/games/plinko";

interface MultiplierSlotsProps {
  rows: PlinkoRows;
  risk: PlinkoRisk;
  activeSlot: number | null;
}

function getSlotColor(multiplier: number): string {
  if (multiplier >= 100) return "bg-red-500/80 text-white";
  if (multiplier >= 10) return "bg-orange-500/80 text-white";
  if (multiplier >= 2) return "bg-yellow-500/80 text-black";
  if (multiplier >= 1) return "bg-casino-green/60 text-white";
  return "bg-casino-elevated text-casino-text-muted";
}

export default function MultiplierSlots({ rows, risk, activeSlot }: MultiplierSlotsProps) {
  const multipliers = getPlinkoMultiplierTable(rows, risk);

  return (
    <div className="flex gap-0.5 justify-center w-full max-w-[560px]">
      {multipliers.map((mult, index) => {
        const isActive = activeSlot === index;
        return (
          <motion.div
            key={index}
            className={`flex-1 text-center py-1.5 rounded text-[10px] sm:text-xs font-bold transition-all ${getSlotColor(mult)} ${
              isActive ? "ring-2 ring-white scale-110 z-10" : ""
            }`}
            animate={
              isActive
                ? {
                    scale: [1, 1.15, 1.1],
                    transition: { duration: 0.3 },
                  }
                : {}
            }
          >
            {mult}x
          </motion.div>
        );
      })}
    </div>
  );
}
