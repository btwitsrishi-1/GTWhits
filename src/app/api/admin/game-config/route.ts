import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const configs = await prisma.gameConfig.findMany();

    // Ensure all game types have a config
    const gameTypes = ["MINES", "PLINKO", "ROULETTE", "BLACKJACK"] as const;
    const result = gameTypes.map((gt) => {
      const existing = configs.find((c) => c.gameType === gt);
      if (existing) {
        return {
          id: existing.id,
          gameType: existing.gameType,
          fairnessMode: existing.fairnessMode,
          customHouseEdge: existing.customHouseEdge ? Number(existing.customHouseEdge) : null,
          customSettings: existing.customSettings,
        };
      }
      return {
        id: null,
        gameType: gt,
        fairnessMode: "PROVABLY_FAIR",
        customHouseEdge: null,
        customSettings: null,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Game config GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { gameType, fairnessMode, customHouseEdge, customSettings } = body;

    if (!gameType || !fairnessMode) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const config = await prisma.gameConfig.upsert({
      where: { gameType },
      update: {
        fairnessMode,
        customHouseEdge: customHouseEdge ?? null,
        customSettings: customSettings ?? null,
      },
      create: {
        gameType,
        fairnessMode,
        customHouseEdge: customHouseEdge ?? null,
        customSettings: customSettings ?? null,
      },
    });

    return NextResponse.json({
      id: config.id,
      gameType: config.gameType,
      fairnessMode: config.fairnessMode,
      customHouseEdge: config.customHouseEdge ? Number(config.customHouseEdge) : null,
      customSettings: config.customSettings,
    });
  } catch (error) {
    console.error("Game config PUT error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
