/**
 * Persistence for the single Meta connection row. Reads/writes the
 * `MetaConnection` singleton (id = "default"). All callers tolerate a
 * missing DB by returning null, matching the rest of the app.
 */

import { prisma, isDatabaseConfigured } from "@/lib/prisma";

const ID = "default";

export interface MetaConnection {
  fbUserId: string | null;
  fbUserName: string | null;
  fbUserToken: string | null;
  pageId: string | null;
  pageName: string | null;
  pageToken: string | null;
  igUserId: string | null;
  igUsername: string | null;
  adAccountId: string | null;
  scopes: string | null;
  tokenExpiresAt: Date | null;
  connectedAt: Date | null;
}

export async function getConnection(): Promise<MetaConnection | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const row = await prisma.metaConnection.findUnique({ where: { id: ID } });
    return (row as MetaConnection | null) ?? null;
  } catch {
    return null;
  }
}

export async function saveConnection(
  data: Partial<MetaConnection>,
): Promise<void> {
  if (!isDatabaseConfigured()) {
    throw new Error("Database not configured — cannot store Meta connection.");
  }
  await prisma.metaConnection.upsert({
    where: { id: ID },
    create: { id: ID, ...data },
    update: { ...data },
  });
}

export async function clearConnection(): Promise<void> {
  if (!isDatabaseConfigured()) return;
  try {
    await prisma.metaConnection.delete({ where: { id: ID } });
  } catch {
    /* already gone */
  }
}

/** True when we have a Page token ready to publish with. */
export function isConnected(c: MetaConnection | null): c is MetaConnection {
  return !!c && !!c.pageId && !!c.pageToken;
}
