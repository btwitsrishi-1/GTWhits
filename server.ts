import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { parse } from "url";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
  type: "chat" | "system" | "bigwin";
}

const recentMessages: ChatMessage[] = [];
const MAX_MESSAGES = 100;
const RATE_LIMIT_MS = 1000;
const userLastMessage = new Map<string, number>();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*" },
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    const username = (socket.handshake.query.username as string) || "Anonymous";

    // Send recent messages to newly connected user
    socket.emit("chat:history", recentMessages.slice(-50));

    // Broadcast online count
    const broadcastOnlineCount = () => {
      io.emit("chat:online", io.engine.clientsCount);
    };
    broadcastOnlineCount();

    // System message for join
    const joinMsg: ChatMessage = {
      id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      username: "System",
      message: `${username} joined the chat`,
      timestamp: Date.now(),
      type: "system",
    };
    io.emit("chat:message", joinMsg);

    // Handle chat messages
    socket.on("chat:send", (message: string) => {
      if (!message || typeof message !== "string") return;
      const trimmed = message.trim().slice(0, 200);
      if (!trimmed) return;

      // Rate limit
      const now = Date.now();
      const last = userLastMessage.get(socket.id) || 0;
      if (now - last < RATE_LIMIT_MS) {
        socket.emit("chat:error", "Slow down! Wait a moment before sending.");
        return;
      }
      userLastMessage.set(socket.id, now);

      const chatMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        username,
        message: trimmed,
        timestamp: Date.now(),
        type: "chat",
      };

      recentMessages.push(chatMsg);
      if (recentMessages.length > MAX_MESSAGES) {
        recentMessages.splice(0, recentMessages.length - MAX_MESSAGES);
      }

      io.emit("chat:message", chatMsg);
    });

    // Handle big win broadcasts
    socket.on("chat:bigwin", (data: { multiplier: number; amount: number; game: string }) => {
      if (!data || typeof data.multiplier !== "number") return;

      const bigWinMsg: ChatMessage = {
        id: `win-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        username,
        message: `won ${data.multiplier.toFixed(2)}x ($${data.amount.toFixed(2)}) on ${data.game}!`,
        timestamp: Date.now(),
        type: "bigwin",
      };

      recentMessages.push(bigWinMsg);
      if (recentMessages.length > MAX_MESSAGES) {
        recentMessages.splice(0, recentMessages.length - MAX_MESSAGES);
      }

      io.emit("chat:message", bigWinMsg);
    });

    socket.on("disconnect", () => {
      userLastMessage.delete(socket.id);
      broadcastOnlineCount();

      const leaveMsg: ChatMessage = {
        id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        username: "System",
        message: `${username} left the chat`,
        timestamp: Date.now(),
        type: "system",
      };
      io.emit("chat:message", leaveMsg);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
