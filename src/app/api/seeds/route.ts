import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const seed = await prisma.seed.findFirst({
    where: { userId: session.user.id, active: true },
    select: {
      serverSeedHash: true,
      clientSeed: true,
      nonce: true,
    },
  });

  if (!seed) {
    return NextResponse.json({ error: "No active seed" }, { status: 404 });
  }

  return NextResponse.json(seed);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientSeed } = await req.json();

  if (!clientSeed || typeof clientSeed !== "string" || clientSeed.length < 1 || clientSeed.length > 64) {
    return NextResponse.json({ error: "Invalid client seed" }, { status: 400 });
  }

  const seed = await prisma.seed.findFirst({
    where: { userId: session.user.id, active: true },
  });

  if (!seed) {
    return NextResponse.json({ error: "No active seed" }, { status: 404 });
  }

  await prisma.seed.update({
    where: { id: seed.id },
    data: { clientSeed },
  });

  return NextResponse.json({ clientSeed });
}
