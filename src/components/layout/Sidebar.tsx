"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useSiteConfigStore } from "@/stores/site-config-store";

const navItems = [
  {
    label: "Lobby",
    href: "/casino",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  { type: "divider" as const, label: "Games" },
  {
    label: "Mines",
    href: "/games/mines",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M6.938 4h10.124c1.054 0 2.012.616 2.447 1.577l3.416 7.544a2.75 2.75 0 01-2.447 3.879H3.522a2.75 2.75 0 01-2.447-3.879l3.416-7.544A2.75 2.75 0 016.938 4z" />
      </svg>
    ),
  },
  {
    label: "Plinko",
    href: "/games/plinko",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="5" r="2" />
        <circle cx="8" cy="10" r="1.5" />
        <circle cx="16" cy="10" r="1.5" />
        <circle cx="6" cy="15" r="1.5" />
        <circle cx="12" cy="15" r="1.5" />
        <circle cx="18" cy="15" r="1.5" />
        <circle cx="12" cy="20" r="2" />
      </svg>
    ),
  },
  {
    label: "Roulette",
    href: "/games/roulette",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 110 12 6 6 0 010-12zm0 3a3 3 0 100 6 3 3 0 000-6z" />
      </svg>
    ),
  },
  {
    label: "Blackjack",
    href: "/games/blackjack",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" />
      </svg>
    ),
  },
  { type: "divider" as const, label: "Account" },
  {
    label: "Wallet",
    href: "/wallet",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/profile",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    label: "History",
    href: "/profile/history",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Provably Fair",
    href: "/provably-fair",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

function SidebarContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const showProvablyFair = useSiteConfigStore((s) => s.showProvablyFair);

  const filteredItems = navItems.filter((item) => {
    if ("href" in item && item.href === "/provably-fair" && !showProvablyFair) {
      return false;
    }
    return true;
  });

  return (
    <nav className="flex-1 px-2 space-y-1">
      {filteredItems.map((item, i) => {
        if ("type" in item && item.type === "divider") {
          return collapsed ? (
            <div key={i} className="border-t border-casino-border my-2" />
          ) : (
            <div key={i} className="px-3 pt-4 pb-1">
              <span className="text-xs font-semibold text-casino-text-muted uppercase tracking-wider">
                {item.label}
              </span>
            </div>
          );
        }

        if (!("href" in item)) return null;

        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-casino text-sm font-medium transition-colors ${
              isActive
                ? "bg-casino-surface-light text-casino-green"
                : "text-casino-text-secondary hover:bg-casino-surface-light hover:text-casino-text"
            }`}
            title={collapsed ? item.label : undefined}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar() {
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebarStore();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex bg-casino-surface h-full flex-col border-r border-casino-border transition-all duration-300 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <div className="p-3 flex justify-end">
          <button
            onClick={toggle}
            className="p-2 rounded-casino hover:bg-casino-surface-light text-casino-text-muted hover:text-casino-text transition-colors"
          >
            <svg
              className={`w-5 h-5 transition-transform ${collapsed ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-casino-surface border-r border-casino-border z-50 md:hidden transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-3 flex items-center justify-between">
          <span className="text-lg font-bold text-casino-green">CasinoR</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-casino hover:bg-casino-surface-light text-casino-text-muted hover:text-casino-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
