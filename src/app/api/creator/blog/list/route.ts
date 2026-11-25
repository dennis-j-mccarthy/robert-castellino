import { NextResponse } from "next/server";
import { creatorGuard } from "@/lib/creator/guard";
import { adapters } from "@/studio.adapters";

/* GET → { items: ContentPost[] } through the content adapter. */
export async function GET() {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  const items = await adapters.content.list().catch(() => []);
  return NextResponse.json({ items });
}
