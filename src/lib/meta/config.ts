/**
 * Meta (Facebook / Instagram) app configuration.
 *
 * These come from the Meta App you create at developers.facebook.com
 * (App ID + App Secret). Until they're set, the Social tool shows a
 * "not configured" state and nothing calls Facebook — the rest of the
 * site is unaffected.
 *
 * Phase 1 uses the Graph API to publish/schedule Page posts. The scope
 * list also requests the permissions Phases 2–3 (ads, Instagram) will
 * use, so Bob only has to authorize once. In the app's Development mode,
 * these work for people with a role on the app (Bob as admin/tester)
 * without full App Review.
 */

export const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0";
export const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;
export const OAUTH_DIALOG = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`;

// Permissions requested at login. Publishing needs the pages_* set;
// ads_management and instagram_* are included for later phases.
export const SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "pages_manage_engagement",
  "business_management",
  "read_insights",
  "ads_management",
  "instagram_basic",
  "instagram_content_publish",
].join(",");

export function appId(): string | undefined {
  return process.env.META_APP_ID || process.env.FB_APP_ID;
}

export function appSecret(): string | undefined {
  return process.env.META_APP_SECRET || process.env.FB_APP_SECRET;
}

export function isMetaConfigured(): boolean {
  return !!appId() && !!appSecret();
}

/**
 * Absolute redirect URI Meta sends the user back to after login. Must be
 * listed verbatim in the Meta App's "Valid OAuth Redirect URIs". We derive
 * it from the incoming request origin so it works in local dev and prod;
 * META_REDIRECT_BASE can pin it if needed (e.g. behind a proxy).
 */
export function redirectUri(origin: string): string {
  const base = (process.env.META_REDIRECT_BASE || origin).replace(/\/$/, "");
  return `${base}/api/admin/meta/callback`;
}

/** Prefer a Page whose name looks like Bob's when auto-selecting. */
export const PREFERRED_PAGE_HINT = "castellino";
