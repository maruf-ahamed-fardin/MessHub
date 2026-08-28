import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDbConfig() {
  const envDbUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "";
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN || undefined;

  // 1. Remote Turso / libSQL Cloud Database (Recommended for serverless cloud deployments)
  if (
    envDbUrl.startsWith("libsql://") ||
    envDbUrl.startsWith("https://") ||
    envDbUrl.startsWith("http://")
  ) {
    return {
      url: envDbUrl,
      authToken,
    };
  }

  // 2. Serverless Environment (Vercel, Netlify, AWS Lambda)
  // On serverless, process.cwd() is read-only (/var/task). We copy & use /tmp/dev.db for write access.
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NETLIFY ||
    process.env.NEXT_RUNTIME === "edge"
  );

  let localFilePath = envDbUrl.startsWith("file:")
    ? envDbUrl.replace(/^file:/, "")
    : path.resolve(process.cwd(), "prisma/dev.db");

  if (!path.isAbsolute(localFilePath)) {
    localFilePath = path.resolve(process.cwd(), localFilePath);
  }

  if (isServerless) {
    const tmpDir = "/tmp";
    const tmpDbPath = path.join(tmpDir, "dev.db");
    try {
      if (!fs.existsSync(tmpDbPath)) {
        if (fs.existsSync(localFilePath)) {
          fs.copyFileSync(localFilePath, tmpDbPath);
        } else {
          const altPath = path.resolve(process.cwd(), "prisma/dev.db");
          if (fs.existsSync(altPath)) {
            fs.copyFileSync(altPath, tmpDbPath);
          }
        }
      }
      localFilePath = tmpDbPath;
    } catch (err) {
      console.warn("[Prisma DB] Notice during /tmp sqlite initialization:", err);
    }
  }

  return {
    url: `file:${localFilePath}`,
  };
}

export function createPrismaClient(): PrismaClient {
  const config = getDbConfig();
  const adapter = new PrismaLibSql(config);
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

