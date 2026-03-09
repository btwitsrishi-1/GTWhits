import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure server-only packages aren't bundled into client code
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg", "bcryptjs"],
};

export default nextConfig;
