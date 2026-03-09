"use client";

import { useEffect, useState } from "react";

interface Stats {
  totalUsers: number;
  totalBetsToday: number;
  totalWagered: number;
  houseProfit: number;
  activeGames: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats
    ? [
        { label: "Total Users", value: stats.totalUsers.toLocaleString(), color: "text-casino-blue" },
        { label: "Bets Today", value: stats.totalBetsToday.toLocaleString(), color: "text-casino-green" },
        { label: "Total Wagered", value: `$${stats.totalWagered.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "text-casino-orange" },
        { label: "House Profit", value: `$${stats.houseProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: stats.houseProfit >= 0 ? "text-casino-green" : "text-casino-red" },
        { label: "Active Games", value: stats.activeGames.toLocaleString(), color: "text-casino-text" },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-casino-text mb-6">Dashboard</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-casino-surface border border-casino-border rounded-casino p-4 animate-pulse">
              <div className="h-4 bg-casino-surface-light rounded w-20 mb-2" />
              <div className="h-8 bg-casino-surface-light rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="bg-casino-surface border border-casino-border rounded-casino p-4">
              <p className="text-xs text-casino-text-muted uppercase tracking-wider mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
