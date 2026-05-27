import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Singleton Prisma client.
 *
 * Prisma 7 requires a driver adapter; we use `@prisma/adapter-pg` against
 * the `DATABASE_URL` connection string (Vercel Postgres provides one).
 *
 * If DATABASE_URL is not set we export a null-shaped client that throws
 * on use. The data-source layer in src/lib/data-source.ts checks
 * `isDatabaseConfigured()` first and short-circuits to the static
 * fallback when the DB is not wired — so the public site keeps working
 * with no env vars set.
 */

declare global {
  var __castellinoPrisma: PrismaClient | undefined;
}

function build(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Return a proxy that throws on any property access so accidental
    // use surfaces clearly during dev. The fallback layer should
    // prevent these calls in the first place.
    return new Proxy({} as PrismaClient, {
      get() {
        throw new Error(
          "Prisma was accessed but DATABASE_URL is not configured. " +
            "Use src/lib/data-source.ts for code that should fall back " +
            "to the static data files.",
        );
      },
    });
  }
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma: PrismaClient =
  globalThis.__castellinoPrisma ?? build();

if (process.env.NODE_ENV !== "production") {
  globalThis.__castellinoPrisma = prisma;
}

export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}
