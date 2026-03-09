import { generateFloats } from "./provably-fair";

export type PlinkoRisk = "low" | "medium" | "high";
export type PlinkoRows = 8 | 12 | 16;

/**
 * Generate the path a ball takes through the Plinko board.
 * Each peg bounce is determined by a provably fair float.
 * Returns array of directions (0=left, 1=right) and final slot index.
 */
export function generatePlinkoPath(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  rows: PlinkoRows
): { path: number[]; slotIndex: number } {
  const floats = generateFloats(serverSeed, clientSeed, nonce, rows);
  const path: number[] = [];
  let position = 0;

  for (let i = 0; i < rows; i++) {
    const direction = floats[i] < 0.5 ? 0 : 1; // 0 = left, 1 = right
    path.push(direction);
    position += direction;
  }

  return { path, slotIndex: position };
}

/**
 * Multiplier lookup tables.
 * Follows binomial distribution shape - edges have high multipliers, center has low.
 */
const MULTIPLIER_TABLES: Record<PlinkoRows, Record<PlinkoRisk, number[]>> = {
  8: {
    low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
  },
  12: {
    low: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
  },
  16: {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
    high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  },
};

/**
 * Get the multiplier for a given slot, rows, and risk level.
 */
export function getPlinkoMultiplier(
  slotIndex: number,
  rows: PlinkoRows,
  risk: PlinkoRisk
): number {
  const table = MULTIPLIER_TABLES[rows][risk];
  return table[slotIndex] ?? 0;
}

/**
 * Get all multipliers for a given rows + risk combination.
 */
export function getPlinkoMultiplierTable(
  rows: PlinkoRows,
  risk: PlinkoRisk
): number[] {
  return MULTIPLIER_TABLES[rows][risk];
}
