"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { create } from "zustand";

interface BigWinState {
  show: boolean;
  multiplier: number;
  amount: number;
  triggerBigWin: (multiplier: number, amount: number, game?: string) => void;
  dismiss: () => void;
}

export const useBigWinStore = create<BigWinState>((set) => ({
  show: false,
  multiplier: 0,
  amount: 0,
  triggerBigWin: (multiplier, amount, game) => {
    set({ show: true, multiplier, amount });
    // Broadcast to chat via Socket.io
    try {
      const { getSocket } = require("@/lib/socket/client");
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit("chat:bigwin", {
          multiplier,
          amount,
          game: game || "Unknown",
        });
      }
    } catch {
      // Socket not available, skip broadcast
    }
  },
  dismiss: () => set({ show: false }),
}));

function Particle({ delay, x, y }: { delay: number; x: number; y: number }) {
  const colors = ["#00E701", "#FF9500", "#FFD700", "#00E701", "#FFFFFF"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = 4 + Math.random() * 8;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{ backgroundColor: color, width: size, height: size }}
      initial={{ opacity: 1, x: 0, y: 0 }}
      animate={{
        opacity: [1, 1, 0],
        x: [0, x * (0.5 + Math.random())],
        y: [0, y * (0.5 + Math.random())],
        scale: [1, 1.5, 0],
      }}
      transition={{ duration: 2 + Math.random(), delay, ease: "easeOut" }}
    />
  );
}

export default function BigWinOverlay() {
  const { show, multiplier, amount, dismiss } = useBigWinStore();
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

  useEffect(() => {
    if (show) {
      const newParticles = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 0.5) * 600,
        delay: Math.random() * 0.5,
      }));
      setParticles(newParticles);

      const timer = setTimeout(dismiss, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, dismiss]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop glow */}
          <motion.div
            className="absolute inset-0 bg-casino-green/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 2, repeat: 1 }}
          />

          {/* Particles */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {particles.map((p) => (
              <Particle key={p.id} delay={p.delay} x={p.x} y={p.y} />
            ))}
          </div>

          {/* Win display */}
          <motion.div
            className="relative text-center pointer-events-auto cursor-pointer"
            onClick={dismiss}
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
          >
            <motion.div
              className="text-lg font-bold text-casino-orange mb-1 tracking-wider"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              BIG WIN!
            </motion.div>
            <motion.div
              className="text-5xl md:text-7xl font-black text-casino-green drop-shadow-[0_0_30px_rgba(0,231,1,0.5)]"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: [0.5, 1.1, 1] }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {multiplier.toFixed(2)}x
            </motion.div>
            <motion.div
              className="text-2xl md:text-3xl font-bold text-casino-text mt-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              +${amount.toFixed(2)}
            </motion.div>
            <motion.p
              className="text-casino-text-muted text-xs mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              Click to dismiss
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
