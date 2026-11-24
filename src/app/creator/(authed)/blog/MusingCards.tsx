import { MUSINGS as STATIC_MUSINGS } from "@/data/musings";
import { hasAnthropicKey } from "@/lib/creator/ai";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import MusingCardsClient, { type Card } from "./MusingCardsClient";

/*
  Blog leads with the Musings as cards, four across. Each card has a star
  (include in the next newsletter); a Musing that already went out in a
  newsletter shows "In issue" instead. "Make newsletter" opens the popup.
*/

export async function loadMusingCards(): Promise<{ cards: Card[]; db: boolean }> {
  const fromStatic = () => STATIC_MUSINGS.map((m) => ({ id: m.id, title: m.title, date: m.date, img: m.img ?? null, excerpt: m.excerpt, published: true, starred: false, usedIn: null as string | null }));
  if (!isDatabaseConfigured()) return { cards: fromStatic(), db: false };
  try {
    const [rows, drafts] = await Promise.all([
      prisma.musing.findMany({ orderBy: [{ updatedAt: "desc" }], select: { id: true, title: true, date: true, img: true, excerpt: true, published: true, starred: true } }),
      prisma.emailDraft.findMany({ where: { status: { in: ["ready", "sent"] } }, select: { subject: true, musingIds: true, status: true }, orderBy: { createdAt: "desc" } }),
    ]);
    if (!rows.length) return { cards: fromStatic(), db: true };
    const used = new Map<string, string>();
    for (const d of drafts) for (const id of d.musingIds) if (!used.has(id)) used.set(id, `${d.status === "sent" ? "Sent" : "Ready"}: ${d.subject}`);
    return { cards: rows.map((r) => ({ ...r, usedIn: used.get(r.id) ?? null })), db: true };
  } catch {
    return { cards: [], db: true };
  }
}

export default async function MusingCards({ cards, db }: { cards: Card[]; db: boolean }) {
  return <MusingCardsClient cards={cards} db={db} ai={hasAnthropicKey()} />;
}
