import { generateFloats } from "./provably-fair";

/**
 * Generate mine positions using provably fair RNG.
 * Returns an array of indices (0-24) where mines are placed on a 5x5 grid.
 */
export function generateMinePositions(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  mineCount: number
): number[] {
  // Create array of all 25 positions
  const positions = Array.from({ length: 25 }, (_, i) => i);
  const floats = generateFloats(serverSeed, clientSeed, nonce, 25);

  // Fisher-Yates shuffle
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(floats[positions.length - 1 - i] * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // First mineCount positions are mines
  return positions.slice(0, mineCount).sort((a, b) => a - b);
}

/**
 * Calculate multiplier for mines game.
 * Uses combinatorial probability with 1% house edge.
 *
 * Fair probability of surviving N reveals with M mines on 25 tiles:
 * P(n) = C(25-M, n) / C(25, n)
 *
 * Fair multiplier = 1 / P(n)
 * Actual multiplier = Fair multiplier * (1 - houseEdge)
 */
export function calculateMinesMultiplier(
  mineCount: number,
  gemsRevealed: number,
  houseEdge: number = 0.01
): number {
  if (gemsRevealed === 0) return 1;

  let probability = 1;
  for (let i = 0; i < gemsRevealed; i++) {
    probability *= (25 - mineCount - i) / (25 - i);
  }

  const fairMultiplier = 1 / probability;
  return parseFloat((fairMultiplier * (1 - houseEdge)).toFixed(4));
}

/**
 * Get the next multiplier if the player reveals one more gem.
 */
export function getNextMultiplier(
  mineCount: number,
  currentGemsRevealed: number,
  houseEdge: number = 0.01
): number {
  return calculateMinesMultiplier(mineCount, currentGemsRevealed + 1, houseEdge);
}

/**
 * Maximum gems that can be revealed (25 - mineCount).
 */
export function maxGems(mineCount: number): number {
  return 25 - mineCount;
}
