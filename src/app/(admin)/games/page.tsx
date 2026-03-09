"use client";

import { useEffect, useState, useCallback } from "react";

interface GameConfig {
  id: string | null;
  gameType: string;
  fairnessMode: string;
  customHouseEdge: number | null;
  customSettings: Record<string, number> | null;
}

interface SiteConfig {
  showProvablyFair: boolean;
}

const defaultSettings: Record<string, Record<string, number>> = {
  MINES: { houseEdge: 0.01, maxMultiplier: 100 },
  PLINKO: { houseEdge: 0.01, biasCenter: 0.5 },
  ROULETTE: { houseEdge: 0.027 },
  BLACKJACK: { houseEdge: 0.02, dealerBustRate: 0.28 },
};

export default function GameConfigPage() {
  const [configs, setConfigs] = useState<GameConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({ showProvablyFair: true });
  const [savingSiteConfig, setSavingSiteConfig] = useState(false);

  useEffect(() => {
    fetch("/api/admin/game-config")
      .then((r) => r.json())
      .then(setConfigs)
      .catch(console.error)
      .finally(() => setLoading(false));

    fetch("/api/admin/site-config")
      .then((r) => r.json())
      .then(setSiteConfig)
      .catch(console.error);
  }, []);

  const toggleProvablyFair = useCallback(async () => {
    const newValue = !siteConfig.showProvablyFair;
    setSavingSiteConfig(true);
    try {
      const res = await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showProvablyFair: newValue }),
      });
      if (res.ok) {
        setSiteConfig({ showProvablyFair: newValue });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSiteConfig(false);
    }
  }, [siteConfig]);

  const updateConfig = useCallback(async (config: GameConfig) => {
    setSaving(config.gameType);
    try {
      const res = await fetch("/api/admin/game-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (res.ok) {
        setConfigs((prev) =>
          prev.map((c) => (c.gameType === data.gameType ? data : c))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  }, []);

  const toggleMode = useCallback(
    (gameType: string) => {
      const config = configs.find((c) => c.gameType === gameType);
      if (!config) return;
      const newMode = config.fairnessMode === "PROVABLY_FAIR" ? "CUSTOM" : "PROVABLY_FAIR";
      const updated = {
        ...config,
        fairnessMode: newMode,
        customHouseEdge: newMode === "CUSTOM" ? (config.customHouseEdge ?? defaultSettings[gameType]?.houseEdge ?? 0.01) : config.customHouseEdge,
        customSettings: newMode === "CUSTOM" ? (config.customSettings ?? defaultSettings[gameType] ?? {}) : config.customSettings,
      };
      setConfigs((prev) => prev.map((c) => (c.gameType === gameType ? updated : c)));
      updateConfig(updated);
    },
    [configs, updateConfig]
  );

  const updateSetting = useCallback(
    (gameType: string, key: string, value: number) => {
      setConfigs((prev) =>
        prev.map((c) => {
          if (c.gameType !== gameType) return c;
          const settings = { ...(c.customSettings ?? defaultSettings[gameType] ?? {}), [key]: value };
          return { ...c, customSettings: settings, customHouseEdge: key === "houseEdge" ? value : c.customHouseEdge };
        })
      );
    },
    []
  );

  const saveSetting = useCallback(
    (gameType: string) => {
      const config = configs.find((c) => c.gameType === gameType);
      if (config) updateConfig(config);
    },
    [configs, updateConfig]
  );

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-casino-text mb-6">Game Configuration</h1>
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-casino-surface border border-casino-border rounded-casino p-6 h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-casino-text mb-6">Game Configuration</h1>

      {/* Site-wide Settings */}
      <div className="bg-casino-surface border border-casino-border rounded-casino p-6 mb-6">
        <h2 className="text-lg font-semibold text-casino-text mb-4">Site Settings</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-casino-text">Show Provably Fair Page</p>
            <p className="text-xs text-casino-text-muted mt-0.5">
              When disabled, the Provably Fair link is hidden from the sidebar and the verification page is inaccessible to users.
            </p>
          </div>
          <button
            onClick={toggleProvablyFair}
            disabled={savingSiteConfig}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              siteConfig.showProvablyFair ? "bg-casino-green" : "bg-casino-surface-hover"
            } disabled:opacity-50`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                siteConfig.showProvablyFair ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {configs.map((config) => (
          <div key={config.gameType} className="bg-casino-surface border border-casino-border rounded-casino p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-casino-text">{config.gameType}</h2>
              <button
                onClick={() => toggleMode(config.gameType)}
                disabled={saving === config.gameType}
                className={`px-4 py-1.5 rounded-casino text-sm font-medium transition-colors ${
                  config.fairnessMode === "PROVABLY_FAIR"
                    ? "bg-casino-green/20 text-casino-green border border-casino-green/40"
                    : "bg-casino-orange/20 text-casino-orange border border-casino-orange/40"
                } disabled:opacity-50`}
              >
                {saving === config.gameType ? "Saving..." : config.fairnessMode === "PROVABLY_FAIR" ? "Provably Fair" : "Custom"}
              </button>
            </div>

            {config.fairnessMode === "CUSTOM" && (
              <div className="space-y-3 pt-3 border-t border-casino-border">
                {Object.entries(config.customSettings ?? defaultSettings[config.gameType] ?? {}).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-4">
                    <label className="text-sm text-casino-text-secondary w-40 capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={value}
                      onChange={(e) => updateSetting(config.gameType, key, parseFloat(e.target.value) || 0)}
                      className="bg-casino-bg border border-casino-border rounded-casino px-3 py-1.5 text-sm text-casino-text w-32 focus:outline-none focus:border-casino-orange"
                    />
                  </div>
                ))}
                <button
                  onClick={() => saveSetting(config.gameType)}
                  disabled={saving === config.gameType}
                  className="mt-2 px-4 py-1.5 bg-casino-orange hover:opacity-90 text-casino-bg text-sm font-semibold rounded-casino transition-colors disabled:opacity-50"
                >
                  {saving === config.gameType ? "Saving..." : "Save Settings"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
