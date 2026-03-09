import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Check no active games
  const activeGame = await prisma.gameSession.findFirst({
    where: { userId, state: "ACTIVE" },
  });

  if (activeGame) {
    return NextResponse.json(
      { error: "Cannot rotate seeds while a game is active" },
      { status: 400 }
    );
  }

  const oldSeed = await prisma.seed.findFirst({
    where: { userId, active: true },
  });

  if (!oldSeed) {
    return NextResponse.json({ error: "No active seed" }, { status: 404 });
  }

  // Generate new seeds
  const newServerSeed = crypto.randomBytes(32).toString("hex");
  const newServerSeedHash = crypto.createHash("sha256").update(newServerSeed).digest("hex");
  const newClientSeed = crypto.randomBytes(16).toString("hex");

  // Deactivate old seed and create new one atomically
  await prisma.$transaction([
    prisma.seed.update({
      where: { id: oldSeed.id },
      data: { active: false },
    }),
    prisma.seed.create({
      data: {
        userId,
        serverSeed: newServerSeed,
        serverSeedHash: newServerSeedHash,
        clientSeed: newClientSeed,
      },
    }),
  ]);

  return NextResponse.json({
    previousSeed: {
      serverSeed: oldSeed.serverSeed,
      serverSeedHash: oldSeed.serverSeedHash,
      clientSeed: oldSeed.clientSeed,
      nonce: oldSeed.nonce,
    },
    newSeed: {
      serverSeedHash: newServerSeedHash,
      clientSeed: newClientSeed,
      nonce: 0,
    },
  });
}
