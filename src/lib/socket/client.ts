"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Check if Socket.io is configured.
 * On Vercel (serverless), Socket.io won't be available unless
 * NEXT_PUBLIC_SOCKET_URL is explicitly set to a running Socket.io server.
 */
function isSocketEnabled(): boolean {
  // If NEXT_PUBLIC_SOCKET_URL is set, use that URL
  // Otherwise, Socket.io is not available (e.g., on Vercel serverless)
  return !!process.env.NEXT_PUBLIC_SOCKET_URL;
}

export function getSocket(username?: string): Socket | null {
  if (!isSocketEnabled()) return null;

  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL!;
    socket = io(url, {
      path: "/socket.io",
      query: { username: username || "Anonymous" },
      autoConnect: false,
      reconnectionAttempts: 3,
      timeout: 5000,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function isSocketAvailable(): boolean {
  return isSocketEnabled();
}
