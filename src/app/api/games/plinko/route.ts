import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import {
  generatePlinkoPath,
  getPlinkoMultiplier,
  type PlinkoRisk,
  type PlinkoRows,
} from "@/lib/games/plinko";
import { generateServerSeed, hashServerSeed } from "@/lib/games/provably-fair";

const VALID_ROWS: PlinkoRows[] = [8, 12, 16];
const VALID_RISKS: PlinkoRisk[] = ["low", "medium", "high"];

/**
 * POST /api/games/plinko - Drop a ball
 * Body: { betAmount: number, rows: 8|12|16, risk: "low"|"medium"|"high" }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { betAmount, rows, risk } = body;

    // Validate
    if (!betAmount || betAmount <= 0) {
      return NextResponse.json({ error: "Invalid bet amount" }, { status: 400 });
    }
    if (!VALID_ROWS.includes(rows)) {
      return NextResponse.json({ error: "Rows must be 8, 12, or 16" }, { status: 400 });
    }
    if (!VALID_RISKS.includes(risk)) {
      return NextResponse.json({ error: "Risk must be low, medium, or high" }, { status: 400 });
    }

    // Get user's active seed
    const seed = await prisma.seed.findFirst({
      where: { userId, active: true },
    });
    if (!seed) {
      return NextResponse.json({ error: "No active seed found" }, { status: 400 });
    }

    const nonce = seed.nonce + 1;

    // Generate per-game server seed
    const gameServerSeed = generateServerSeed();
    const gameServerSeedHash = hashServerSeed(gameServerSeed);

    // Generate path and determine outcome
    const { path, slotIndex } = generatePlinkoPath(
      gameServerSeed,
      seed.clientSeed,
      nonce,
      rows
    );
    const multiplier = getPlinkoMultiplier(slotIndex, rows, risk);
    const payout = betAmount * multiplier;
    const profit = payout - betAmount;

    // Execute transaction
    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error("Wallet not found");

      const balanceBefore = Number(wallet.balance);
      if (balanceBefore < betAmount) {
        throw new Error("Insufficient balance");
      }

      // Deduct bet
      const balanceAfterBet = balanceBefore - betAmount;
      await tx.wallet.update({
        where: { userId },
        data: { balance: balanceAfterBet },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: "BET",
          amount: betAmount,
          balanceBefore,
          balanceAfter: balanceAfterBet,
          description: `Plinko bet ($${betAmount.toFixed(2)}, ${rows} rows, ${risk})`,
        },
      });

      // Credit win if multiplier > 0
      let finalBalance = balanceAfterBet;
      const gameSession = await tx.gameSession.create({
        data: {
          userId,
          gameType: "PLINKO",
          betAmount,
          multiplier,
          payout,
          profit,
          serverSeed: gameServerSeed,
          serverSeedHash: gameServerSeedHash,
          clientSeed: seed.clientSeed,
          nonce,
          result: { rows, risk, path, slotIndex, multiplier },
          state: "COMPLETED",
        },
      });

      if (payout > 0) {
        finalBalance = balanceAfterBet + payout;
        await tx.wallet.update({
          where: { userId },
          data: { balance: finalBalance },
        });

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: "WIN",
            amount: payout,
            balanceBefore: balanceAfterBet,
            balanceAfter: finalBalance,
            description: `Plinko win (${multiplier}x)`,
            gameSessionId: gameSession.id,
          },
        });
      }

      // Update seed nonce
      await tx.seed.update({
        where: { id: seed.id },
        data: { nonce },
      });

      return { balance: finalBalance };
    });

    return NextResponse.json({
      path,
      slotIndex,
      multiplier,
      payout,
      profit,
      balance: result.balance,
      serverSeedHash: gameServerSeedHash,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Insufficient balance") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("Plinko error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
