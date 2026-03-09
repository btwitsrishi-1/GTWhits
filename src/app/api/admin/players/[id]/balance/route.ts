import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { amount, type } = body as { amount: number; type: "add" | "remove" };

    if (!amount || amount <= 0 || !["add", "remove"].includes(type)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: id } });
      if (!wallet) throw new Error("Wallet not found");

      const balanceBefore = Number(wallet.balance);
      const balanceAfter = type === "add" ? balanceBefore + amount : balanceBefore - amount;

      if (balanceAfter < 0) throw new Error("Balance would go negative");

      await tx.wallet.update({
        where: { userId: id },
        data: { balance: balanceAfter },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: type === "add" ? "BONUS" : "BET",
          amount,
          balanceBefore,
          balanceAfter,
          description: `Admin ${type === "add" ? "credit" : "debit"} by ${session.user.name}`,
        },
      });

      return balanceAfter;
    });

    return NextResponse.json({ balance: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
