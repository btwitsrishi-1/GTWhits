import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const search = req.nextUrl.searchParams.get("search") || "";
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const limit = 20;

    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          wallet: true,
          _count: { select: { gameSessions: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Get aggregate stats per user
    const userIds = users.map((u) => u.id);
    const stats = await prisma.gameSession.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, state: "COMPLETED" },
      _sum: { betAmount: true, profit: true },
    });

    const statsMap = new Map(stats.map((s) => [s.userId, s]));

    const result = users.map((u) => {
      const userStats = statsMap.get(u.id);
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        balance: u.wallet ? Number(u.wallet.balance) : 0,
        totalBets: u._count.gameSessions,
        totalWagered: Number(userStats?._sum.betAmount ?? 0),
        totalProfit: Number(userStats?._sum.profit ?? 0),
        createdAt: u.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ players: result, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Players list error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
