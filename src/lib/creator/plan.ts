import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { loadLibrary, type LibraryItem } from "@/lib/creator/library";
import { SITE } from "@/lib/creator/pillars";

/*
  Creator → Plan (tool 9). SERVER ONLY.

  PlanSettings is the rhythm Bob sets once: how often each thing goes out,
  which days, how much the studio does on its own, where the weekly plan is
  emailed. buildWeeklyPlan() turns that into PlanItems for one week (Monday
  to Sunday, Mountain time), saves them as a WeeklyPlan row, and the home
  screen renders them. runWeeklyPlan() is what the Monday-noon cron calls:
  build the coming week, email the summary.

  Nothing here publishes anything. Items are slots with a suggested plate and
  pillar; the tools (Posts, Newsletter, Email) fill them when Bob opens them,
  or on their own once autonomy is raised. v1 only ever drafts.
*/

export * from "./plan-types";
import { DEFAULT_PLAN, TZ, WEEKDAYS, type Autonomy, type PlanItem, type PlanItemState, type PlanSettings, type Weekday } from "./plan-types";

/* ───────── settings ───────── */

export function normalizeSettings(raw: unknown): PlanSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<PlanSettings>;
  const d = DEFAULT_PLAN;
  const days = Array.isArray(r.posts?.days) ? (r.posts!.days.filter((x) => Number.isInteger(x) && x >= 0 && x <= 6) as Weekday[]) : d.posts.days;
  return {
    posts: { perWeek: ([0, 1, 2, 3, 5, 7].includes(Number(r.posts?.perWeek)) ? Number(r.posts!.perWeek) : d.posts.perWeek) as PlanSettings["posts"]["perWeek"], days: days.length ? days : d.posts.days, time: timeOr(r.posts?.time, d.posts.time) },
    newsletter: { cadence: (["weekly", "biweekly", "monthly", "off"] as const).includes(r.newsletter?.cadence as never) ? r.newsletter!.cadence : d.newsletter.cadence, day: dayOr(r.newsletter?.day, d.newsletter.day), time: timeOr(r.newsletter?.time, d.newsletter.time) },
    email: { mode: r.email?.mode === "suggest-weekly" ? "suggest-weekly" : "as-needed" },
    leads: { cadence: (["off", "weekly", "monthly"] as const).includes(r.leads?.cadence as never) ? r.leads!.cadence : "off" },
    blog: { cadence: (["off", "monthly", "twice-monthly"] as const).includes(r.blog?.cadence as never) ? r.blog!.cadence : d.blog.cadence },
    autonomy: (["draft", "publish-posts", "publish-all"] as const).includes(r.autonomy as never) ? (r.autonomy as Autonomy) : "draft",
    arrival: { day: dayOr(r.arrival?.day, d.arrival.day), time: timeOr(r.arrival?.time, d.arrival.time) },
    notifyEmail: typeof r.notifyEmail === "string" ? r.notifyEmail.trim().slice(0, 160) : "",
  };
}
const timeOr = (v: unknown, d: string) => (typeof v === "string" && /^\d{2}:\d{2}$/.test(v) ? v : d);
const dayOr = (v: unknown, d: Weekday) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 6 ? (v as Weekday) : d);

export async function getPlanSettings(): Promise<PlanSettings> {
  if (!isDatabaseConfigured()) return DEFAULT_PLAN;
  try {
    const row = await prisma.creatorPlan.findUnique({ where: { id: "default" } });
    return normalizeSettings(row?.settings);
  } catch {
    return DEFAULT_PLAN;
  }
}

export async function savePlanSettings(raw: unknown): Promise<PlanSettings> {
  const settings = normalizeSettings(raw);
  await prisma.creatorPlan.upsert({ where: { id: "default" }, create: { id: "default", settings: settings as object }, update: { settings: settings as object } });
  return settings;
}

/* ───────── week math (Mountain time) ───────── */

function parts(d: Date) {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hour12: false });
  const o: Record<string, string> = {};
  for (const p of f.formatToParts(d)) o[p.type] = p.value;
  const wd = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(o.weekday) as Weekday;
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, min: +o.minute, wd };
}

