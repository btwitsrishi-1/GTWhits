import crypto from "crypto";

/**
 * Core provably fair engine using HMAC-SHA256.
 * Generates deterministic random floats from serverSeed + clientSeed + nonce + cursor.
 */

export function hashServerSeed(serverSeed: string): string {
  return crypto.createHash("sha256").update(serverSeed).digest("hex");
}

export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateClientSeed(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Generate deterministic floats in [0, 1) from seeds.
 * Uses HMAC-SHA256 with serverSeed as key and `clientSeed:nonce:cursor` as message.
 * Each 4 bytes of the HMAC output produce one float.
 */
export function generateFloats(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  count: number
): number[] {
  const floats: number[] = [];
  let cursor = 0;

  while (floats.length < count) {
    const hmac = crypto
      .createHmac("sha256", serverSeed)
      .update(`${clientSeed}:${nonce}:${cursor}`)
      .digest("hex");

    // Each HMAC gives 32 bytes = 8 floats (4 bytes each)
    for (let i = 0; i < 32 && floats.length < count; i += 4) {
      const hex = hmac.substring(i * 2, i * 2 + 8);
      const int = parseInt(hex, 16);
      const float = int / 0x100000000; // Divide by 2^32
      floats.push(float);
    }

    cursor++;
  }

  return floats;
}

/**
 * Fisher-Yates shuffle using provably fair floats.
 * Returns a shuffled copy of the array.
 */
export function provablyFairShuffle<T>(
  array: T[],
  serverSeed: string,
  clientSeed: string,
  nonce: number
): T[] {
  const result = [...array];
  const floats = generateFloats(serverSeed, clientSeed, nonce, result.length);

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(floats[result.length - 1 - i] * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
