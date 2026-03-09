import { generateFloats } from "./provably-fair";

export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number; // Primary value (A=11, face=10)
}

export interface Hand {
  cards: Card[];
  value: number;
  isSoft: boolean; // Has an ace counted as 11
  isBust: boolean;
  isBlackjack: boolean;
}

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function cardValue(rank: Rank): number {
  if (rank === "A") return 11;
  if (["K", "Q", "J"].includes(rank)) return 10;
  return parseInt(rank);
}

/**
 * Create a standard 52-card deck.
 */
function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, value: cardValue(rank) });
    }
  }
  return deck;
}

/**
 * Shuffle a deck using provably fair RNG.
 */
export function generateShuffledDeck(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): Card[] {
  const deck = createDeck();
  const floats = generateFloats(serverSeed, clientSeed, nonce, 52);

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(floats[deck.length - 1 - i] * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

/**
 * Calculate hand value with soft ace handling.
 */
export function calculateHandValue(cards: Card[]): Hand {
  let value = 0;
  let aces = 0;

  for (const card of cards) {
    value += card.value;
    if (card.rank === "A") aces++;
  }

  // Convert aces from 11 to 1 if bust
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  const isSoft = aces > 0; // Still have an ace counted as 11
  const isBust = value > 21;
  const isBlackjack = cards.length === 2 && value === 21;

  return { cards, value, isSoft, isBust, isBlackjack };
}

/**
 * Check if a hand can split (two cards of the same rank).
 */
export function canSplit(hand: Hand): boolean {
  if (hand.cards.length !== 2) return false;
  return hand.cards[0].value === hand.cards[1].value;
}

/**
 * Dealer plays: hits until reaching 17 or more.
 * Dealer stands on soft 17.
 */
export function dealerPlay(
  dealerCards: Card[],
  deck: Card[],
  deckIndex: number
): { hand: Hand; deckIndex: number } {
  let currentIndex = deckIndex;
  const cards = [...dealerCards];
  let hand = calculateHandValue(cards);

  while (hand.value < 17) {
    cards.push(deck[currentIndex]);
    currentIndex++;
    hand = calculateHandValue(cards);
  }

  return { hand, deckIndex: currentIndex };
}

/**
 * Determine the outcome of a hand vs dealer.
 */
export type GameOutcome = "win" | "lose" | "push" | "blackjack";

export function determineOutcome(
  playerHand: Hand,
  dealerHand: Hand
): GameOutcome {
  if (playerHand.isBust) return "lose";
  if (dealerHand.isBust) return "win";

  if (playerHand.isBlackjack && !dealerHand.isBlackjack) return "blackjack";
  if (!playerHand.isBlackjack && dealerHand.isBlackjack) return "lose";
  if (playerHand.isBlackjack && dealerHand.isBlackjack) return "push";

  if (playerHand.value > dealerHand.value) return "win";
  if (playerHand.value < dealerHand.value) return "lose";
  return "push";
}

/**
 * Calculate payout multiplier based on outcome.
 * blackjack = 2.5 (3:2), win = 2 (1:1), push = 1, lose = 0
 */
export function getPayoutMultiplier(outcome: GameOutcome): number {
  switch (outcome) {
    case "blackjack":
      return 2.5;
    case "win":
      return 2;
    case "push":
      return 1;
    case "lose":
      return 0;
  }
}

/**
 * Serialize card for JSON storage.
 */
export function serializeCard(card: Card): { suit: string; rank: string } {
  return { suit: card.suit, rank: card.rank };
}

/**
 * Deserialize card from JSON.
 */
export function deserializeCard(data: { suit: string; rank: string }): Card {
  return {
    suit: data.suit as Suit,
    rank: data.rank as Rank,
    value: cardValue(data.rank as Rank),
  };
}
