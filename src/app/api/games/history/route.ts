import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const gameType = searchParams.get("gameType");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  const where: Record<string, unknown> = {
    userId: session.user.id,
    state: "COMPLETED",
  };
  if (gameType && gameType !== "ALL") {
    where.gameType = gameType;
  }

  const [games, total] = await Promise.all([
    prisma.gameSession.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        gameType: true,
        betAmount: true,
        multiplier: true,
        payout: true,
        profit: true,
        serverSeedHash: true,
        nonce: true,
        fairnessMode: true,
        createdAt: true,
      },
    }),
    prisma.gameSession.count({ where }),
  ]);

  return NextResponse.json({
    games: games.map((g) => ({
      ...g,
      betAmount: Number(g.betAmount),
      multiplier: g.multiplier ? Number(g.multiplier) : 0,
      payout: g.payout ? Number(g.payout) : 0,
      profit: g.profit ? Number(g.profit) : 0,
    })),
    total,
    pages: Math.ceil(total / limit),
  });
}
