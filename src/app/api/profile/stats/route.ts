import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [aggregate, gamesByType, biggestWin] = await Promise.all([
    prisma.gameSession.aggregate({
      where: { userId, state: "COMPLETED" },
      _count: true,
      _sum: {
        betAmount: true,
        profit: true,
      },
    }),
    prisma.gameSession.groupBy({
      by: ["gameType"],
      where: { userId, state: "COMPLETED" },
      _count: true,
    }),
    prisma.gameSession.findFirst({
      where: { userId, state: "COMPLETED" },
      orderBy: { profit: "desc" },
      select: { profit: true },
    }),
  ]);

  const gamesWon = await prisma.gameSession.count({
    where: {
      userId,
      state: "COMPLETED",
      profit: { gt: 0 },
    },
  });

  const totalGames = aggregate._count;
  const totalWagered = Number(aggregate._sum.betAmount || 0);
  const totalProfit = Number(aggregate._sum.profit || 0);
  const gamesLost = totalGames - gamesWon;
  const biggestWinAmount = biggestWin?.profit ? Math.max(0, Number(biggestWin.profit)) : 0;

  const favoriteGame = gamesByType.length > 0
    ? gamesByType.reduce((a, b) => (b._count > a._count ? b : a)).gameType
    : null;

  return NextResponse.json({
    totalGames,
    totalWagered,
    totalProfit,
    gamesWon,
    gamesLost,
    biggestWin: biggestWinAmount,
    favoriteGame,
  });
}
