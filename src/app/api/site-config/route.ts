import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const config = await prisma.siteConfig.findUnique({
      where: { id: "default" },
    });

    return NextResponse.json({
      showProvablyFair: config?.showProvablyFair ?? true,
    });
  } catch (error) {
    console.error("Public site config GET error:", error);
    return NextResponse.json({
      showProvablyFair: true,
    });
  }
}
