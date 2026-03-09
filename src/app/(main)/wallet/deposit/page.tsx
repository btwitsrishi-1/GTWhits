"use client";

import { useState } from "react";
import Link from "next/link";

const CRYPTO_OPTIONS = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#F7931A" />
        <path
          d="M22.5 14.2c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.7-.4-.7 2.6c-.4-.1-.9-.2-1.4-.3l.7-2.7-1.7-.4-.7 2.7c-.3-.1-.7-.2-1-.3l-2.3-.6-.4 1.8s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.3c0 0 .1 0 .2.1h-.2l-1.2 4.7c-.1.2-.3.6-.8.4 0 0-1.2-.3-1.2-.3l-.8 1.9 2.2.5c.4.1.8.2 1.2.3l-.7 2.8 1.7.4.7-2.7c.5.1.9.2 1.4.3l-.7 2.7 1.7.4.7-2.8c2.9.5 5.1.3 6-2.3.7-2.1 0-3.3-1.5-4.1 1.1-.3 1.9-1 2.1-2.5zm-3.8 5.3c-.5 2.1-4.1 1-5.3.7l.9-3.8c1.2.3 4.9.9 4.4 3.1zm.5-5.4c-.5 1.9-3.5.9-4.4.7l.9-3.4c1 .2 4.1.7 3.5 2.7z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#627EEA" />
        <path d="M16 4v8.9l7.5 3.3L16 4z" fill="white" fillOpacity="0.6" />
        <path d="M16 4L8.5 16.2l7.5-3.3V4z" fill="white" />
        <path d="M16 21.9v6.1l7.5-10.4L16 21.9z" fill="white" fillOpacity="0.6" />
        <path d="M16 28v-6.1l-7.5-4.3L16 28z" fill="white" />
        <path d="M16 20.6l7.5-4.4L16 12.9v7.7z" fill="white" fillOpacity="0.2" />
        <path d="M8.5 16.2l7.5 4.4v-7.7l-7.5 3.3z" fill="white" fillOpacity="0.6" />
      </svg>
    ),
  },
  {
    name: "USDT",
    symbol: "USDT",
    address: "TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#26A17B" />
        <path
          d="M17.9 17v-.1c-.1 0-1 0-2 0-.8 0-1.7 0-1.8.1-3.6-.2-6.3-.9-6.3-1.8s2.7-1.7 6.3-1.8v2.9c.2 0 1 .1 1.9.1.9 0 1.7 0 1.9-.1v-2.9c3.6.2 6.3.9 6.3 1.8s-2.7 1.6-6.3 1.8zm0-3.9v-2.6h5.2V7.4H8.9v3.1h5.2v2.6c-4 .2-7.1 1.2-7.1 2.3s3 2.1 7.1 2.3v8.3h3.8v-8.3c4-.2 7.1-1.2 7.1-2.3s-3-2.1-7.1-2.3z"
          fill="white"
        />
      </svg>
    ),
  },
];

export default function DepositPage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  function copyAddress(address: string, index: number) {
    navigator.clipboard.writeText(address);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Link
          href="/wallet"
          className="text-casino-text-secondary hover:text-casino-text transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-casino-text">Deposit</h1>
      </div>

      {/* Info banner */}
      <div className="bg-casino-green/10 border border-casino-green/30 rounded-casino p-4">
        <p className="text-casino-green text-sm">
          This is a demo casino using virtual credits. No real money is involved.
          Use the quick deposit buttons on the wallet page for instant credits.
        </p>
      </div>

      {/* Crypto options */}
      <div className="space-y-4">
        {CRYPTO_OPTIONS.map((crypto, index) => (
          <div
            key={crypto.symbol}
            className="bg-casino-surface border border-casino-border rounded-casino p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              {crypto.icon}
              <div>
                <h3 className="text-casino-text font-semibold">{crypto.name}</h3>
                <p className="text-casino-text-muted text-xs">{crypto.symbol} Network</p>
              </div>
            </div>

            <div className="bg-casino-bg rounded-casino p-4 flex items-center gap-3">
              <code className="text-casino-text-secondary text-xs flex-1 break-all font-mono">
                {crypto.address}
              </code>
              <button
                onClick={() => copyAddress(crypto.address, index)}
                className="shrink-0 bg-casino-surface-light hover:bg-casino-surface-hover border border-casino-border rounded-casino px-4 py-2 text-sm text-casino-text transition-colors"
              >
                {copiedIndex === index ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* QR placeholder */}
            <div className="mt-4 flex justify-center">
              <div className="w-32 h-32 bg-casino-bg border border-casino-border rounded-casino flex items-center justify-center">
                <span className="text-casino-text-muted text-xs text-center px-2">
                  QR Code<br />(Demo)
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-casino-text-muted text-xs text-center">
        These are demo addresses for display purposes only. Do not send real cryptocurrency.
      </p>
    </div>
  );
}
