/**
 * Thin Meta Graph API client: OAuth token exchange + Page publishing.
 *
 * All network calls go through `graphGet` / `graphPost`, which surface
 * Meta's error payloads as thrown Errors so routes can report them.
 */

import { GRAPH, SCOPES, appId, appSecret } from "./config";

export class MetaError extends Error {
  type?: string;
  code?: number;
  subcode?: number;
  fbtraceId?: string;
  constructor(message: string, extra?: Record<string, unknown>) {
    super(message);
    this.name = "MetaError";
    if (extra) Object.assign(this, extra);
  }
}

type Json = Record<string, unknown>;

export async function handleGraphResponse(res: Response): Promise<Json> {
  const text = await res.text();
  let body: Json = {};
  try {
    body = text ? (JSON.parse(text) as Json) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok || (body.error as Json | undefined)) {
    const err = (body.error as Json | undefined) || {};
    // Marketing API errors carry a human-readable pair (title + msg) that is
    // far more useful than the generic `message`; prefer it when present.
    const userMsg = err.error_user_msg as string | undefined;
    const userTitle = err.error_user_title as string | undefined;
    const readable = userMsg
      ? userTitle && !userMsg.startsWith(userTitle)
        ? `${userTitle}: ${userMsg}`
        : userMsg
      : (err.message as string);
    throw new MetaError(
      readable || `Graph request failed (${res.status})`,
      {
        type: err.type as string,
        code: err.code as number,
        subcode: err.error_subcode as number,
        fbtraceId: err.fbtrace_id as string,
      },
    );
  }
  return body;
}

export async function graphGet(
  path: string,
  params: Record<string, string>,
): Promise<Json> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${GRAPH}/${path}?${qs}`, { cache: "no-store" });
  return handleGraphResponse(res);
}

export async function graphPost(
  path: string,
  params: Record<string, string>,
): Promise<Json> {
  const body = new URLSearchParams(params);
  const res = await fetch(`${GRAPH}/${path}`, {
    method: "POST",
    body,
    cache: "no-store",
  });
  return handleGraphResponse(res);
}

// ───────── OAuth ─────────

/** Exchange an OAuth `code` for a short-lived user access token. */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
): Promise<string> {
  const data = await graphGet("oauth/access_token", {
    client_id: appId()!,
    client_secret: appSecret()!,
    redirect_uri: redirectUri,
    code,
  });
  return data.access_token as string;
}

/** Upgrade a short-lived user token to a long-lived one (~60 days). */
export async function longLivedUserToken(
  shortToken: string,
): Promise<{ token: string; expiresInSec?: number }> {
  const data = await graphGet("oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: appId()!,
    client_secret: appSecret()!,
    fb_exchange_token: shortToken,
  });
  return {
    token: data.access_token as string,
    expiresInSec: data.expires_in as number | undefined,
  };
}

export interface MetaProfile {
  userId: string;
  userName: string;
  scopes: string;
}

export async function getMe(userToken: string): Promise<MetaProfile> {
  const me = await graphGet("me", {
    fields: "id,name",
    access_token: userToken,
  });
  return {
    userId: me.id as string,
    userName: me.name as string,
    scopes: SCOPES,
  };
}

export interface PageAsset {
  id: string;
  name: string;
  accessToken: string;
  igUserId?: string;
  igUsername?: string;
}

/** List the Pages this user manages, each with its own (long-lived) token. */
export async function getPages(userToken: string): Promise<PageAsset[]> {
  const data = await graphGet("me/accounts", {
    fields: "id,name,access_token,instagram_business_account{id,username}",
    access_token: userToken,
    limit: "100",
  });
  const rows = (data.data as Json[] | undefined) || [];
  return rows.map((r) => {
    const ig = r.instagram_business_account as Json | undefined;
    return {
      id: r.id as string,
      name: r.name as string,
      accessToken: r.access_token as string,
      igUserId: ig?.id as string | undefined,
      igUsername: ig?.username as string | undefined,
    };
  });
}

// ───────── Publishing ─────────

export interface PublishInput {
  pageId: string;
  pageToken: string;
  message: string;
  /** Publicly reachable image URL (Graph fetches it). Optional. */
  imageUrl?: string;
  /** ISO timestamp to schedule; omit to publish immediately. */
  scheduledAt?: string;
}

export interface PublishResult {
  id: string;
  scheduled: boolean;
  scheduledAt?: string;
}

// Meta requires scheduled times 10 minutes–6 months out.
const MIN_LEAD_SEC = 10 * 60 + 30;
const MAX_LEAD_SEC = 180 * 24 * 60 * 60;

export function toScheduledUnix(iso: string): number {
  const ts = Math.floor(new Date(iso).getTime() / 1000);
  if (!Number.isFinite(ts)) throw new MetaError("Invalid schedule time.");
  const lead = ts - Math.floor(Date.now() / 1000);
  if (lead < MIN_LEAD_SEC)
    throw new MetaError("Schedule a time at least ~15 minutes from now.");
  if (lead > MAX_LEAD_SEC)
    throw new MetaError("Schedule a time within the next 6 months.");
  return ts;
}

/**
 * Publish or schedule a post on the Page. With an image it posts a photo
 * (caption = message); without, a text/feed post. Scheduling sets
 * published=false + scheduled_publish_time.
 */
export async function publishPagePost(
  input: PublishInput,
): Promise<PublishResult> {
  const { pageId, pageToken, message, imageUrl, scheduledAt } = input;
  const scheduling = !!scheduledAt;
  const base: Record<string, string> = { access_token: pageToken };

  if (scheduling) {
    base.published = "false";
    base.scheduled_publish_time = String(toScheduledUnix(scheduledAt!));
  }

  let result: Json;
  if (imageUrl) {
    result = await graphPost(`${pageId}/photos`, {
      ...base,
      url: imageUrl,
      caption: message,
    });
  } else {
    result = await graphPost(`${pageId}/feed`, { ...base, message });
  }

  const id = (result.post_id as string) || (result.id as string);
  return { id, scheduled: scheduling, scheduledAt };
}

/** Delete a Page post (used to cancel a scheduled one). Code 100 = already gone. */
export async function deletePagePost(postId: string, pageToken: string): Promise<void> {
  const res = await fetch(`${GRAPH}/${postId}?${new URLSearchParams({ access_token: pageToken })}`, {
    method: "DELETE",
    cache: "no-store",
  });
  await handleGraphResponse(res);
}
