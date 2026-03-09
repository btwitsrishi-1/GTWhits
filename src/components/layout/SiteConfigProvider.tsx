"use client";

import { useEffect } from "react";
import { useSiteConfigStore } from "@/stores/site-config-store";

export default function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const fetchConfig = useSiteConfigStore((s) => s.fetchConfig);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return <>{children}</>;
}
