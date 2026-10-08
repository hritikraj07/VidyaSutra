import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Resolves the appropriate SQLite database URL.
 * In serverless environments (e.g. Vercel / AWS Lambda), the deployment directory
 * (/var/task) is read-only. SQLite requires write permissions to create journal/WAL files
 * and persist changes. Therefore, on Vercel, we copy the seeded SQLite database from the
 * project bundle to /tmp/dev.db and point the connection to file:/tmp/dev.db.
 */
function getDatabaseUrl(): string {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (isServerless) {
    const tmpDbPath = '/tmp/dev.db';

    if (!fs.existsSync(tmpDbPath)) {
      const sourceDb = path.join(process.cwd(), 'prisma', 'dev.db');
      if (fs.existsSync(sourceDb)) {
        try {
          fs.copyFileSync(sourceDb, tmpDbPath);
        } catch (err) {
          console.error(`Failed to copy database from ${sourceDb} to ${tmpDbPath}:`, err);
        }
      }
    }

    return `file:${tmpDbPath}`;
  }

  // Local development / testing: use DATABASE_URL or fallback to relative SQLite path
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const localDb = path.resolve('./prisma/dev.db').replace(/\\/g, '/');
  return `file:${localDb}`;
}

function createPrismaClient(): PrismaClient {
  const dbUrl = getDatabaseUrl();
  return new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// Lazy proxy ensures new PrismaClient() is never invoked during module evaluation / build-time page collection
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export default prisma;
