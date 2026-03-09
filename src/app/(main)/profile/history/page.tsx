"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface GameEntry {
  id: string;
  gameType: string;
  betAmount: number;
  multiplier: number;
  payout: number;
  profit: number;
  serverSeedHash: string;
  nonce: number;
  fairnessMode: string;
  createdAt: string;
}

export default function GameHistoryPage() {
  const [games, setGames] = useState<GameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [gameFilter, setGameFilter] = useState("ALL");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (gameFilter !== "ALL") params.set("gameType", gameFilter);
      const res = await fetch(`/api/games/history?${params}`);
      const data = await res.json();
      setGames(data.games);
      setTotalPages(data.pages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, gameFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    setPage(1);
  }, [gameFilter]);

  const gameTypeColor = (type: string) => {
    switch (type) {
      case "MINES": return "text-casino-green";
      case "PLINKO": return "text-casino-orange";
      case "ROULETTE": return "text-casino-red";
      case "BLACKJACK": return "text-casino-blue";
      default: return "text-casino-text";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-casino-text">Game History</h1>
        <div className="flex gap-2">
          {["ALL", "MINES", "PLINKO", "ROULETTE", "BLACKJACK"].map((type) => (
            <button
              key={type}
              onClick={() => setGameFilter(type)}
              className={`px-3 py-1.5 text-xs rounded-casino border transition-colors ${
                gameFilter === type
                  ? "bg-casino-orange/20 border-casino-orange text-casino-orange"
                  : "bg-casino-surface border-casino-border text-casino-text-secondary hover:text-casino-text"
              }`}
            >
              {type === "ALL" ? "All" : type.charAt(0) + type.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-casino-surface border border-casino-border rounded-casino overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-casino-border">
              <th className="text-left px-4 py-3 text-casino-text-muted font-medium">Date</th>
              <th className="text-left px-4 py-3 text-casino-text-muted font-medium">Game</th>
              <th className="text-right px-4 py-3 text-casino-text-muted font-medium">Bet</th>
              <th className="text-right px-4 py-3 text-casino-text-muted font-medium">Multi</th>
              <th className="text-right px-4 py-3 text-casino-text-muted font-medium">Payout</th>
              <th className="text-right px-4 py-3 text-casino-text-muted font-medium">Profit</th>
              <th className="text-center px-4 py-3 text-casino-text-muted font-medium">Verify</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-casino-border">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-casino-elevated animate-pulse rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : games.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-casino-text-muted">No games found</td>
              </tr>
            ) : (
              games.map((g) => (
                <tr key={g.id} className="border-b border-casino-border hover:bg-casino-surface-light transition-colors">
                  <td className="px-4 py-3 text-casino-text-secondary text-xs">
                    {new Date(g.createdAt).toLocaleDateString()}{" "}
                    {new Date(g.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className={`px-4 py-3 font-medium ${gameTypeColor(g.gameType)}`}>
                    {g.gameType.charAt(0) + g.gameType.slice(1).toLowerCase()}
                  </td>
                  <td className="px-4 py-3 text-right text-casino-text">${g.betAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-casino-text-secondary">{g.multiplier.toFixed(2)}x</td>
                  <td className="px-4 py-3 text-right text-casino-text">${g.payout.toFixed(2)}</td>
                  <td className={`px-4 py-3 text-right ${g.profit >= 0 ? "text-casino-green" : "text-casino-red"}`}>
                    {g.profit >= 0 ? "+" : ""}${g.profit.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {g.fairnessMode === "PROVABLY_FAIR" ? (
                      <Link
                        href={`/provably-fair?hash=${g.serverSeedHash}&nonce=${g.nonce}&game=${g.gameType}`}
                        className="text-casino-orange hover:underline text-xs"
                      >
                        Verify
                      </Link>
                    ) : (
                      <span className="text-casino-text-muted text-xs">Custom</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm bg-casino-surface border border-casino-border rounded-casino text-casino-text-secondary hover:text-casino-text disabled:opacity-50 transition-colors"
          >
            Prev
          </button>
          <span className="text-sm text-casino-text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm bg-casino-surface border border-casino-border rounded-casino text-casino-text-secondary hover:text-casino-text disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
