import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { OAUTH_DIALOG, SCOPES, appId, isMetaConfigured, redirectUri } from "@/lib/meta/config";

export const runtime = "nodejs";

// Admin clicks "Connect Facebook" → we bounce to Meta's OAuth dialog.
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isMetaConfigured()) {
    return NextResponse.redirect(
      new URL("/admin/social?error=not_configured", req.url),
    );
  }

  const origin = new URL(req.url).origin;
  const state = crypto.randomUUID();
  (await cookies()).set("meta_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const url = new URL(OAUTH_DIALOG);
  url.searchParams.set("client_id", appId()!);
  url.searchParams.set("redirect_uri", redirectUri(origin));
  url.searchParams.set("state", state);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("response_type", "code");

  return NextResponse.redirect(url.toString());
}
