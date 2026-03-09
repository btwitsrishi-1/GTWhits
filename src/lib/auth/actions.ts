"use server";

import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod/v4";
import { signIn } from "@/lib/auth/config";

const registerSchema = z.object({
  email: z.email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be at most 100 characters"),
});

export async function register(formData: FormData) {
  const rawData = {
    email: formData.get("email") as string,
    username: formData.get("username") as string,
    password: formData.get("password") as string,
  };

  const parsed = registerSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: z.prettifyError(parsed.error) };
  }

  const { email, username, password } = parsed.data;

  // Check for existing user
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return { error: "Email already registered" };
    }
    return { error: "Username already taken" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Generate provably fair seeds
  const serverSeed = crypto.randomBytes(32).toString("hex");
  const serverSeedHash = crypto
    .createHash("sha256")
    .update(serverSeed)
    .digest("hex");
  const clientSeed = crypto.randomBytes(16).toString("hex");

  // Create user, wallet, and seed atomically
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        username,
        passwordHash,
      },
    });

    await tx.wallet.create({
      data: {
        userId: user.id,
        balance: 10000,
      },
    });

    await tx.seed.create({
      data: {
        userId: user.id,
        serverSeed,
        serverSeedHash,
        clientSeed,
      },
    });
  });

  // Auto sign in after registration
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { success: true };
  } catch {
    return { success: true, requiresLogin: true };
  }
}
