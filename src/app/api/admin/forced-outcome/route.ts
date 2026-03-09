import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, gameType, outcomeType, multiplierOverride } = body;

    if (!userId || !gameType || !outcomeType) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!["MINES", "PLINKO", "ROULETTE", "BLACKJACK"].includes(gameType)) {
      return NextResponse.json({ error: "Invalid game type" }, { status: 400 });
    }

    if (!["WIN", "LOSS"].includes(outcomeType)) {
      return NextResponse.json({ error: "Invalid outcome type" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const forced = await prisma.forcedOutcome.create({
      data: {
        userId,
        gameType,
        outcomeType,
        multiplierOverride: multiplierOverride || null,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({
      id: forced.id,
      gameType: forced.gameType,
      outcomeType: forced.outcomeType,
      multiplierOverride: forced.multiplierOverride ? Number(forced.multiplierOverride) : null,
      active: forced.active,
    });
  } catch (error) {
    console.error("Forced outcome error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