/** The UTC offset (minutes) Mountain time has at a given instant. */
function offsetMin(d: Date): number {
  const p = parts(d);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min);
  return Math.round((asUtc - d.getTime()) / 60000);
}

/** A Mountain-time wall clock (y, m, d, hh:mm) as a UTC instant. */
export function denver(y: number, m: number, d: number, time = "00:00"): Date {
  const [hh, mm] = time.split(":").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  const off = offsetMin(guess);
  const out = new Date(guess.getTime() - off * 60000);
  // DST edge: re-check once.
  const off2 = offsetMin(out);
  return off2 === off ? out : new Date(guess.getTime() - off2 * 60000);
}

/** Monday 00:00 Mountain of the week containing `now` (or the next week when `next`). */
export function weekStart(now = new Date(), next = false): Date {
  const p = parts(now);
  const monday = new Date(Date.UTC(p.y, p.m - 1, p.d - p.wd + (next ? 7 : 0)));
  return denver(monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate(), "00:00");
}

export function dayOfWeek(weekStartUtc: Date, day: Weekday, time: string): Date {
  const p = parts(weekStartUtc);
  const d = new Date(Date.UTC(p.y, p.m - 1, p.d + day));
  return denver(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), time);
}

export function fmtDay(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", month: "short", day: "numeric" }).format(new Date(iso));
}
export function fmtTime(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

/* ───────── building the week ───────── */

/** ISO week number, for "every 2 weeks" and "monthly" decisions. */
function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - y0.getTime()) / 86400000 + 1) / 7);
}

function pickPlates(items: LibraryItem[], n: number, seed: number): LibraryItem[] {
  // Book plates first, spread across pillars, rotated by week so the feed never repeats.
  const pool = items.filter((i) => i.adEligible && i.inBook);
  const all = pool.length >= n ? pool : items.filter((i) => i.adEligible);
  if (!all.length) return [];
  const byPillar = new Map<string, LibraryItem[]>();
  for (const it of all) {
    const k = it.pillarId ?? "none";
    if (!byPillar.has(k)) byPillar.set(k, []);
    byPillar.get(k)!.push(it);
  }
  const keys = Array.from(byPillar.keys());
  const out: LibraryItem[] = [];
  for (let i = 0; out.length < n && i < n * 3; i++) {
    const list = byPillar.get(keys[(seed + i) % keys.length])!;
    const pick = list[(seed * 7 + i) % list.length];
    if (!out.includes(pick)) out.push(pick);
  }
  return out.slice(0, n);
}

