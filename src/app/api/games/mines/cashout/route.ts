import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { calculateMinesMultiplier } from "@/lib/games/mines";

interface MinesResult {
  mineCount: number;
  minePositions: number[];
  revealedTiles: number[];
  gemsRevealed: number;
}

/**
 * POST /api/games/mines/cashout - Cash out current game
 * Body: { gameSessionId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { gameSessionId } = body;

    const gameSession = await prisma.gameSession.findFirst({
      where: { id: gameSessionId, userId, gameType: "MINES", state: "ACTIVE" },
    });

    if (!gameSession) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const result = gameSession.result as unknown as MinesResult;
    const { mineCount, minePositions, gemsRevealed } = result;

    if (gemsRevealed === 0) {
      return NextResponse.json({ error: "Must reveal at least one gem" }, { status: 400 });
    }

    const multiplier = calculateMinesMultiplier(mineCount, gemsRevealed);
    const payout = Number(gameSession.betAmount) * multiplier;
    const profit = payout - Number(gameSession.betAmount);

    const cashoutResult = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error("Wallet not found");

      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore + payout;

      await tx.wallet.update({
        where: { userId },
        data: { balance: balanceAfter },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: "WIN",
          amount: payout,
          balanceBefore,
          balanceAfter,
          description: `Mines cashout (${multiplier}x, ${gemsRevealed} gems)`,
          gameSessionId,
        },
      });

      await tx.gameSession.update({
        where: { id: gameSessionId },
        data: {
          state: "COMPLETED",
          multiplier,
          payout,
          profit,
        },
      });

      return { balance: balanceAfter };
    });

    return NextResponse.json({
      multiplier,
      payout,
      profit,
      minePositions, // Reveal mines on cashout
      balance: cashoutResult.balance,
    });
  } catch (error) {
    console.error("Mines cashout error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
