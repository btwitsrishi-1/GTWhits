"use client";

import { motion, AnimatePresence } from "framer-motion";

interface GameResultProps {
  show: boolean;
  won: boolean;
  multiplier: number;
  profit: number;
  onClose: () => void;
}

export default function GameResult({ show, won, multiplier, profit, onClose }: GameResultProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 rounded-casino"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", damping: 10 }}
              className={`text-6xl font-bold mb-2 ${
                won ? "text-casino-green" : "text-casino-red"
              }`}
            >
              {won ? `${multiplier.toFixed(2)}x` : "0.00x"}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`text-2xl font-semibold mb-4 ${
                won ? "text-casino-green" : "text-casino-red"
              }`}
            >
              {won
                ? `+$${profit.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                : `-$${Math.abs(profit).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-casino-text-muted text-sm"
            >
              Click anywhere to continue
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
