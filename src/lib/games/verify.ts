// Client-side verification library - mirrors server provably-fair logic
// Uses Web Crypto API (browser-compatible, no Node.js crypto needed)

async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const msgData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyServerSeedHash(
  serverSeed: string,
  expectedHash: string
): Promise<boolean> {
  const hash = await sha256(serverSeed);
  return hash === expectedHash;
}

export async function generateVerificationFloats(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  count: number
): Promise<number[]> {
  const floats: number[] = [];
  let cursor = 0;

  while (floats.length < count) {
    const hmac = await hmacSha256(serverSeed, `${clientSeed}:${nonce}:${cursor}`);

    for (let i = 0; i < 32 && floats.length < count; i += 4) {
      const hex = hmac.substring(i * 2, i * 2 + 8);
      const int = parseInt(hex, 16);
      const float = int / 0x100000000;
      floats.push(float);
    }

    cursor++;
  }

  return floats;
}

export async function verifyMines(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  mineCount: number
): Promise<number[]> {
  const positions = Array.from({ length: 25 }, (_, i) => i);
  const floats = await generateVerificationFloats(serverSeed, clientSeed, nonce, 25);

  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(floats[positions.length - 1 - i] * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  return positions.slice(0, mineCount).sort((a, b) => a - b);
}

export async function verifyPlinko(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  rows: number
): Promise<{ path: number[]; slotIndex: number }> {
  const floats = await generateVerificationFloats(serverSeed, clientSeed, nonce, rows);
  const path: number[] = [];
  let position = 0;

  for (let i = 0; i < rows; i++) {
    const direction = floats[i] < 0.5 ? 0 : 1;
    path.push(direction);
    position += direction;
  }

  return { path, slotIndex: position };
}

export async function verifyRoulette(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): Promise<number> {
  const floats = await generateVerificationFloats(serverSeed, clientSeed, nonce, 1);
  return Math.floor(floats[0] * 37);
}

export async function verifyBlackjack(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): Promise<string[]> {
  const suits = ["hearts", "diamonds", "clubs", "spades"];
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const deck: string[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push(`${rank} of ${suit}`);
    }
  }

  const floats = await generateVerificationFloats(serverSeed, clientSeed, nonce, 52);

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(floats[deck.length - 1 - i] * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}
