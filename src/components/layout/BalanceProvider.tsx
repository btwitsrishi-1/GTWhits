"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/stores/user-store";

export default function BalanceProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    if (session?.user) {
      setUser({
        balance: parseFloat(session.user.balance || "0"),
        username: session.user.name || "",
        role: session.user.role || "USER",
      });
    }
  }, [session, setUser]);

  return <>{children}</>;
}
