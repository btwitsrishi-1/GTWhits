"use client";

import { motion } from "framer-motion";
import { TileState } from "@/stores/mines-store";

interface MineTileProps {
  state: TileState;
  index: number;
  disabled: boolean;
  onClick: () => void;
}

export default function MineTile({ state, index, disabled, onClick }: MineTileProps) {
  const isRevealed = state !== "hidden";

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isRevealed}
      className="aspect-square relative rounded-lg sm:rounded-xl overflow-hidden"
      whileHover={!disabled && !isRevealed ? { scale: 1.05 } : {}}
      whileTap={!disabled && !isRevealed ? { scale: 0.95 } : {}}
    >
      {/* Hidden tile */}
      {state === "hidden" && (
        <div
          className={`w-full h-full bg-casino-elevated border border-casino-border rounded-lg sm:rounded-xl flex items-center justify-center transition-colors ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-casino-hover hover:border-casino-text-muted cursor-pointer"
          }`}
        >
          <div className="w-[18%] h-[18%] min-w-[6px] min-h-[6px] max-w-[12px] max-h-[12px] rounded-full bg-casino-border" />
        </div>
      )}

      {/* Gem revealed */}
      {state === "gem" && (
        <motion.div
          initial={{ rotateY: 180, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ duration: 0.4, type: "spring", damping: 15 }}
          className="w-full h-full bg-casino-green/20 border-2 border-casino-green rounded-lg sm:rounded-xl flex items-center justify-center"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", damping: 10 }}
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl"
          >
            💎
          </motion.span>
        </motion.div>
      )}

      {/* Mine revealed */}
      {state === "mine" && (
        <motion.div
          initial={{ rotateY: 180, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ duration: 0.4, type: "spring", damping: 15 }}
          className="w-full h-full bg-casino-red/20 border-2 border-casino-red rounded-lg sm:rounded-xl flex items-center justify-center"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", damping: 10 }}
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl"
          >
            💣
          </motion.span>
        </motion.div>
      )}
    </motion.button>
  );
}
