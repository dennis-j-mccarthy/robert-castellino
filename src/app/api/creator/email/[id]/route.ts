import { NextResponse } from "next/server";
import { deleteEmailDraft, getEmailDraft, isEmailStatus, updateEmailDraft, type EmailDraftPatch } from "@/lib/creator/email-store";
import { creatorDbGuard, errorResponse, readJson } from "@/lib/creator/guard";

/*
  /api/creator/email/[id] — one EmailDraft.
    GET    → { draft }  (html + text included)
    PATCH  { name?, subject?, preheader?, html?, text?, status? } → { draft }
    DELETE → { ok }
  Nothing here sends mail; "sent" is a label set by hand.
*/

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const { id } = await params;
  try {
    const draft = await getEmailDraft(id);
    if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ draft });
  } catch (err) {
    return errorResponse(err, "Database error");
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  const { id } = await params;
  const patch: EmailDraftPatch = {};
  for (const k of ["name", "subject", "preheader", "html", "text"] as const) {
    if (typeof body[k] === "string") patch[k] = body[k] as string;
  }
  if (isEmailStatus(body.status)) patch.status = body.status;
  try {
    const draft = await updateEmailDraft(id, patch);
    if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ draft });
  } catch (err) {
    return errorResponse(err, "Database error");
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const { id } = await params;
  const ok = await deleteEmailDraft(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
