import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { generateMinePositions, calculateMinesMultiplier } from "@/lib/games/mines";
import { generateServerSeed, hashServerSeed } from "@/lib/games/provably-fair";

/**
 * POST /api/games/mines - Start a new Mines game
 * Body: { betAmount: number, mineCount: number }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { betAmount, mineCount } = body;

    // Validate
    if (!betAmount || betAmount <= 0) {
      return NextResponse.json({ error: "Invalid bet amount" }, { status: 400 });
    }
    if (!mineCount || mineCount < 1 || mineCount > 24) {
      return NextResponse.json({ error: "Mine count must be 1-24" }, { status: 400 });
    }

    // Check for existing active mines game
    const existingGame = await prisma.gameSession.findFirst({
      where: { userId, gameType: "MINES", state: "ACTIVE" },
    });
    if (existingGame) {
      return NextResponse.json(
        { error: "You already have an active Mines game" },
        { status: 400 }
      );
    }

    // Get user's active seed
    const seed = await prisma.seed.findFirst({
      where: { userId, active: true },
    });
    if (!seed) {
      return NextResponse.json({ error: "No active seed found" }, { status: 400 });
    }

    // Increment nonce
    const nonce = seed.nonce + 1;

    // Generate a per-game server seed for this session
    const gameServerSeed = generateServerSeed();
    const gameServerSeedHash = hashServerSeed(gameServerSeed);

    // Generate mine positions (stored server-side, never sent to client until game ends)
    const minePositions = generateMinePositions(
      gameServerSeed,
      seed.clientSeed,
      nonce,
      mineCount
    );

    // Deduct bet and create game session atomically
    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error("Wallet not found");

      const balanceBefore = Number(wallet.balance);
      if (balanceBefore < betAmount) {
        throw new Error("Insufficient balance");
      }

      const balanceAfter = balanceBefore - betAmount;

      await tx.wallet.update({
        where: { userId },
        data: { balance: balanceAfter },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: "BET",
          amount: betAmount,
          balanceBefore,
          balanceAfter,
          description: `Mines bet ($${betAmount.toFixed(2)}, ${mineCount} mines)`,
        },
      });

      const gameSession = await tx.gameSession.create({
        data: {
          userId,
          gameType: "MINES",
          betAmount,
          serverSeed: gameServerSeed,
          serverSeedHash: gameServerSeedHash,
          clientSeed: seed.clientSeed,
          nonce,
          result: {
            mineCount,
            minePositions,
            revealedTiles: [],
            gemsRevealed: 0,
          },
          state: "ACTIVE",
        },
      });

      // Update seed nonce
      await tx.seed.update({
        where: { id: seed.id },
        data: { nonce },
      });

      return {
        gameSessionId: gameSession.id,
        serverSeedHash: gameServerSeedHash,
        balance: balanceAfter,
      };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Insufficient balance") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("Mines start error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
