"use client";

import { useSession, signOut } from "next-auth/react";
import { useUserStore } from "@/stores/user-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useSoundStore } from "@/stores/sound-store";
import { useChatStore } from "@/stores/chat-store";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function Header() {
  const { data: session } = useSession();
  const { balance } = useUserStore();
  const { setMobileOpen } = useSidebarStore();
  const { enabled: soundEnabled, toggle: toggleSound } = useSoundStore();
  const { toggleOpen: toggleChat, unreadCount, isOpen: chatOpen } = useChatStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayBalance = balance.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <header className="bg-casino-surface border-b border-casino-border h-16 flex items-center justify-between px-4 md:px-6">
      {/* Left: hamburger + logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-casino hover:bg-casino-surface-light text-casino-text-muted hover:text-casino-text transition-colors md:hidden"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link href="/casino" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-casino-green">CasinoR</span>
        </Link>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Balance */}
        <div className="bg-casino-surface-light border border-casino-border rounded-casino px-4 py-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-casino-orange" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span className="text-casino-text font-semibold text-sm">
            ${displayBalance}
          </span>
        </div>

        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          className="p-2 rounded-casino hover:bg-casino-surface-light text-casino-text-muted hover:text-casino-text transition-colors"
          title={soundEnabled ? "Mute sounds" : "Unmute sounds"}
        >
          {soundEnabled ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8H4a1 1 0 00-1 1v6a1 1 0 001 1h2.5l4.5 4V4L6.5 8z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          )}
        </button>

        {/* Chat toggle */}
        <button
          onClick={toggleChat}
          className="relative p-2 rounded-casino hover:bg-casino-surface-light text-casino-text-muted hover:text-casino-text transition-colors hidden lg:block"
          title={chatOpen ? "Close chat" : "Open chat"}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-casino-red text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Wallet button */}
        <Link
          href="/wallet"
          className="bg-casino-green hover:bg-casino-green-hover text-casino-bg font-semibold text-sm px-4 py-2 rounded-casino transition-colors hidden sm:block"
        >
          Wallet
        </Link>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-casino hover:bg-casino-surface-light transition-colors"
          >
            <div className="w-8 h-8 bg-casino-surface-hover rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-casino-text">
                {session?.user?.name?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <span className="text-sm text-casino-text-secondary hidden sm:block">
              {session?.user?.name || "User"}
            </span>
            <svg className="w-4 h-4 text-casino-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-casino-surface-light border border-casino-border rounded-casino shadow-lg z-50">
              <Link
                href="/profile"
                className="block px-4 py-2.5 text-sm text-casino-text-secondary hover:text-casino-text hover:bg-casino-surface-hover rounded-t-casino transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                Profile
              </Link>
              <Link
                href="/wallet"
                className="block px-4 py-2.5 text-sm text-casino-text-secondary hover:text-casino-text hover:bg-casino-surface-hover transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                Wallet
              </Link>
              {session?.user?.role === "ADMIN" && (
                <Link
                  href="/dashboard"
                  className="block px-4 py-2.5 text-sm text-casino-orange hover:bg-casino-surface-hover transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
              <div className="border-t border-casino-border" />
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-left px-4 py-2.5 text-sm text-casino-red hover:bg-casino-surface-hover rounded-b-casino transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
