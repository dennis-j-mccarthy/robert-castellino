import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isMetaConfigured } from "@/lib/meta/config";
import { getConnection, isConnected } from "@/lib/meta/store";

export const runtime = "nodejs";

// Lightweight status for the admin Social page. Never returns tokens.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const configured = isMetaConfigured();
  const conn = await getConnection();
  return NextResponse.json({
    configured,
    connected: isConnected(conn),
    page: conn?.pageName ?? null,
    instagram: conn?.igUsername ?? null,
    fbUser: conn?.fbUserName ?? null,
    tokenExpiresAt: conn?.tokenExpiresAt ?? null,
    connectedAt: conn?.connectedAt ?? null,
  });
}
