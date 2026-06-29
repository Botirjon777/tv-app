// Data layer for hotel-menu — a single PrismaClient backed by MongoDB
// (DATABASE_URL). The app is fully self-contained: Next.js route handlers talk
// to this client directly, so there's no separate backend to run.

import { PrismaClient } from "@prisma/client";

// Reuse one client across hot reloads / serverless invocations to avoid
// exhausting database connections.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
