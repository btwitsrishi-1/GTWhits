"use client";

import { motion, AnimatePresence } from "framer-motion";

interface MultiplierDisplayProps {
  multiplier: number;
  show?: boolean;
}

export default function MultiplierDisplay({ multiplier, show = true }: MultiplierDisplayProps) {
  const color =
    multiplier >= 10
      ? "text-casino-orange"
      : multiplier >= 2
        ? "text-casino-green"
        : "text-casino-text";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={multiplier}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <span className={`text-5xl font-bold ${color} tabular-nums`}>
            {multiplier.toFixed(2)}x
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
