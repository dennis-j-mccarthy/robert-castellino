import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { isMetaConfigured, redirectUri, PREFERRED_PAGE_HINT, SCOPES } from "@/lib/meta/config";
import {
  exchangeCodeForToken,
  longLivedUserToken,
  getMe,
  getPages,
} from "@/lib/meta/graph";
import { saveConnection } from "@/lib/meta/store";

export const runtime = "nodejs";

function back(req: Request, params: Record<string, string>) {
  const url = new URL("/admin/social", req.url);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url);
}

// Meta redirects here with ?code & ?state after the user authorizes.
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isMetaConfigured()) return back(req, { error: "not_configured" });

  const u = new URL(req.url);
  const code = u.searchParams.get("code");
  const state = u.searchParams.get("state");
  const denied = u.searchParams.get("error");
  if (denied) return back(req, { error: "declined" });
  if (!code) return back(req, { error: "no_code" });

  const expected = (await cookies()).get("meta_oauth_state")?.value;
  if (!expected || expected !== state) return back(req, { error: "bad_state" });

  try {
    const short = await exchangeCodeForToken(code, redirectUri(u.origin));
    const { token: userToken, expiresInSec } = await longLivedUserToken(short);
    const me = await getMe(userToken);
    const pages = await getPages(userToken);

    if (pages.length === 0) {
      return back(req, { error: "no_pages" });
    }
    // Prefer a Page that looks like Bob's; else the first one.
    const page =
      pages.find((p) => p.name.toLowerCase().includes(PREFERRED_PAGE_HINT)) ||
      pages[0];

    await saveConnection({
      fbUserId: me.userId,
      fbUserName: me.userName,
      fbUserToken: userToken,
      pageId: page.id,
      pageName: page.name,
      pageToken: page.accessToken,
      igUserId: page.igUserId ?? null,
      igUsername: page.igUsername ?? null,
      scopes: SCOPES,
      tokenExpiresAt: expiresInSec
        ? new Date(Date.now() + expiresInSec * 1000)
        : null,
      connectedAt: new Date(),
    });

    (await cookies()).delete("meta_oauth_state");
    return back(req, { connected: "1" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "connect_failed";
    return back(req, { error: "connect_failed", detail: msg.slice(0, 180) });
  }
}
