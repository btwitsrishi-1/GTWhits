"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  verifyServerSeedHash,
  verifyMines,
  verifyPlinko,
  verifyRoulette,
  verifyBlackjack,
} from "@/lib/games/verify";
import { useToastStore } from "@/stores/toast-store";
import { useSiteConfigStore } from "@/stores/site-config-store";

interface SeedInfo {
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

interface PreviousSeed {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

export default function ProvablyFairPage() {
  const router = useRouter();
  const { showProvablyFair, loaded: siteConfigLoaded } = useSiteConfigStore();

  useEffect(() => {
    if (siteConfigLoaded && !showProvablyFair) {
      router.replace("/casino");
    }
  }, [siteConfigLoaded, showProvablyFair, router]);

  const [seedInfo, setSeedInfo] = useState<SeedInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [previousSeed, setPreviousSeed] = useState<PreviousSeed | null>(null);
  const [editClientSeed, setEditClientSeed] = useState("");
  const [savingClient, setSavingClient] = useState(false);

  // Verification calculator state
  const [vServerSeed, setVServerSeed] = useState("");
  const [vClientSeed, setVClientSeed] = useState("");
  const [vNonce, setVNonce] = useState("");
  const [vGame, setVGame] = useState("MINES");
  const [vParam, setVParam] = useState("3");
  const [verifyResult, setVerifyResult] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [hashValid, setHashValid] = useState<boolean | null>(null);
  const [vHash, setVHash] = useState("");

  const fetchSeedInfo = useCallback(async () => {
    try {
      const res = await fetch("/api/seeds");
      const data = await res.json();
      setSeedInfo(data);
      setEditClientSeed(data.clientSeed);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeedInfo();
  }, [fetchSeedInfo]);

  const rotateSeed = async () => {
    setRotating(true);
    try {
      const res = await fetch("/api/seeds/rotate", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setPreviousSeed(data.previousSeed);
        setSeedInfo({
          serverSeedHash: data.newSeed.serverSeedHash,
          clientSeed: data.newSeed.clientSeed,
          nonce: data.newSeed.nonce,
        });
        setEditClientSeed(data.newSeed.clientSeed);
      } else {
        useToastStore.getState().addToast(data.error || "Failed to rotate", "error");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRotating(false);
    }
  };

  const updateClientSeed = async () => {
    setSavingClient(true);
    try {
      const res = await fetch("/api/seeds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientSeed: editClientSeed }),
      });
      if (res.ok) {
        setSeedInfo((prev) => prev ? { ...prev, clientSeed: editClientSeed } : null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingClient(false);
    }
  };

  const runVerification = async () => {
    if (!vServerSeed || !vClientSeed || !vNonce) return;
    setVerifying(true);
    setVerifyResult(null);
    setHashValid(null);

    try {
      const nonce = parseInt(vNonce);

      // Verify hash if provided
      if (vHash) {
        const valid = await verifyServerSeedHash(vServerSeed, vHash);
        setHashValid(valid);
      }

      let result = "";
      switch (vGame) {
        case "MINES": {
          const mineCount = parseInt(vParam) || 3;
          const positions = await verifyMines(vServerSeed, vClientSeed, nonce, mineCount);
          result = `Mine positions: [${positions.join(", ")}]\n(Grid positions 0-24, left-to-right, top-to-bottom)`;
          break;
        }
        case "PLINKO": {
          const rows = parseInt(vParam) || 16;
          const { path, slotIndex } = await verifyPlinko(vServerSeed, vClientSeed, nonce, rows);
          result = `Path: [${path.map((d) => (d === 0 ? "L" : "R")).join(", ")}]\nSlot index: ${slotIndex}`;
          break;
        }
        case "ROULETTE": {
          const number = await verifyRoulette(vServerSeed, vClientSeed, nonce);
          result = `Winning number: ${number}`;
          break;
        }
        case "BLACKJACK": {
          const deck = await verifyBlackjack(vServerSeed, vClientSeed, nonce);
          result = `First 10 cards dealt:\n${deck.slice(0, 10).map((c, i) => `${i + 1}. ${c}`).join("\n")}`;
          break;
        }
      }

      setVerifyResult(result);
    } catch (e) {
      setVerifyResult("Verification error: " + String(e));
    } finally {
      setVerifying(false);
    }
  };

  const gameParams: Record<string, { label: string; placeholder: string }> = {
    MINES: { label: "Mine Count", placeholder: "1-24" },
    PLINKO: { label: "Rows", placeholder: "8, 12, or 16" },
    ROULETTE: { label: "", placeholder: "" },
    BLACKJACK: { label: "", placeholder: "" },
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-casino-text mb-2">Provably Fair</h1>
      <p className="text-sm text-casino-text-muted mb-6">
        Every game outcome is determined by a combination of server seed, client seed, and nonce using HMAC-SHA256.
        You can verify any past game by entering the seeds below.
      </p>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-casino-surface border border-casino-border rounded-casino p-6 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Current Seed Info */}
          <div className="bg-casino-surface border border-casino-border rounded-casino p-6">
            <h2 className="text-lg font-semibold text-casino-text mb-4">Active Seeds</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-casino-text-muted uppercase tracking-wider">Server Seed Hash</label>
                <p className="text-sm text-casino-text font-mono break-all bg-casino-bg rounded-casino px-3 py-2 mt-1">
                  {seedInfo?.serverSeedHash}
                </p>
                <p className="text-xs text-casino-text-muted mt-1">
                  The server seed is hidden. Rotate to reveal it and verify past games.
                </p>
              </div>
              <div>
                <label className="text-xs text-casino-text-muted uppercase tracking-wider">Client Seed</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={editClientSeed}
                    onChange={(e) => setEditClientSeed(e.target.value)}
                    className="flex-1 bg-casino-bg border border-casino-border rounded-casino px-3 py-2 text-sm text-casino-text font-mono focus:outline-none focus:border-casino-orange"
                  />
                  <button
                    onClick={updateClientSeed}
                    disabled={savingClient || editClientSeed === seedInfo?.clientSeed}
                    className="px-4 py-2 bg-casino-orange hover:opacity-90 text-casino-bg text-sm font-semibold rounded-casino transition-colors disabled:opacity-50"
                  >
                    {savingClient ? "..." : "Save"}
                  </button>
                </div>
              </div>
              <div className="flex gap-6">
                <div>
                  <label className="text-xs text-casino-text-muted uppercase tracking-wider">Nonce</label>
                  <p className="text-sm text-casino-text font-mono mt-1">{seedInfo?.nonce}</p>
                </div>
              </div>
              <button
                onClick={rotateSeed}
                disabled={rotating}
                className="w-full mt-2 bg-casino-green hover:opacity-90 text-casino-bg text-sm font-semibold py-2.5 rounded-casino transition-colors disabled:opacity-50"
              >
                {rotating ? "Rotating..." : "Rotate Seeds"}
              </button>
              <p className="text-xs text-casino-text-muted">
                Rotating reveals your current server seed and generates a new pair. Cannot rotate during active games.
              </p>
            </div>
          </div>

          {/* Previous Seed (shown after rotation) */}
          {previousSeed && (
            <div className="bg-casino-surface border border-casino-green/30 rounded-casino p-6">
              <h2 className="text-lg font-semibold text-casino-green mb-4">Previous Seed Revealed</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-casino-text-muted uppercase tracking-wider">Server Seed</label>
                  <p className="text-sm text-casino-green font-mono break-all bg-casino-bg rounded-casino px-3 py-2 mt-1">
                    {previousSeed.serverSeed}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-casino-text-muted uppercase tracking-wider">Server Seed Hash</label>
                  <p className="text-sm text-casino-text font-mono break-all bg-casino-bg rounded-casino px-3 py-2 mt-1">
                    {previousSeed.serverSeedHash}
                  </p>
                </div>
                <div className="flex gap-6">
                  <div>
                    <label className="text-xs text-casino-text-muted uppercase tracking-wider">Client Seed</label>
                    <p className="text-sm text-casino-text font-mono mt-1">{previousSeed.clientSeed}</p>
                  </div>
                  <div>
                    <label className="text-xs text-casino-text-muted uppercase tracking-wider">Final Nonce</label>
                    <p className="text-sm text-casino-text font-mono mt-1">{previousSeed.nonce}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setVServerSeed(previousSeed.serverSeed);
                    setVClientSeed(previousSeed.clientSeed);
                    setVHash(previousSeed.serverSeedHash);
                    setVNonce("1");
                  }}
                  className="text-sm text-casino-orange hover:underline"
                >
                  Use in verification calculator below
                </button>
              </div>
            </div>
          )}

          {/* Verification Calculator */}
          <div className="bg-casino-surface border border-casino-border rounded-casino p-6">
            <h2 className="text-lg font-semibold text-casino-text mb-4">Verification Calculator</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-casino-text-muted uppercase tracking-wider">Server Seed</label>
                <input
                  type="text"
                  value={vServerSeed}
                  onChange={(e) => setVServerSeed(e.target.value)}
                  placeholder="Enter revealed server seed"
                  className="w-full bg-casino-bg border border-casino-border rounded-casino px-3 py-2 text-sm text-casino-text font-mono mt-1 focus:outline-none focus:border-casino-orange"
                />
              </div>
              <div>
                <label className="text-xs text-casino-text-muted uppercase tracking-wider">
                  Server Seed Hash <span className="normal-case">(optional, to verify match)</span>
                </label>
                <input
                  type="text"
                  value={vHash}
                  onChange={(e) => setVHash(e.target.value)}
                  placeholder="Enter server seed hash to verify"
                  className="w-full bg-casino-bg border border-casino-border rounded-casino px-3 py-2 text-sm text-casino-text font-mono mt-1 focus:outline-none focus:border-casino-orange"
                />
              </div>
              <div>
                <label className="text-xs text-casino-text-muted uppercase tracking-wider">Client Seed</label>
                <input
                  type="text"
                  value={vClientSeed}
                  onChange={(e) => setVClientSeed(e.target.value)}
                  placeholder="Enter client seed"
                  className="w-full bg-casino-bg border border-casino-border rounded-casino px-3 py-2 text-sm text-casino-text font-mono mt-1 focus:outline-none focus:border-casino-orange"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-casino-text-muted uppercase tracking-wider">Nonce</label>
                  <input
                    type="number"
                    value={vNonce}
                    onChange={(e) => setVNonce(e.target.value)}
                    placeholder="Game nonce"
                    className="w-full bg-casino-bg border border-casino-border rounded-casino px-3 py-2 text-sm text-casino-text font-mono mt-1 focus:outline-none focus:border-casino-orange"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-casino-text-muted uppercase tracking-wider">Game</label>
                  <select
                    value={vGame}
                    onChange={(e) => setVGame(e.target.value)}
                    className="w-full bg-casino-bg border border-casino-border rounded-casino px-3 py-2 text-sm text-casino-text mt-1 focus:outline-none focus:border-casino-orange"
                  >
                    <option value="MINES">Mines</option>
                    <option value="PLINKO">Plinko</option>
                    <option value="ROULETTE">Roulette</option>
                    <option value="BLACKJACK">Blackjack</option>
                  </select>
                </div>
                {gameParams[vGame]?.label && (
                  <div className="flex-1">
                    <label className="text-xs text-casino-text-muted uppercase tracking-wider">
                      {gameParams[vGame].label}
                    </label>
                    <input
                      type="number"
                      value={vParam}
                      onChange={(e) => setVParam(e.target.value)}
                      placeholder={gameParams[vGame].placeholder}
                      className="w-full bg-casino-bg border border-casino-border rounded-casino px-3 py-2 text-sm text-casino-text font-mono mt-1 focus:outline-none focus:border-casino-orange"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={runVerification}
                disabled={verifying || !vServerSeed || !vClientSeed || !vNonce}
                className="w-full bg-casino-orange hover:opacity-90 text-casino-bg text-sm font-semibold py-2.5 rounded-casino transition-colors disabled:opacity-50"
              >
                {verifying ? "Verifying..." : "Verify"}
              </button>

              {/* Hash validation result */}
              {hashValid !== null && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-casino text-sm ${
                  hashValid
                    ? "bg-casino-green/10 text-casino-green border border-casino-green/30"
                    : "bg-casino-red/10 text-casino-red border border-casino-red/30"
                }`}>
                  <span>{hashValid ? "Hash matches server seed" : "Hash does NOT match server seed"}</span>
                </div>
              )}

              {/* Verification result */}
              {verifyResult && (
                <div className="bg-casino-bg rounded-casino px-4 py-3 mt-2">
                  <label className="text-xs text-casino-text-muted uppercase tracking-wider">Result</label>
                  <pre className="text-sm text-casino-text font-mono whitespace-pre-wrap mt-1">
                    {verifyResult}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
