"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useChatStore, type ChatMessage } from "@/stores/chat-store";
import { getSocket, disconnectSocket, isSocketAvailable } from "@/lib/socket/client";

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const USERNAME_COLORS = [
  "text-blue-400",
  "text-green-400",
  "text-yellow-400",
  "text-purple-400",
  "text-pink-400",
  "text-cyan-400",
  "text-orange-400",
  "text-rose-400",
];

function getUsernameColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USERNAME_COLORS[Math.abs(hash) % USERNAME_COLORS.length];
}

function ChatMessageItem({ msg }: { msg: ChatMessage }) {
  if (msg.type === "system") {
    return (
      <div className="text-xs text-casino-text-muted text-center py-1 italic">
        {msg.message}
      </div>
    );
  }

  if (msg.type === "bigwin") {
    return (
      <div className="bg-casino-green/10 border border-casino-green/20 rounded-casino px-3 py-2 my-1">
        <div className="flex items-center gap-1.5">
          <span className="text-casino-green text-xs">&#9733;</span>
          <span className={`text-xs font-semibold ${getUsernameColor(msg.username)}`}>
            {msg.username}
          </span>
          <span className="text-xs text-casino-green font-medium">{msg.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-1 hover:bg-casino-surface-light/30 group">
      <div className="flex items-baseline gap-1.5">
        <span className="text-xs text-casino-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {formatTime(msg.timestamp)}
        </span>
        <span className={`text-xs font-semibold shrink-0 ${getUsernameColor(msg.username)}`}>
          {msg.username}:
        </span>
        <span className="text-xs text-casino-text-secondary break-words">{msg.message}</span>
      </div>
    </div>
  );
}

export default function ChatSidebar() {
  const { data: session } = useSession();
  const {
    messages,
    isOpen,
    onlineCount,
    connected,
    addMessage,
    setHistory,
    setOnlineCount,
    setConnected,
  } = useChatStore();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const connectedRef = useRef(false);

  const socketEnabled = isSocketAvailable();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Socket.io connection
  useEffect(() => {
    if (!socketEnabled || !session?.user?.name || connectedRef.current) return;
    connectedRef.current = true;

    const socket = getSocket(session.user.name);
    if (!socket) return;

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("chat:history", (msgs: ChatMessage[]) => {
      setHistory(msgs);
    });

    socket.on("chat:message", (msg: ChatMessage) => {
      addMessage(msg);
    });

    socket.on("chat:online", (count: number) => {
      setOnlineCount(count);
    });

    socket.on("chat:error", (error: string) => {
      addMessage({
        id: `err-${Date.now()}`,
        username: "System",
        message: error,
        timestamp: Date.now(),
        type: "system",
      });
    });

    socket.connect();

    return () => {
      disconnectSocket();
      connectedRef.current = false;
      setConnected(false);
    };
  }, [socketEnabled, session?.user?.name, addMessage, setHistory, setOnlineCount, setConnected]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !connected) return;

    const socket = getSocket();
    if (!socket) return;
    socket.emit("chat:send", trimmed);
    setInput("");
    inputRef.current?.focus();
  }, [input, connected]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  if (!isOpen) return null;

  // Show "unavailable" state when Socket.io is not configured (e.g., on Vercel)
  if (!socketEnabled) {
    return (
      <aside className="w-72 bg-casino-surface border-l border-casino-border flex flex-col h-full shrink-0 hidden lg:flex">
        <div className="flex items-center justify-between px-4 py-3 border-b border-casino-border">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-casino-text">Chat</h3>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-casino-text-muted" />
              <span className="text-xs text-casino-text-muted">offline</span>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-sm text-casino-text-muted mb-1">Chat Unavailable</p>
            <p className="text-xs text-casino-text-muted/70">
              Real-time chat requires a Socket.io server.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 bg-casino-surface border-l border-casino-border flex flex-col h-full shrink-0 hidden lg:flex">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-casino-border">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-casino-text">Chat</h3>
          <div className="flex items-center gap-1">
            <span
              className={`w-2 h-2 rounded-full ${connected ? "bg-casino-green" : "bg-casino-red"}`}
            />
            <span className="text-xs text-casino-text-muted">
              {onlineCount} online
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-2">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-casino-text-muted">No messages yet</p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessageItem key={msg.id} msg={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-casino-border p-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={connected ? "Type a message..." : "Connecting..."}
            disabled={!connected}
            maxLength={200}
            className="flex-1 bg-casino-bg border border-casino-border rounded-casino px-3 py-2 text-xs text-casino-text placeholder:text-casino-text-muted focus:outline-none focus:border-casino-orange disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!connected || !input.trim()}
            className="bg-casino-green hover:opacity-90 text-casino-bg text-xs font-semibold px-3 py-2 rounded-casino transition-colors disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </aside>
  );
}
