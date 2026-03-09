import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import {
  generateRouletteOutcome,
  calculateRoulettePayout,
  validateBet,
  type RouletteBet,
} from "@/lib/games/roulette";
import { generateServerSeed, hashServerSeed } from "@/lib/games/provably-fair";

/**
 * POST /api/games/roulette - Spin the wheel
 * Body: { bets: Array<{ type, numbers, amount }> }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { bets } = body as { bets: RouletteBet[] };

    // Validate bets
    if (!Array.isArray(bets) || bets.length === 0) {
      return NextResponse.json({ error: "At least one bet is required" }, { status: 400 });
    }

    if (bets.length > 20) {
      return NextResponse.json({ error: "Maximum 20 bets per spin" }, { status: 400 });
    }

    for (const bet of bets) {
      const error = validateBet(bet);
      if (error) {
        return NextResponse.json({ error }, { status: 400 });
      }
    }

    const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
    if (totalBetAmount <= 0) {
      return NextResponse.json({ error: "Total bet must be positive" }, { status: 400 });
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

    // Generate outcome
    const winningNumber = generateRouletteOutcome(
      gameServerSeed,
      seed.clientSeed,
      nonce
    );

    // Calculate payouts
    const { totalPayout, profit, winningBets } = calculateRoulettePayout(bets, winningNumber);

    // Execute transaction
    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error("Wallet not found");

      const balanceBefore = Number(wallet.balance);
      if (balanceBefore < totalBetAmount) {
        throw new Error("Insufficient balance");
      }

      // Deduct total bet
      const balanceAfterBet = balanceBefore - totalBetAmount;
      await tx.wallet.update({
        where: { userId },
        data: { balance: balanceAfterBet },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: "BET",
          amount: totalBetAmount,
          balanceBefore,
          balanceAfter: balanceAfterBet,
          description: `Roulette bet ($${totalBetAmount.toFixed(2)}, ${bets.length} bets)`,
        },
      });

      // Create game session
      const multiplier = totalBetAmount > 0 ? totalPayout / totalBetAmount : 0;
      const gameSession = await tx.gameSession.create({
        data: {
          userId,
          gameType: "ROULETTE",
          betAmount: totalBetAmount,
          multiplier,
          payout: totalPayout,
          profit,
          serverSeed: gameServerSeed,
          serverSeedHash: gameServerSeedHash,
          clientSeed: seed.clientSeed,
          nonce,
          result: {
            winningNumber,
            bets: bets.map((b) => ({ type: b.type, numbers: b.numbers, amount: b.amount })),
            winningBets: winningBets.map((b) => ({ type: b.type, numbers: b.numbers, amount: b.amount })),
          },
          state: "COMPLETED",
        },
      });

      // Credit winnings if any
      let finalBalance = balanceAfterBet;
      if (totalPayout > 0) {
        finalBalance = balanceAfterBet + totalPayout;
        await tx.wallet.update({
          where: { userId },
          data: { balance: finalBalance },
        });

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: "WIN",
            amount: totalPayout,
            balanceBefore: balanceAfterBet,
            balanceAfter: finalBalance,
            description: `Roulette win (number ${winningNumber})`,
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
      winningNumber,
      totalPayout,
      profit,
      winningBets: winningBets.map((b) => ({ type: b.type, numbers: b.numbers, amount: b.amount })),
      balance: result.balance,
      serverSeedHash: gameServerSeedHash,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Insufficient balance") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("Roulette error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
