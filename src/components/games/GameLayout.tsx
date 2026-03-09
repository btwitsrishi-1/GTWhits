"use client";

import { ReactNode } from "react";

interface GameLayoutProps {
  title: string;
  controls: ReactNode;
  children: ReactNode;
}

export default function GameLayout({ title, controls, children }: GameLayoutProps) {
  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 p-4">
      {/* Left panel - Bet controls */}
      <div className="w-full lg:w-[280px] shrink-0 order-2 lg:order-1">
        <div className="bg-casino-surface border border-casino-border rounded-casino p-4 sticky top-4">
          <h2 className="text-sm font-semibold text-casino-text-secondary uppercase tracking-wider mb-4">
            {title}
          </h2>
          {controls}
        </div>
      </div>

      {/* Right area - Game canvas */}
      <div className="flex-1 order-1 lg:order-2">
        <div className="bg-casino-surface border border-casino-border rounded-casino p-4 h-full min-h-[400px] flex items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
