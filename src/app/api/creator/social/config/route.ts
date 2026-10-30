import { NextResponse } from "next/server";
import { creatorGuard } from "@/lib/creator/guard";
import { hasAnthropicKey } from "@/lib/creator/ai";
import { getConnection, isConnected } from "@/lib/meta/store";

/*
  GET /api/creator/social/config — is publishing available, and to what?
  → { connected, page, pageId, instagram, ai }
  Reads the same Meta connection the existing /admin/social uses
  (META_PAGE_ID + META_PAGE_TOKEN from env, else the MetaConnection row).
  Never returns a token.
*/

export const runtime = "nodejs";

export async function GET() {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  const conn = await getConnection();
  return NextResponse.json({
    connected: isConnected(conn),
    page: conn?.pageName ?? null,
    pageId: conn?.pageId ?? null,
    instagram: !!conn?.igUserId,
    ai: hasAnthropicKey(),
  });
}
