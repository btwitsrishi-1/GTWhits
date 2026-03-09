import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const config = await prisma.siteConfig.findUnique({
      where: { id: "default" },
    });

    return NextResponse.json({
      showProvablyFair: config?.showProvablyFair ?? true,
    });
  } catch (error) {
    console.error("Site config GET error:", error);
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
    const { showProvablyFair } = body;

    if (typeof showProvablyFair !== "boolean") {
      return NextResponse.json({ error: "Invalid value" }, { status: 400 });
    }

    const config = await prisma.siteConfig.upsert({
      where: { id: "default" },
      update: { showProvablyFair },
      create: { id: "default", showProvablyFair },
    });

    return NextResponse.json({
      showProvablyFair: config.showProvablyFair,
    });
  } catch (error) {
    console.error("Site config PUT error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
