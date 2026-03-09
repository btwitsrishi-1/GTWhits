import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import {
  calculateHandValue,
  determineOutcome,
  getPayoutMultiplier,
  dealerPlay,
  serializeCard,
  deserializeCard,
  type Card,
} from "@/lib/games/blackjack";

type Action = "hit" | "stand" | "double";

/**
 * POST /api/games/blackjack/action - Player action (hit, stand, double)
 * Body: { gameSessionId: string, action: "hit" | "stand" | "double" }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { gameSessionId, action } = body as {
      gameSessionId: string;
      action: Action;
    };

    if (!gameSessionId || !["hit", "stand", "double"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Get active game session
    const gameSession = await prisma.gameSession.findFirst({
      where: { id: gameSessionId, userId, gameType: "BLACKJACK", state: "ACTIVE" },
    });
    if (!gameSession) {
      return NextResponse.json({ error: "No active game found" }, { status: 400 });
    }

    const result = gameSession.result as {
      deck: { suit: string; rank: string }[];
      deckIndex: number;
      playerCards: { suit: string; rank: string }[];
      dealerCards: { suit: string; rank: string }[];
    };

    const deck: Card[] = result.deck.map(deserializeCard);
    let deckIndex = result.deckIndex;
    const playerCards: Card[] = result.playerCards.map(deserializeCard);
    const dealerCards: Card[] = result.dealerCards.map(deserializeCard);

    let betAmount = Number(gameSession.betAmount);
    let additionalBet = 0;

    // Handle double down
    if (action === "double") {
      if (playerCards.length !== 2) {
        return NextResponse.json({ error: "Can only double on first two cards" }, { status: 400 });
      }
      additionalBet = betAmount;
      betAmount *= 2;

      // Deal one more card
      playerCards.push(deck[deckIndex]);
      deckIndex++;
    }

    // Handle hit
    if (action === "hit") {
      playerCards.push(deck[deckIndex]);
      deckIndex++;
    }

    const playerHand = calculateHandValue(playerCards);
    let gameOver = false;
    let outcome = null;
    let dealerFinalHand = calculateHandValue(dealerCards);

    // Check if game is over
    if (playerHand.isBust) {
      gameOver = true;
      outcome = "lose" as const;
    } else if (action === "stand" || action === "double" || playerHand.value === 21) {
      // Dealer plays
      const dealerResult = dealerPlay(dealerCards, deck, deckIndex);
      dealerFinalHand = dealerResult.hand;
      deckIndex = dealerResult.deckIndex;
      gameOver = true;
      outcome = determineOutcome(playerHand, dealerFinalHand);
    }

    // Execute transaction
    const txResult = await prisma.$transaction(async (tx) => {
      let finalBalance: number | null = null;

      // Handle additional bet for double
      if (additionalBet > 0) {
        const wallet = await tx.wallet.findUnique({ where: { userId } });
        if (!wallet) throw new Error("Wallet not found");

        const balance = Number(wallet.balance);
        if (balance < additionalBet) {
          throw new Error("Insufficient balance to double down");
        }

        const newBalance = balance - additionalBet;
        await tx.wallet.update({
          where: { userId },
          data: { balance: newBalance },
        });

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: "BET",
            amount: additionalBet,
            balanceBefore: balance,
            balanceAfter: newBalance,
            description: `Blackjack double down ($${additionalBet.toFixed(2)})`,
          },
        });

        finalBalance = newBalance;
      }

      if (gameOver && outcome) {
        const multiplier = getPayoutMultiplier(outcome);
        const payout = betAmount * multiplier;
        const profit = payout - betAmount;

        // Update game session
        await tx.gameSession.update({
          where: { id: gameSessionId },
          data: {
            betAmount,
            multiplier,
            payout,
            profit,
            state: "COMPLETED",
            result: {
              deck: deck.map(serializeCard),
              deckIndex,
              playerCards: playerCards.map(serializeCard),
              dealerCards: dealerFinalHand.cards.map(serializeCard),
              outcome,
            },
          },
        });

        // Credit winnings
        if (payout > 0) {
          const wallet = await tx.wallet.findUnique({ where: { userId } });
          if (!wallet) throw new Error("Wallet not found");

          const balance = Number(wallet.balance);
          const newBalance = balance + payout;
          await tx.wallet.update({
            where: { userId },
            data: { balance: newBalance },
          });

          await tx.transaction.create({
            data: {
              walletId: wallet.id,
              type: "WIN",
              amount: payout,
              balanceBefore: balance,
              balanceAfter: newBalance,
              description: `Blackjack ${outcome} (${multiplier}x)`,
              gameSessionId,
            },
          });

          finalBalance = newBalance;
        } else {
          if (finalBalance === null) {
            const wallet = await tx.wallet.findUnique({ where: { userId } });
            finalBalance = Number(wallet?.balance ?? 0);
          }
        }

        return { multiplier, payout, profit, balance: finalBalance };
      } else {
        // Game continues - update deck state
        await tx.gameSession.update({
          where: { id: gameSessionId },
          data: {
            result: {
              deck: deck.map(serializeCard),
              deckIndex,
              playerCards: playerCards.map(serializeCard),
              dealerCards: dealerCards.map(serializeCard),
            },
          },
        });

        if (finalBalance === null) {
          const wallet = await tx.wallet.findUnique({ where: { userId } });
          finalBalance = Number(wallet?.balance ?? 0);
        }

        return { multiplier: 0, payout: 0, profit: 0, balance: finalBalance };
      }
    });

    return NextResponse.json({
      playerCards: playerCards.map(serializeCard),
      playerValue: playerHand.value,
      playerIsSoft: playerHand.isSoft,
      playerIsBust: playerHand.isBust,
      gameOver,
      outcome,
      dealerCards: gameOver ? dealerFinalHand.cards.map(serializeCard) : undefined,
      dealerValue: gameOver ? dealerFinalHand.value : undefined,
      dealerIsBust: gameOver ? dealerFinalHand.isBust : undefined,
      multiplier: txResult.multiplier,
      payout: txResult.payout,
      profit: txResult.profit,
      balance: txResult.balance,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Insufficient balance to double down") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("Blackjack action error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
