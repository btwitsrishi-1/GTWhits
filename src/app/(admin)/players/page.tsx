"use client";

import { useEffect, useState, useCallback } from "react";

interface Player {
  id: string;
  username: string;
  email: string;
  role: string;
  balance: number;
  totalBets: number;
  totalWagered: number;
  totalProfit: number;
  createdAt: string;
}

interface PlayerDetail {
  id: string;
  username: string;
  email: string;
  balance: number;
  gameSessions: {
    id: string;
    gameType: string;
    betAmount: number;
    multiplier: number;
    payout: number;
    profit: number;
    state: string;
    createdAt: string;
  }[];
  forcedOutcomes: {
    id: string;
    gameType: string;
    outcomeType: string;
    multiplierOverride: number | null;
    createdBy: string;
    createdAt: string;
  }[];
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PlayerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Force outcome form
  const [forceGame, setForceGame] = useState("MINES");
  const [forceOutcome, setForceOutcome] = useState("WIN");
  const [forceMultiplier, setForceMultiplier] = useState("");
  const [forceSaving, setForceSaving] = useState(false);

  // Balance adjust
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "remove">("add");
  const [adjustSaving, setAdjustSaving] = useState(false);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/players?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setPlayers(data.players);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const selectPlayer = async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/players/${id}`);
      const data = await res.json();
      setSelected(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const queueForcedOutcome = async () => {
    if (!selected) return;
    setForceSaving(true);
    try {
      const res = await fetch("/api/admin/forced-outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selected.id,
          gameType: forceGame,
          outcomeType: forceOutcome,
          multiplierOverride: forceMultiplier ? parseFloat(forceMultiplier) : null,
        }),
      });
      if (res.ok) {
        await selectPlayer(selected.id); // Refresh
        setForceMultiplier("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setForceSaving(false);
    }
  };

  const adjustBalance = async () => {
    if (!selected || !adjustAmount) return;
    setAdjustSaving(true);
    try {
      const res = await fetch(`/api/admin/players/${selected.id}/balance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(adjustAmount), type: adjustType }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelected((prev) => (prev ? { ...prev, balance: data.balance } : null));
        setPlayers((prev) =>
          prev.map((p) => (p.id === selected.id ? { ...p, balance: data.balance } : p))
        );
        setAdjustAmount("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAdjustSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-casino-text mb-6">Player Management</h1>

      <div className="flex gap-6">
        {/* Player list */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-casino-surface border border-casino-border rounded-casino px-4 py-2.5 text-sm text-casino-text mb-4 focus:outline-none focus:border-casino-orange"
          />

          <div className="bg-casino-surface border border-casino-border rounded-casino overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-casino-border">
                  <th className="text-left px-4 py-3 text-casino-text-muted font-medium">User</th>
                  <th className="text-right px-4 py-3 text-casino-text-muted font-medium">Balance</th>
                  <th className="text-right px-4 py-3 text-casino-text-muted font-medium">Wagered</th>
                  <th className="text-right px-4 py-3 text-casino-text-muted font-medium">Profit</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-casino-text-muted">Loading...</td>
                  </tr>
                ) : players.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-casino-text-muted">No players found</td>
                  </tr>
                ) : (
                  players.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => selectPlayer(p.id)}
                      className={`border-b border-casino-border cursor-pointer transition-colors hover:bg-casino-surface-light ${
                        selected?.id === p.id ? "bg-casino-surface-light" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="text-casino-text font-medium">{p.username}</div>
                        <div className="text-casino-text-muted text-xs">{p.email}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-casino-text">${p.balance.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-casino-text-secondary">${p.totalWagered.toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right ${p.totalProfit >= 0 ? "text-casino-green" : "text-casino-red"}`}>
                        {p.totalProfit >= 0 ? "+" : ""}${p.totalProfit.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Player detail panel */}
        {selected && (
          <div className="w-80 space-y-4">
            {loadingDetail ? (
              <div className="bg-casino-surface border border-casino-border rounded-casino p-4 animate-pulse">
                <div className="h-6 bg-casino-surface-light rounded w-32 mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-casino-surface-light rounded w-full" />
                  <div className="h-4 bg-casino-surface-light rounded w-24" />
                </div>
              </div>
            ) : (
              <>
                {/* Player info */}
                <div className="bg-casino-surface border border-casino-border rounded-casino p-4">
                  <h3 className="text-lg font-semibold text-casino-text mb-2">{selected.username}</h3>
                  <p className="text-sm text-casino-text-muted mb-1">{selected.email}</p>
                  <p className="text-sm text-casino-text">
                    Balance: <span className="font-bold text-casino-green">${selected.balance.toFixed(2)}</span>
                  </p>
                </div>

                {/* Adjust Balance */}
                <div className="bg-casino-surface border border-casino-border rounded-casino p-4">
                  <h4 className="text-sm font-semibold text-casino-text-secondary uppercase tracking-wider mb-3">Adjust Balance</h4>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setAdjustType("add")}
                      className={`flex-1 py-1.5 text-xs rounded-casino border transition-colors ${
                        adjustType === "add"
                          ? "bg-casino-green/20 border-casino-green text-casino-green"
                          : "bg-casino-bg border-casino-border text-casino-text-secondary"
                      }`}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setAdjustType("remove")}
                      className={`flex-1 py-1.5 text-xs rounded-casino border transition-colors ${
                        adjustType === "remove"
                          ? "bg-casino-red/20 border-casino-red text-casino-red"
                          : "bg-casino-bg border-casino-border text-casino-text-secondary"
                      }`}
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="w-full bg-casino-bg border border-casino-border rounded-casino px-3 py-1.5 text-sm text-casino-text mb-2 focus:outline-none focus:border-casino-orange"
                  />
                  <button
                    onClick={adjustBalance}
                    disabled={adjustSaving || !adjustAmount}
                    className="w-full bg-casino-orange hover:opacity-90 text-casino-bg text-sm font-semibold py-1.5 rounded-casino transition-colors disabled:opacity-50"
                  >
                    {adjustSaving ? "Saving..." : "Apply"}
                  </button>
                </div>

                {/* Force Outcome */}
                <div className="bg-casino-surface border border-casino-border rounded-casino p-4">
                  <h4 className="text-sm font-semibold text-casino-text-secondary uppercase tracking-wider mb-3">Force Outcome</h4>
                  <select
                    value={forceGame}
                    onChange={(e) => setForceGame(e.target.value)}
                    className="w-full bg-casino-bg border border-casino-border rounded-casino px-3 py-1.5 text-sm text-casino-text mb-2 focus:outline-none focus:border-casino-orange"
                  >
                    <option value="MINES">Mines</option>
                    <option value="PLINKO">Plinko</option>
                    <option value="ROULETTE">Roulette</option>
                    <option value="BLACKJACK">Blackjack</option>
                  </select>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setForceOutcome("WIN")}
                      className={`flex-1 py-1.5 text-xs rounded-casino border transition-colors ${
                        forceOutcome === "WIN"
                          ? "bg-casino-green/20 border-casino-green text-casino-green"
                          : "bg-casino-bg border-casino-border text-casino-text-secondary"
                      }`}
                    >
                      Win
                    </button>
                    <button
                      onClick={() => setForceOutcome("LOSS")}
                      className={`flex-1 py-1.5 text-xs rounded-casino border transition-colors ${
                        forceOutcome === "LOSS"
                          ? "bg-casino-red/20 border-casino-red text-casino-red"
                          : "bg-casino-bg border-casino-border text-casino-text-secondary"
                      }`}
                    >
                      Loss
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Multiplier override (optional)"
                    value={forceMultiplier}
                    onChange={(e) => setForceMultiplier(e.target.value)}
                    className="w-full bg-casino-bg border border-casino-border rounded-casino px-3 py-1.5 text-sm text-casino-text mb-2 focus:outline-none focus:border-casino-orange"
                  />
                  <button
                    onClick={queueForcedOutcome}
                    disabled={forceSaving}
                    className="w-full bg-casino-red hover:opacity-90 text-white text-sm font-semibold py-1.5 rounded-casino transition-colors disabled:opacity-50"
                  >
                    {forceSaving ? "Queuing..." : "Queue Forced Outcome"}
                  </button>

                  {/* Active forced outcomes */}
                  {selected.forcedOutcomes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-casino-border">
                      <p className="text-xs text-casino-text-muted mb-2">Pending:</p>
                      {selected.forcedOutcomes.map((fo) => (
                        <div key={fo.id} className="flex justify-between text-xs mb-1">
                          <span className="text-casino-text-secondary">{fo.gameType}</span>
                          <span className={fo.outcomeType === "WIN" ? "text-casino-green" : "text-casino-red"}>
                            {fo.outcomeType}
                            {fo.multiplierOverride ? ` (${fo.multiplierOverride}x)` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent games */}
                <div className="bg-casino-surface border border-casino-border rounded-casino p-4">
                  <h4 className="text-sm font-semibold text-casino-text-secondary uppercase tracking-wider mb-3">Recent Games</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selected.gameSessions.length === 0 ? (
                      <p className="text-xs text-casino-text-muted">No games played</p>
                    ) : (
                      selected.gameSessions.slice(0, 20).map((gs) => (
                        <div key={gs.id} className="flex justify-between text-xs">
                          <div>
                            <span className="text-casino-text-secondary">{gs.gameType}</span>
                            <span className="text-casino-text-muted ml-2">${gs.betAmount.toFixed(2)}</span>
                          </div>
                          <span className={gs.profit >= 0 ? "text-casino-green" : "text-casino-red"}>
                            {gs.profit >= 0 ? "+" : ""}${gs.profit.toFixed(2)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
