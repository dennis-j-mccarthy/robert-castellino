import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { clearConnection } from "@/lib/meta/store";

export const runtime = "nodejs";

// Forget the stored tokens. (Bob can also remove the app from
// facebook.com/settings → Business Integrations.)
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await clearConnection();
  return NextResponse.json({ ok: true });
}
