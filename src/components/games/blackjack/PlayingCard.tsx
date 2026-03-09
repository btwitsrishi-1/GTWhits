"use client";

import { motion } from "framer-motion";

interface PlayingCardProps {
  suit: string;
  rank: string;
  faceDown?: boolean;
  delay?: number;
}

const suitSymbols: Record<string, string> = {
  hearts: "\u2665",
  diamonds: "\u2666",
  clubs: "\u2663",
  spades: "\u2660",
};

const suitColors: Record<string, string> = {
  hearts: "text-red-500",
  diamonds: "text-red-500",
  clubs: "text-white",
  spades: "text-white",
};

export default function PlayingCard({
  suit,
  rank,
  faceDown = false,
  delay = 0,
}: PlayingCardProps) {
  const symbol = suitSymbols[suit] || "";
  const color = suitColors[suit] || "text-white";

  return (
    <motion.div
      initial={{ x: 100, rotateY: 180, opacity: 0 }}
      animate={{ x: 0, rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay, type: "spring", damping: 15 }}
      className="w-[60px] h-[84px] rounded-lg overflow-hidden shadow-lg flex-shrink-0"
      style={{ perspective: "600px" }}
    >
      {faceDown ? (
        <div className="w-full h-full bg-gradient-to-br from-blue-800 to-blue-950 border-2 border-blue-700 rounded-lg flex items-center justify-center">
          <div className="w-[44px] h-[68px] border border-blue-600 rounded-md bg-blue-900/50 flex items-center justify-center">
            <span className="text-blue-400 text-lg font-bold">?</span>
          </div>
        </div>
      ) : (
        <div className="w-full h-full bg-white border-2 border-gray-300 rounded-lg p-1 flex flex-col justify-between">
          <div className={`flex items-center gap-0.5 ${color}`}>
            <span className="text-[11px] font-bold leading-none">{rank}</span>
            <span className="text-[10px] leading-none">{symbol}</span>
          </div>
          <div className={`flex items-center justify-center ${color}`}>
            <span className="text-2xl">{symbol}</span>
          </div>
          <div className={`flex items-center gap-0.5 self-end rotate-180 ${color}`}>
            <span className="text-[11px] font-bold leading-none">{rank}</span>
            <span className="text-[10px] leading-none">{symbol}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
