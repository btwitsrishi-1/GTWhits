import { generateFloats } from "./provably-fair";

/**
 * European Roulette: numbers 0-36
 * 0 = green, 1-36 = red or black
 */

export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
export const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

/** Physical wheel order (European) */
export const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

export type BetType =
  | "straight"   // single number (35:1)
  | "split"      // two numbers (17:1)
  | "street"     // three numbers (11:1)
  | "corner"     // four numbers (8:1)
  | "line"       // six numbers (5:1)
  | "dozen"      // 12 numbers (2:1) - 1st, 2nd, 3rd
  | "column"     // 12 numbers (2:1) - 1st, 2nd, 3rd column
  | "red"        // 18 numbers (1:1)
  | "black"      // 18 numbers (1:1)
  | "odd"        // 18 numbers (1:1)
  | "even"       // 18 numbers (1:1)
  | "low"        // 1-18 (1:1)
  | "high";      // 19-36 (1:1)

export interface RouletteBet {
  type: BetType;
  numbers: number[]; // The numbers this bet covers
  amount: number;
}

const PAYOUT_MAP: Record<BetType, number> = {
  straight: 35,
  split: 17,
  street: 11,
  corner: 8,
  line: 5,
  dozen: 2,
  column: 2,
  red: 1,
  black: 1,
  odd: 1,
  even: 1,
  low: 1,
  high: 1,
};

/**
 * Generate the winning number using provably fair RNG.
 */
export function generateRouletteOutcome(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number {
  const [float] = generateFloats(serverSeed, clientSeed, nonce, 1);
  return Math.floor(float * 37); // 0-36
}

/**
 * Get the color of a number.
 */
export function getNumberColor(num: number): "green" | "red" | "black" {
  if (num === 0) return "green";
  if (RED_NUMBERS.includes(num)) return "red";
  return "black";
}

/**
 * Check if a bet wins for a given number.
 */
export function isBetWinner(bet: RouletteBet, winningNumber: number): boolean {
  return bet.numbers.includes(winningNumber);
}

/**
 * Calculate total payout for all bets given a winning number.
 * Returns the total amount won (not including original bet).
 * Also returns the total payout (including the returned bet).
 */
export function calculateRoulettePayout(
  bets: RouletteBet[],
  winningNumber: number
): { totalBet: number; totalPayout: number; profit: number; winningBets: RouletteBet[] } {
  let totalBet = 0;
  let totalPayout = 0;
  const winningBets: RouletteBet[] = [];

  for (const bet of bets) {
    totalBet += bet.amount;
    if (isBetWinner(bet, winningNumber)) {
      const payoutMultiplier = PAYOUT_MAP[bet.type];
      // Payout = bet * multiplier + original bet returned
      totalPayout += bet.amount * payoutMultiplier + bet.amount;
      winningBets.push(bet);
    }
  }

  return {
    totalBet,
    totalPayout,
    profit: totalPayout - totalBet,
    winningBets,
  };
}

/**
 * Validate that a bet is valid.
 */
export function validateBet(bet: RouletteBet): string | null {
  if (bet.amount <= 0) return "Bet amount must be positive";
  if (!bet.numbers || bet.numbers.length === 0) return "Bet must cover at least one number";

  // Validate numbers are in range
  for (const num of bet.numbers) {
    if (num < 0 || num > 36 || !Number.isInteger(num)) {
      return `Invalid number: ${num}`;
    }
  }

  // Validate bet type matches number count
  const expectedCounts: Record<BetType, number> = {
    straight: 1,
    split: 2,
    street: 3,
    corner: 4,
    line: 6,
    dozen: 12,
    column: 12,
    red: 18,
    black: 18,
    odd: 18,
    even: 18,
    low: 18,
    high: 18,
  };

  if (bet.numbers.length !== expectedCounts[bet.type]) {
    return `${bet.type} bet should cover ${expectedCounts[bet.type]} numbers`;
  }

  return null;
}

/**
 * Helper to create common bets.
 */
export function createBet(type: BetType, amount: number, value?: number): RouletteBet {
  let numbers: number[];

  switch (type) {
    case "straight":
      numbers = [value ?? 0];
      break;
    case "red":
      numbers = [...RED_NUMBERS];
      break;
    case "black":
      numbers = [...BLACK_NUMBERS];
      break;
    case "odd":
      numbers = Array.from({ length: 36 }, (_, i) => i + 1).filter((n) => n % 2 === 1);
      break;
    case "even":
      numbers = Array.from({ length: 36 }, (_, i) => i + 1).filter((n) => n % 2 === 0);
      break;
    case "low":
      numbers = Array.from({ length: 18 }, (_, i) => i + 1);
      break;
    case "high":
      numbers = Array.from({ length: 18 }, (_, i) => i + 19);
      break;
    case "dozen":
      if (value === 1) numbers = Array.from({ length: 12 }, (_, i) => i + 1);
      else if (value === 2) numbers = Array.from({ length: 12 }, (_, i) => i + 13);
      else numbers = Array.from({ length: 12 }, (_, i) => i + 25);
      break;
    case "column":
      if (value === 1) numbers = Array.from({ length: 12 }, (_, i) => i * 3 + 1);
      else if (value === 2) numbers = Array.from({ length: 12 }, (_, i) => i * 3 + 2);
      else numbers = Array.from({ length: 12 }, (_, i) => i * 3 + 3);
      break;
    default:
      numbers = [];
  }

  return { type, numbers, amount };
}
