"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const games = [
  {
    name: "Mines",
    description: "Uncover gems, avoid mines",
    href: "/games/mines",
    gradient: "from-emerald-600 to-green-800",
    icon: "💎",
  },
  {
    name: "Plinko",
    description: "Drop the ball, win big",
    href: "/games/plinko",
    gradient: "from-orange-500 to-amber-700",
    icon: "🔴",
  },
  {
    name: "Roulette",
    description: "Spin the wheel of fortune",
    href: "/games/roulette",
    gradient: "from-red-600 to-rose-800",
    icon: "🎰",
  },
  {
    name: "Blackjack",
    description: "Beat the dealer to 21",
    href: "/games/blackjack",
    gradient: "from-blue-600 to-indigo-800",
    icon: "🃏",
  },
];

export default function CasinoPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-casino-text mb-2">Welcome to CasinoR</h1>
        <p className="text-casino-text-secondary text-lg">Choose a game to start playing</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {games.map((game, i) => (
          <motion.div
            key={game.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link href={game.href}>
              <motion.div
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`bg-gradient-to-br ${game.gradient} rounded-casino-lg p-6 h-44 flex flex-col justify-between cursor-pointer shadow-lg hover:shadow-2xl transition-shadow`}
              >
                <span className="text-4xl">{game.icon}</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">{game.name}</h2>
                  <p className="text-white/70 text-sm mt-1">{game.description}</p>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
