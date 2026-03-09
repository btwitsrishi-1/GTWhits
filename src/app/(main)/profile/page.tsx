"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUserStore } from "@/stores/user-store";

interface ProfileStats {
  totalGames: number;
  totalWagered: number;
  totalProfit: number;
  gamesWon: number;
  gamesLost: number;
  biggestWin: number;
  favoriteGame: string | null;
}

export default function ProfilePage() {
  const { username, balance } = useUserStore();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statItems = stats
    ? [
        { label: "Total Games", value: stats.totalGames.toLocaleString() },
        { label: "Total Wagered", value: `$${stats.totalWagered.toFixed(2)}` },
        {
          label: "Net Profit",
          value: `${stats.totalProfit >= 0 ? "+" : ""}$${stats.totalProfit.toFixed(2)}`,
          color: stats.totalProfit >= 0 ? "text-casino-green" : "text-casino-red",
        },
        { label: "Win Rate", value: stats.totalGames > 0 ? `${((stats.gamesWon / stats.totalGames) * 100).toFixed(1)}%` : "0%" },
        { label: "Biggest Win", value: `$${stats.biggestWin.toFixed(2)}`, color: "text-casino-green" },
        { label: "Favorite Game", value: stats.favoriteGame ? stats.favoriteGame.charAt(0) + stats.favoriteGame.slice(1).toLowerCase() : "N/A" },
      ]
    : [];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile header */}
      <div className="bg-casino-surface border border-casino-border rounded-casino p-6 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-casino-orange/20 flex items-center justify-center text-casino-orange text-2xl font-bold">
            {username?.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-casino-text">{username}</h1>
            <p className="text-sm text-casino-text-muted">
              Balance: <span className="text-casino-green font-semibold">${balance.toFixed(2)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-casino-surface border border-casino-border rounded-casino p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {statItems.map((item) => (
            <div key={item.label} className="bg-casino-surface border border-casino-border rounded-casino p-4">
              <p className="text-xs text-casino-text-muted uppercase tracking-wider mb-1">{item.label}</p>
              <p className={`text-lg font-bold ${item.color || "text-casino-text"}`}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="space-y-2">
        <Link
          href="/profile/history"
          className="flex items-center justify-between bg-casino-surface border border-casino-border rounded-casino p-4 hover:bg-casino-surface-light transition-colors"
        >
          <div>
            <p className="text-sm font-medium text-casino-text">Game History</p>
            <p className="text-xs text-casino-text-muted">View all past games and results</p>
          </div>
          <svg className="w-5 h-5 text-casino-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <Link
          href="/provably-fair"
          className="flex items-center justify-between bg-casino-surface border border-casino-border rounded-casino p-4 hover:bg-casino-surface-light transition-colors"
        >
          <div>
            <p className="text-sm font-medium text-casino-text">Provably Fair</p>
            <p className="text-xs text-casino-text-muted">Manage seeds and verify outcomes</p>
          </div>
          <svg className="w-5 h-5 text-casino-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <Link
          href="/wallet"
          className="flex items-center justify-between bg-casino-surface border border-casino-border rounded-casino p-4 hover:bg-casino-surface-light transition-colors"
        >
          <div>
            <p className="text-sm font-medium text-casino-text">Wallet</p>
            <p className="text-xs text-casino-text-muted">Deposit funds and view transactions</p>
          </div>
          <svg className="w-5 h-5 text-casino-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
