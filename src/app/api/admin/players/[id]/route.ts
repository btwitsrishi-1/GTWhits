import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        gameSessions: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        forcedOutcomes: {
          where: { active: true },
          include: { creator: { select: { username: true } } },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      balance: user.wallet ? Number(user.wallet.balance) : 0,
      createdAt: user.createdAt.toISOString(),
      gameSessions: user.gameSessions.map((gs) => ({
        id: gs.id,
        gameType: gs.gameType,
        betAmount: Number(gs.betAmount),
        multiplier: Number(gs.multiplier),
        payout: Number(gs.payout),
        profit: Number(gs.profit),
        state: gs.state,
        createdAt: gs.createdAt.toISOString(),
      })),
      forcedOutcomes: user.forcedOutcomes.map((fo) => ({
        id: fo.id,
        gameType: fo.gameType,
        outcomeType: fo.outcomeType,
        multiplierOverride: fo.multiplierOverride ? Number(fo.multiplierOverride) : null,
        createdBy: fo.creator.username,
        createdAt: fo.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Player detail error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