export async function buildWeeklyPlan(settings: PlanSettings, start: Date): Promise<PlanItem[]> {
  const wk = isoWeek(start);
  const lib = await loadLibrary().catch(() => null);
  const items: PlanItem[] = [];
  const img = (it: LibraryItem | undefined) => (it ? { src: it.src, url: it.url, label: it.title ?? it.label, bookPage: it.bookPage } : null);

  // Posts
  const postDays = settings.posts.days.slice(0, settings.posts.perWeek === 7 ? 7 : settings.posts.perWeek);
  const days: Weekday[] = settings.posts.perWeek === 7 ? [0, 1, 2, 3, 4, 5, 6] : settings.posts.perWeek === 5 ? [0, 1, 2, 3, 4] : postDays;
  const plates = lib ? pickPlates(lib.items, days.length, wk) : [];
  days.forEach((day, i) => {
    const at = dayOfWeek(start, day, settings.posts.time);
    const plate = plates[i];
    items.push({
      id: `post-${day}`, kind: "post", at: at.toISOString(), day, state: "suggested",
      title: plate ? `Post · ${plate.title ?? plate.label}` : "Post",
      note: plate?.bookPage ? `Plate on page ${plate.bookPage} of the book` : undefined,
      image: img(plate), pillarId: plate?.pillarId ?? null,
      href: `/creator/social?${new URLSearchParams({ ...(plate ? { imageId: plate.src } : {}), ...(plate?.pillarId ? { pillar: plate.pillarId } : {}), at: localInput(at), platform: "facebook" }).toString()}`,
    });
  });

  // Newsletter
  const nl = settings.newsletter;
  const nlDue = nl.cadence === "weekly" || (nl.cadence === "biweekly" && wk % 2 === 0) || (nl.cadence === "monthly" && parts(start).d <= 7);
  if (nl.cadence !== "off" && nlDue) {
    const at = dayOfWeek(start, nl.day, nl.time);
    items.push({ id: "newsletter", kind: "newsletter", at: at.toISOString(), day: nl.day, state: "suggested", title: "Newsletter · this issue", note: "Built from the latest Musings. Open to pick pieces and see it.", href: "/creator/newsletter" });
  }

  // Email suggestion
  if (settings.email.mode === "suggest-weekly") {
    const at = dayOfWeek(start, 4, "10:00");
    items.push({ id: "email", kind: "email", at: at.toISOString(), day: 4, state: "suggested", title: "A note to recent buyers", note: "A short thank-you from Bob to anyone who bought this week.", href: "/creator/email" });
  }

  // Blog
  const blogDue = settings.blog.cadence === "twice-monthly" ? wk % 2 === 1 : settings.blog.cadence === "monthly" ? parts(start).d <= 7 : false;
  if (blogDue) {
    const at = dayOfWeek(start, 2, "09:00");
    const plate = plates[0];
    items.push({ id: "blog", kind: "blog", at: at.toISOString(), day: 2, state: "suggested", title: "Write a Musing", note: plate ? `Suggested place: ${plate.loc ?? plate.title ?? plate.label}` : undefined, image: img(plate), pillarId: plate?.pillarId ?? null, href: "/creator/blog" });
  }

  // Leads
  if (settings.leads.cadence === "weekly" || (settings.leads.cadence === "monthly" && parts(start).d <= 7)) {
    const at = dayOfWeek(start, 0, "13:00");
    items.push({ id: "leads", kind: "leads", at: at.toISOString(), day: 0, state: "suggested", title: "Find new people", note: "Leads is not switched on for this site yet.", href: "/creator/leads" });
  }

  return items.sort((a, b) => a.at.localeCompare(b.at));
}

