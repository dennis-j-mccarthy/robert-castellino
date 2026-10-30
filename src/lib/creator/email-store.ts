import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

/*
  EmailDraft persistence (/creator/email). Callers check isDatabaseConfigured()
  first. Dates come back as ISO strings.
*/

export type EmailStatus = "proposed" | "ready" | "sent";

export interface EmailDraftRecord {
  id: string;
  name: string;
  subject: string;
  preheader: string;
  html: string;
  text: string;
  pillarId: string | null;
  musingIds: string[];
  status: EmailStatus;
  createdAt: string;
  updatedAt: string;
}

export type EmailDraftSummary = Omit<EmailDraftRecord, "html" | "text">;

type Row = Omit<EmailDraftRecord, "status" | "createdAt" | "updatedAt"> & {
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export function isEmailStatus(v: unknown): v is EmailStatus {
  return v === "proposed" || v === "ready" || v === "sent";
}

function toRecord(r: Row): EmailDraftRecord {
  return {
    ...r,
    status: isEmailStatus(r.status) ? r.status : "proposed",
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function listEmailDrafts(): Promise<EmailDraftSummary[]> {
  const rows = await prisma.emailDraft.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 200,
    select: { id: true, name: true, subject: true, preheader: true, pillarId: true, musingIds: true, status: true, createdAt: true, updatedAt: true },
  });
  return rows.map((r) => {
    const rec = toRecord({ ...r, html: "", text: "" });
    const { html: _h, text: _t, ...rest } = rec;
    void _h;
    void _t;
    return rest;
  });
}

export async function getEmailDraft(id: string): Promise<EmailDraftRecord | null> {
  const row = await prisma.emailDraft.findUnique({ where: { id } });
  return row ? toRecord(row) : null;
}

export async function createEmailDraft(input: {
  name: string;
  subject: string;
  preheader?: string;
  html: string;
  text: string;
  pillarId?: string | null;
  musingIds?: string[];
}): Promise<EmailDraftRecord> {
  const row = await prisma.emailDraft.create({
    data: {
      name: input.name.trim().slice(0, 200),
      subject: input.subject.trim().slice(0, 300),
      preheader: (input.preheader ?? "").trim().slice(0, 300),
      html: input.html,
      text: input.text,
      pillarId: input.pillarId || null,
      musingIds: input.musingIds ?? [],
      status: "proposed",
    },
  });
  return toRecord(row);
}

export interface EmailDraftPatch {
  name?: string;
  subject?: string;
  preheader?: string;
  html?: string;
  text?: string;
  status?: EmailStatus;
}

export async function updateEmailDraft(id: string, patch: EmailDraftPatch): Promise<EmailDraftRecord | null> {
  const data: Prisma.EmailDraftUpdateInput = {};
  if (typeof patch.name === "string") data.name = patch.name.trim().slice(0, 200);
  if (typeof patch.subject === "string") data.subject = patch.subject.trim().slice(0, 300);
  if (typeof patch.preheader === "string") data.preheader = patch.preheader.trim().slice(0, 300);
  if (typeof patch.html === "string") data.html = patch.html;
  if (typeof patch.text === "string") data.text = patch.text;
  if (isEmailStatus(patch.status)) data.status = patch.status;
  try {
    const row = await prisma.emailDraft.update({ where: { id }, data });
    return toRecord(row);
  } catch {
    return null;
  }
}

export async function deleteEmailDraft(id: string): Promise<boolean> {
  try {
    await prisma.emailDraft.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
