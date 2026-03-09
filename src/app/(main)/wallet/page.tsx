"use client";

import { useState, useEffect, useTransition } from "react";
import { useUserStore } from "@/stores/user-store";
import { useToastStore } from "@/stores/toast-store";
import { deposit, getBalance, getTransactionHistory } from "@/lib/wallet/actions";
import Link from "next/link";

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000];

type Transaction = {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
};

export default function WalletPage() {
  const { balance, setBalance } = useUserStore();
  const addToast = useToastStore((s) => s.addToast);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState("");

  useEffect(() => {
    loadBalance();
    loadTransactions(1).finally(() => setLoading(false));
  }, []);

  async function loadBalance() {
    try {
      const result = await getBalance();
      setBalance(result.balance);
    } catch {
      // Balance already loaded from session
    }
  }

  async function loadTransactions(p: number) {
    try {
      const result = await getTransactionHistory(p, 10);
      setTransactions(result.transactions);
      setTotalPages(result.pages);
      setPage(p);
    } catch {
      // No transactions yet
    }
  }

  function handleDeposit(amount: number) {
    startTransition(async () => {
      const result = await deposit(amount);
      if ("error" in result) {
        addToast(result.error!, "error");
      } else {
        setBalance(result.balance);
        addToast(`Deposited $${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, "success");
        loadTransactions(1);
      }
    });
  }

  function handleCustomDeposit() {
    const amount = parseFloat(customAmount);
    if (!amount || amount <= 0 || amount > 100000) {
      addToast("Enter a valid amount (1 - 100,000)", "warning");
      return;
    }
    handleDeposit(amount);
    setCustomAmount("");
  }

  const typeColors: Record<string, string> = {
    DEPOSIT: "text-casino-green",
    WIN: "text-casino-green",
    BET: "text-casino-red",
    BONUS: "text-casino-orange",
  };

  const typeIcons: Record<string, string> = {
    DEPOSIT: "+",
    WIN: "+",
    BET: "-",
    BONUS: "+",
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Balance Card */}
      <div className="bg-casino-surface border border-casino-border rounded-casino p-8">
        <p className="text-casino-text-secondary text-sm mb-1">Total Balance</p>
        <p className="text-4xl font-bold text-casino-text">
          ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-casino-text-muted text-xs mt-1">Demo Credits</p>
      </div>

      {/* Quick Deposit */}
      <div className="bg-casino-surface border border-casino-border rounded-casino p-6">
        <h2 className="text-lg font-semibold text-casino-text mb-4">Quick Deposit</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
          {QUICK_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => handleDeposit(amount)}
              disabled={isPending}
              className="bg-casino-surface-light hover:bg-casino-surface-hover border border-casino-border rounded-casino py-3 text-casino-text font-semibold text-sm transition-colors disabled:opacity-50"
            >
              ${amount.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="flex gap-3">
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Custom amount..."
            className="flex-1 bg-casino-surface-light border border-casino-border rounded-casino px-4 py-2.5 text-casino-text text-sm placeholder:text-casino-text-muted focus:outline-none focus:border-casino-green"
          />
          <button
            onClick={handleCustomDeposit}
            disabled={isPending}
            className="bg-casino-green hover:bg-casino-green-hover text-casino-bg font-semibold text-sm px-6 py-2.5 rounded-casino transition-colors disabled:opacity-50"
          >
            Deposit
          </button>
        </div>

        <div className="mt-4">
          <Link
            href="/wallet/deposit"
            className="text-casino-text-secondary hover:text-casino-text text-sm underline transition-colors"
          >
            View deposit options (crypto addresses)
          </Link>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-casino-surface border border-casino-border rounded-casino p-6">
        <h2 className="text-lg font-semibold text-casino-text mb-4">Transaction History</h2>

        {loading ? (
          <div className="space-y-3 py-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-casino-elevated animate-pulse rounded-casino" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-casino-text-muted text-sm text-center py-8">
            No transactions yet. Make a deposit to get started!
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-casino-border">
                    <th className="text-left py-3 px-2 text-casino-text-muted font-medium">Type</th>
                    <th className="text-left py-3 px-2 text-casino-text-muted font-medium">Description</th>
                    <th className="text-right py-3 px-2 text-casino-text-muted font-medium">Amount</th>
                    <th className="text-right py-3 px-2 text-casino-text-muted font-medium">Balance</th>
                    <th className="text-right py-3 px-2 text-casino-text-muted font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-casino-border/50 hover:bg-casino-surface-light/50">
                      <td className="py-3 px-2">
                        <span className={`font-semibold ${typeColors[tx.type] || "text-casino-text"}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-casino-text-secondary">{tx.description}</td>
                      <td className={`py-3 px-2 text-right font-medium ${typeColors[tx.type] || "text-casino-text"}`}>
                        {typeIcons[tx.type]}${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 text-right text-casino-text-secondary">
                        ${tx.balanceAfter.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 text-right text-casino-text-muted">
                        {new Date(tx.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => loadTransactions(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm rounded-casino bg-casino-surface-light border border-casino-border text-casino-text-secondary hover:text-casino-text disabled:opacity-30 transition-colors"
                >
                  Prev
                </button>
                <span className="text-sm text-casino-text-muted px-3">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => loadTransactions(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-sm rounded-casino bg-casino-surface-light border border-casino-border text-casino-text-secondary hover:text-casino-text disabled:opacity-30 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