function localInput(d: Date): string {
  // "YYYY-MM-DDTHH:mm" in Mountain time, the format /creator/social?at= accepts.
  const p = parts(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.y}-${pad(p.m)}-${pad(p.d)}T${pad(p.h)}:${pad(p.min)}`;
}

/* ───────── weekly plan rows ───────── */

export interface WeeklyPlanRecord {
  weekStart: string;
  items: PlanItem[];
  summary: string;
  emailedTo: string | null;
  emailedAt: string | null;
  createdAt: string;
}

export async function getWeeklyPlan(start: Date): Promise<WeeklyPlanRecord | null> {
  if (!isDatabaseConfigured()) return null;
  const row = await prisma.weeklyPlan.findUnique({ where: { weekStart: start } }).catch(() => null);
  if (!row) return null;
  return { weekStart: row.weekStart.toISOString(), items: (row.items as unknown as PlanItem[]) ?? [], summary: row.summary, emailedTo: row.emailedTo, emailedAt: row.emailedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString() };
}

export async function saveWeeklyPlan(start: Date, items: PlanItem[], summary: string) {
  return prisma.weeklyPlan.upsert({ where: { weekStart: start }, create: { weekStart: start, items: items as unknown as object, summary }, update: { items: items as unknown as object, summary } });
}

export async function setItemState(start: Date, id: string, state: PlanItemState): Promise<PlanItem[]> {
  const row = await prisma.weeklyPlan.findUnique({ where: { weekStart: start } });
  if (!row) return [];
  const items = ((row.items as unknown as PlanItem[]) ?? []).map((i) => (i.id === id ? { ...i, state } : i));
  await prisma.weeklyPlan.update({ where: { weekStart: start }, data: { items: items as unknown as object } });
  return items;
}

/* ───────── the Monday run ───────── */

export function summarize(items: PlanItem[], settings: PlanSettings): string {
  const posts = items.filter((i) => i.kind === "post");
  const lines: string[] = [];
  if (posts.length) lines.push(`${posts.length} post${posts.length === 1 ? "" : "s"} · ${posts.map((p) => WEEKDAYS[p.day]).join(" ")}`);
  const nl = items.find((i) => i.kind === "newsletter");
  if (nl) lines.push(`Newsletter · ${WEEKDAYS[nl.day]} ${fmtTime(nl.at)}`);
  const blog = items.find((i) => i.kind === "blog");
  if (blog) lines.push(`A Musing to write · ${WEEKDAYS[blog.day]}`);
  const email = items.find((i) => i.kind === "email");
  if (email) lines.push(`A note to send · ${WEEKDAYS[email.day]}`);
  const leads = items.find((i) => i.kind === "leads");
  if (leads) lines.push("Leads search");
  lines.push(settings.autonomy === "draft" ? "Everything waits for your approval." : settings.autonomy === "publish-posts" ? "Posts go on their own; the rest waits for you." : "Everything goes unless you stop it.");
  return lines.join("\n");
}

export interface RunResult {
  weekStart: string;
  items: number;
  emailed: boolean;
  to: string | null;
  reason?: string;
}

/** Build next week's plan (or this week's, when called before Monday noon), save it, email it. */
export async function runWeeklyPlan(opts: { force?: boolean; weekOffset?: 0 | 1 } = {}): Promise<RunResult> {
  const settings = await getPlanSettings();
  const start = weekStart(new Date(), opts.weekOffset === 1);
  const existing = await getWeeklyPlan(start);
  const items = existing && !opts.force ? existing.items : await buildWeeklyPlan(settings, start);
  const summary = summarize(items, settings);
  await saveWeeklyPlan(start, items, summary);

  const to = settings.notifyEmail; // never fall back to the contact address: the plan goes only where Plan says
  const from = process.env.CONTACT_FROM_EMAIL;
  const key = process.env.RESEND_API_KEY;
  if (!to || !from || !key) return { weekStart: start.toISOString(), items: items.length, emailed: false, to: to || null, reason: to ? "email not configured" : "no address set in Plan" };
  if (existing?.emailedAt && !opts.force) return { weekStart: start.toISOString(), items: items.length, emailed: false, to, reason: "already emailed" };

  const { Resend } = await import("resend");
  const resend = new Resend(key);
  const url = `${SITE.url}/creator`;
  const text =
    `Your week, ${fmtDay(start)}\n\n` +
    items.map((i) => `• ${fmtDay(i.at)} ${fmtTime(i.at)} — ${i.title}${i.note ? ` (${i.note})` : ""}`).join("\n") +
    `\n\n${summary}\n\nOpen the plan: ${url}\n`;
  const html =
    `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.55;color:#1b1b1f;max-width:560px">` +
    `<p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#b9871f;margin:0 0 6px">Creator studio · your week</p>` +
    `<h2 style="margin:0 0 14px;font-weight:600">Week of ${fmtDay(start)}</h2>` +
    `<table style="border-collapse:collapse;width:100%">` +
    items.map((i) => `<tr><td style="padding:8px 0;border-top:1px solid #eee;color:#6b665a;font-size:13px;white-space:nowrap;vertical-align:top">${fmtDay(i.at)}<br>${fmtTime(i.at)}</td><td style="padding:8px 12px;border-top:1px solid #eee;vertical-align:top">${i.image ? `<img src="${i.image.url}" width="44" height="44" style="border-radius:6px;float:left;margin-right:10px;object-fit:cover">` : ""}<b>${esc(i.title)}</b>${i.note ? `<br><span style="font-size:13px;color:#6b665a">${esc(i.note)}</span>` : ""}</td></tr>`).join("") +
    `</table><p style="white-space:pre-line;font-size:14px;color:#45505f;margin:16px 0">${esc(summary)}</p>` +
    `<p><a href="${url}" style="display:inline-block;background:#15161c;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;font-family:Arial,sans-serif;font-size:14px">Open the plan</a></p></div>`;
  try {
    await resend.emails.send({ from, to, subject: `Your week · ${fmtDay(start)}`, text, html });
    await prisma.weeklyPlan.update({ where: { weekStart: start }, data: { emailedTo: to, emailedAt: new Date() } });
    return { weekStart: start.toISOString(), items: items.length, emailed: true, to };
  } catch (e) {
    return { weekStart: start.toISOString(), items: items.length, emailed: false, to, reason: e instanceof Error ? e.message : "send failed" };
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
