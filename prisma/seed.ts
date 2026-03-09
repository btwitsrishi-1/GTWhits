import "dotenv/config";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const { PrismaClient } = await import("../src/generated/prisma/client.js");
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 12);
    const serverSeed = crypto.randomBytes(32).toString("hex");
    const serverSeedHash = crypto.createHash("sha256").update(serverSeed).digest("hex");
    const clientSeed = crypto.randomBytes(16).toString("hex");

    const admin = await prisma.user.upsert({
      where: { email: "admin@casinor.com" },
      update: {},
      create: {
        email: "admin@casinor.com",
        username: "admin",
        passwordHash: adminPassword,
        role: "ADMIN",
        wallet: {
          create: {
            balance: 100000,
          },
        },
        seeds: {
          create: {
            serverSeed,
            serverSeedHash,
            clientSeed,
          },
        },
      },
    });

    console.log("Admin user created:", admin.email);

    // Create game configs for all game types
    const gameTypes = ["MINES", "PLINKO", "ROULETTE", "BLACKJACK"] as const;
    for (const gameType of gameTypes) {
      await prisma.gameConfig.upsert({
        where: { gameType },
        update: {},
        create: {
          gameType,
          fairnessMode: "PROVABLY_FAIR",
        },
      });
    }

    console.log("Game configs created for:", gameTypes.join(", "));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
