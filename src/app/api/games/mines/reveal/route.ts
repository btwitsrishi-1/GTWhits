import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { calculateMinesMultiplier, getNextMultiplier, maxGems } from "@/lib/games/mines";

interface MinesResult {
  mineCount: number;
  minePositions: number[];
  revealedTiles: number[];
  gemsRevealed: number;
}

/**
 * POST /api/games/mines/reveal - Reveal a tile
 * Body: { gameSessionId: string, tileIndex: number }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { gameSessionId, tileIndex } = body;

    if (tileIndex === undefined || tileIndex < 0 || tileIndex > 24) {
      return NextResponse.json({ error: "Invalid tile index" }, { status: 400 });
    }

    const gameSession = await prisma.gameSession.findFirst({
      where: { id: gameSessionId, userId, gameType: "MINES", state: "ACTIVE" },
    });

    if (!gameSession) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const result = gameSession.result as unknown as MinesResult;
    const { mineCount, minePositions, revealedTiles, gemsRevealed } = result;

    // Check if tile already revealed
    if (revealedTiles.includes(tileIndex)) {
      return NextResponse.json({ error: "Tile already revealed" }, { status: 400 });
    }

    const isMine = minePositions.includes(tileIndex);
    const newRevealedTiles = [...revealedTiles, tileIndex];

    if (isMine) {
      // Game over - hit a mine
      await prisma.gameSession.update({
        where: { id: gameSessionId },
        data: {
          state: "COMPLETED",
          multiplier: 0,
          payout: 0,
          profit: -Number(gameSession.betAmount),
          result: {
            ...result,
            revealedTiles: newRevealedTiles,
          },
        },
      });

      return NextResponse.json({
        isMine: true,
        minePositions, // Reveal all mines on game over
        multiplier: 0,
        gameOver: true,
      });
    }

    // Gem revealed
    const newGemsRevealed = gemsRevealed + 1;
    const currentMultiplier = calculateMinesMultiplier(mineCount, newGemsRevealed);
    const allGemsRevealed = newGemsRevealed >= maxGems(mineCount);

    if (allGemsRevealed) {
      // Auto-cashout if all gems revealed
      const payout = Number(gameSession.betAmount) * currentMultiplier;
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
            description: `Mines win (${currentMultiplier}x)`,
            gameSessionId,
          },
        });

        await tx.gameSession.update({
          where: { id: gameSessionId },
          data: {
            state: "COMPLETED",
            multiplier: currentMultiplier,
            payout,
            profit,
            result: {
              ...result,
              revealedTiles: newRevealedTiles,
              gemsRevealed: newGemsRevealed,
            },
          },
        });

        return { balance: balanceAfter };
      });

      return NextResponse.json({
        isMine: false,
        multiplier: currentMultiplier,
        minePositions, // Reveal all mines
        gameOver: true,
        autoCashout: true,
        payout,
        profit,
        balance: cashoutResult.balance,
      });
    }

    // Update game state
    await prisma.gameSession.update({
      where: { id: gameSessionId },
      data: {
        result: {
          ...result,
          revealedTiles: newRevealedTiles,
          gemsRevealed: newGemsRevealed,
        },
      },
    });

    return NextResponse.json({
      isMine: false,
      multiplier: currentMultiplier,
      nextMultiplier: getNextMultiplier(mineCount, newGemsRevealed),
      gameOver: false,
      gemsRevealed: newGemsRevealed,
    });
  } catch (error) {
    console.error("Mines reveal error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
