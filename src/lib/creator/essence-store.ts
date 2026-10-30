import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { Audience, BrandEssenceRecord, CoreMessage } from "@/lib/creator/pillars";
import { DEFAULT_VOICE, defaultEssence } from "@/lib/creator/seed-data";

/*
  BrandEssence singleton (id "default") — the Essence page. SERVER ONLY.

    getBrandEssence()   the row, or the seed defaults when there's no DB /
                        no row yet
    saveBrandEssence()  upsert (partial patch)

  Every generator reads this through src/lib/creator/brand-context.ts.
*/

const ID = "default";
const CAP = 600;
const LIST_CAP = 12;

function pct(v: unknown, fallback: number): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, n));
}

function str(v: unknown, cap = CAP): string {
  return String(v ?? "").trim().slice(0, cap);
}

function list(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => str(x, 160)).filter(Boolean).slice(0, LIST_CAP);
}

function strList(v: unknown, cap = 400): string[] {
  return Array.isArray(v) ? v.map((x) => str(x, cap)).filter(Boolean) : [];
}

export function cleanMessages(v: unknown): CoreMessage[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((m, i) => {
      const o = (m ?? {}) as Record<string, unknown>;
      return {
        id: str(o.id, 20) || `m${i + 1}`,
        pillar: str(o.pillar, 40),
        text: str(o.text, 200),
        captions: strList(o.captions),
        headlines: strList(o.headlines, 120),
      };
    })
    .filter((m) => m.text)
    .slice(0, 40);
}

export function cleanAudiences(v: unknown): Audience[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((a, i) => {
      const o = (a ?? {}) as Record<string, unknown>;
      const vb = o.vb && typeof o.vb === "object" ? (o.vb as Record<string, unknown>) : undefined;
      return {
        id: str(o.id, 20) || `au${i + 1}`,
        name: str(o.name, 120),
        sizeNote: str(o.sizeNote, 120),
        source: str(o.source, 160),
        subtype: str(o.subtype, 80),
        status: str(o.status, 80),
        created: str(o.created, 20),
        metaDef: o.metaDef ? str(o.metaDef, 600) : undefined,
        vb: vb ? Object.fromEntries(Object.entries(vb).map(([k, val]) => [k, str(val, 600)])) : undefined,
      };
    })
    .filter((a) => a.name)
    .slice(0, 40);
}

/** Normalise an essence payload off the wire (partial allowed). */
export function cleanEssenceInput(input: unknown): Partial<BrandEssenceRecord> {
  const e = (input ?? {}) as Record<string, unknown>;
  const out: Partial<BrandEssenceRecord> = {};
  if ("line" in e) out.line = str(e.line, 200);
  if ("purpose" in e) out.purpose = str(e.purpose);
  if ("promise" in e) out.promise = str(e.promise);
  if ("cta" in e) out.cta = str(e.cta, 200);
  if ("doList" in e) out.doList = list(e.doList);
  if ("dontList" in e) out.dontList = list(e.dontList);
  if ("voice" in e && e.voice && typeof e.voice === "object") {
    const v = e.voice as Record<string, unknown>;
    out.voice = {
      playful: pct(v.playful, DEFAULT_VOICE.playful),
      formal: pct(v.formal, DEFAULT_VOICE.formal),
      bold: pct(v.bold, DEFAULT_VOICE.bold),
    };
  }
  if ("messages" in e) out.messages = cleanMessages(e.messages);
  if ("audiences" in e) out.audiences = cleanAudiences(e.audiences);
  return out;
}

export async function getBrandEssence(): Promise<BrandEssenceRecord> {
  const base = defaultEssence();
  if (!isDatabaseConfigured()) return base;
  try {
    const row = await prisma.brandEssence.findUnique({ where: { id: ID } });
    if (!row) return base;
    const messages = cleanMessages(row.messages);
    const audiences = cleanAudiences(row.audiences);
    return {
      line: row.line || base.line,
      purpose: row.purpose || base.purpose,
      promise: row.promise || base.promise,
      doList: row.doList.length ? row.doList : base.doList,
      dontList: row.dontList.length ? row.dontList : base.dontList,
      voice: { playful: row.voicePlayful, formal: row.voiceFormal, bold: row.voiceBold },
      cta: row.cta || base.cta,
      messages: messages.length ? messages : base.messages,
      audiences: audiences.length ? audiences : base.audiences,
      updatedAt: row.updatedAt.toISOString(),
      fromDb: true,
    };
  } catch (err) {
    console.error("[creator/essence] read failed, using defaults:", err);
    return base;
  }
}

/** Upsert the singleton. Fields left undefined keep their stored value. */
export async function saveBrandEssence(patch: Partial<BrandEssenceRecord>): Promise<BrandEssenceRecord> {
  const current = await getBrandEssence();
  const next: BrandEssenceRecord = {
    ...current,
    ...patch,
    voice: { ...current.voice, ...(patch.voice ?? {}) },
  };
  const data = {
    line: next.line,
    purpose: next.purpose,
    promise: next.promise,
    doList: next.doList,
    dontList: next.dontList,
    voicePlayful: next.voice.playful,
    voiceFormal: next.voice.formal,
    voiceBold: next.voice.bold,
    cta: next.cta,
    messages: next.messages as unknown as Prisma.InputJsonValue,
    audiences: next.audiences as unknown as Prisma.InputJsonValue,
  };
  await prisma.brandEssence.upsert({ where: { id: ID }, create: { id: ID, ...data }, update: data });
  return getBrandEssence();
}
