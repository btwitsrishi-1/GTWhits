import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import {
  generateShuffledDeck,
  calculateHandValue,
  determineOutcome,
  getPayoutMultiplier,
  serializeCard,
  dealerPlay,
} from "@/lib/games/blackjack";
import { generateServerSeed, hashServerSeed } from "@/lib/games/provably-fair";

/**
 * POST /api/games/blackjack - Start a new game
 * Body: { betAmount: number }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { betAmount } = body;

    if (!betAmount || betAmount <= 0) {
      return NextResponse.json({ error: "Invalid bet amount" }, { status: 400 });
    }

    // Check for existing active game
    const existingGame = await prisma.gameSession.findFirst({
      where: { userId, gameType: "BLACKJACK", state: "ACTIVE" },
    });
    if (existingGame) {
      return NextResponse.json({ error: "Active game exists. Finish it first." }, { status: 400 });
    }

    // Get user's active seed
    const seed = await prisma.seed.findFirst({
      where: { userId, active: true },
    });
    if (!seed) {
      return NextResponse.json({ error: "No active seed found" }, { status: 400 });
    }

    const nonce = seed.nonce + 1;
    const gameServerSeed = generateServerSeed();
    const gameServerSeedHash = hashServerSeed(gameServerSeed);

    // Generate shuffled deck
    const deck = generateShuffledDeck(gameServerSeed, seed.clientSeed, nonce);

    // Deal: player gets cards 0, 2; dealer gets 1, 3
    const playerCards = [deck[0], deck[2]];
    const dealerCards = [deck[1], deck[3]];
    let deckIndex = 4;

    const playerHand = calculateHandValue(playerCards);
    const dealerHand = calculateHandValue(dealerCards);

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
          description: `Blackjack bet ($${betAmount.toFixed(2)})`,
        },
      });

      // Check for immediate blackjack
      let state: "ACTIVE" | "COMPLETED" = "ACTIVE";
      let multiplier = 0;
      let payout = 0;
      let profit = -betAmount;
      let finalBalance = balanceAfterBet;

      if (playerHand.isBlackjack || dealerHand.isBlackjack) {
        // Dealer plays out if player has blackjack but dealer might too
        const outcome = determineOutcome(playerHand, dealerHand);
        multiplier = getPayoutMultiplier(outcome);
        payout = betAmount * multiplier;
        profit = payout - betAmount;
        state = "COMPLETED";

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
              description: `Blackjack ${outcome} (${multiplier}x)`,
            },
          });
        }
      }

      // Store the full deck in the session for later actions
      const gameSession = await tx.gameSession.create({
        data: {
          userId,
          gameType: "BLACKJACK",
          betAmount,
          multiplier,
          payout,
          profit,
          serverSeed: gameServerSeed,
          serverSeedHash: gameServerSeedHash,
          clientSeed: seed.clientSeed,
          nonce,
          result: {
            deck: deck.map(serializeCard),
            deckIndex,
            playerCards: playerCards.map(serializeCard),
            dealerCards: dealerCards.map(serializeCard),
            outcome: state === "COMPLETED" ? determineOutcome(playerHand, dealerHand) : null,
          },
          state,
        },
      });

      // Update seed nonce
      await tx.seed.update({
        where: { id: seed.id },
        data: { nonce },
      });

      return {
        gameSessionId: gameSession.id,
        balance: finalBalance,
        state,
        multiplier,
        payout,
        profit,
      };
    });

    return NextResponse.json({
      gameSessionId: result.gameSessionId,
      playerCards: playerCards.map(serializeCard),
      dealerUpCard: serializeCard(dealerCards[0]),
      playerValue: playerHand.value,
      playerIsSoft: playerHand.isSoft,
      isBlackjack: playerHand.isBlackjack,
      dealerBlackjack: dealerHand.isBlackjack,
      gameOver: result.state === "COMPLETED",
      outcome: result.state === "COMPLETED" ? determineOutcome(playerHand, dealerHand) : null,
      dealerCards: result.state === "COMPLETED" ? dealerCards.map(serializeCard) : undefined,
      dealerValue: result.state === "COMPLETED" ? dealerHand.value : undefined,
      multiplier: result.multiplier,
      payout: result.payout,
      profit: result.profit,
      balance: result.balance,
      serverSeedHash: hashServerSeed(gameServerSeed),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Insufficient balance") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("Blackjack start error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
