import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalBetsToday,
      totalWagered,
      houseProfit,
      activeGames,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.gameSession.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.gameSession.aggregate({
        _sum: { betAmount: true },
      }),
      prisma.gameSession.aggregate({
        _sum: { profit: true },
        where: { state: "COMPLETED" },
      }),
      prisma.gameSession.count({
        where: { state: "ACTIVE" },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalBetsToday,
      totalWagered: Number(totalWagered._sum.betAmount ?? 0),
      houseProfit: -Number(houseProfit._sum.profit ?? 0), // negate: player profit -> house profit
      activeGames,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
