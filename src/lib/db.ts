import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

declare global {
  var __fflTrainPrisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

/** Shared Prisma client, created on first use so `next build` needs no database. Reused across dev hot reloads. */
export function getDb(): PrismaClient {
  globalThis.__fflTrainPrisma ??= createClient();
  return globalThis.__fflTrainPrisma;
}
