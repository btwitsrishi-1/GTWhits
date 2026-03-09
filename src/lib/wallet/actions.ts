"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";

async function getAuthUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function getBalance() {
  const userId = await getAuthUserId();
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new Error("Wallet not found");
  return { balance: Number(wallet.balance) };
}

export async function deposit(amount: number) {
  if (amount <= 0 || amount > 100000) {
    return { error: "Invalid deposit amount" };
  }

  const userId = await getAuthUserId();

  const result = await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new Error("Wallet not found");

    const balanceBefore = Number(wallet.balance);
    const balanceAfter = balanceBefore + amount;

    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: { balance: balanceAfter },
    });

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: "DEPOSIT",
        amount,
        balanceBefore,
        balanceAfter,
        description: `Deposited $${amount.toFixed(2)}`,
      },
    });

    return { balance: Number(updatedWallet.balance) };
  });

  return result;
}

export async function placeBet(amount: number) {
  if (amount <= 0) return { error: "Invalid bet amount" };

  const userId = await getAuthUserId();

  const result = await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new Error("Wallet not found");

    const balanceBefore = Number(wallet.balance);
    if (balanceBefore < amount) {
      throw new Error("Insufficient balance");
    }

    const balanceAfter = balanceBefore - amount;

    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: { balance: balanceAfter },
    });

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: "BET",
        amount,
        balanceBefore,
        balanceAfter,
        description: `Placed bet of $${amount.toFixed(2)}`,
      },
    });

    return { balance: Number(updatedWallet.balance) };
  });

  return result;
}

export async function creditWin(amount: number, gameSessionId?: string) {
  if (amount <= 0) return { error: "Invalid win amount" };

  const userId = await getAuthUserId();

  const result = await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new Error("Wallet not found");

    const balanceBefore = Number(wallet.balance);
    const balanceAfter = balanceBefore + amount;

    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: { balance: balanceAfter },
    });

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: "WIN",
        amount,
        balanceBefore,
        balanceAfter,
        description: `Won $${amount.toFixed(2)}`,
        gameSessionId,
      },
    });

    return { balance: Number(updatedWallet.balance) };
  });

  return result;
}

export async function getTransactionHistory(page: number = 1, limit: number = 20) {
  const userId = await getAuthUserId();

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new Error("Wallet not found");

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where: { walletId: wallet.id } }),
  ]);

  return {
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      balanceBefore: Number(t.balanceBefore),
      balanceAfter: Number(t.balanceAfter),
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    })),
    total,
    pages: Math.ceil(total / limit),
  };
}
