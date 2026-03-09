"use client";

import PlayingCard from "./PlayingCard";

interface CardData {
  suit: string;
  rank: string;
}

interface HandDisplayProps {
  label: string;
  cards: CardData[];
  value?: number | null;
  isSoft?: boolean;
  faceDownSecond?: boolean; // For dealer's hidden card
}

export default function HandDisplay({
  label,
  cards,
  value,
  isSoft,
  faceDownSecond = false,
}: HandDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-casino-text-muted uppercase tracking-wider">
          {label}
        </span>
        {value !== null && value !== undefined && (
          <span className="text-sm font-bold text-casino-text">
            ({isSoft ? "Soft " : ""}
            {value})
          </span>
        )}
      </div>
      <div className="flex gap-[-8px]" style={{ gap: "-8px" }}>
        {cards.map((card, index) => (
          <div key={index} style={{ marginLeft: index > 0 ? "-16px" : "0" }}>
            <PlayingCard
              suit={card.suit}
              rank={card.rank}
              faceDown={faceDownSecond && index === 1}
              delay={index * 0.15}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
