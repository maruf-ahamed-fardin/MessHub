import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function createPrismaClient(): PrismaClient {
  const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
  const adapter = new PrismaLibSql({
    url: `file:${dbPath}`,
  });
  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  if (
    globalForPrisma.prisma &&
    typeof (globalForPrisma.prisma as any).bazarSwapRequest === "object"
  ) {
    return globalForPrisma.prisma;
  }
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = getPrisma();
