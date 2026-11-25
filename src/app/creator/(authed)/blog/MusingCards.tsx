import { hasAnthropicKey } from "@/lib/creator/ai";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { adapters } from "@/studio.adapters";
import MusingCardsClient, { type Card } from "./MusingCardsClient";

/*
  Blog leads with the Musings as cards, four across. Each card has a star
  (include in the next newsletter); a Musing that already went out in a
  newsletter shows "In issue" instead. "Make newsletter" opens the popup.
*/

export async function loadMusingCards(): Promise<{ cards: Card[]; db: boolean }> {
  const db = isDatabaseConfigured();
  try {
    const [posts, drafts] = await Promise.all([
      adapters.content.list(),
      db ? prisma.emailDraft.findMany({ where: { status: { in: ["ready", "sent"] } }, select: { subject: true, musingIds: true, status: true }, orderBy: { createdAt: "desc" } }).catch(() => []) : Promise.resolve([]),
    ]);
    const used = new Map<string, string>();
    for (const d of drafts) for (const id of d.musingIds) if (!used.has(id)) used.set(id, `${d.status === "sent" ? "Sent" : "Ready"}: ${d.subject}`);
    return { cards: posts.map((r) => ({ id: r.id, title: r.title, date: r.date, img: r.img, excerpt: r.excerpt, published: r.published, starred: r.starred, usedIn: used.get(r.id) ?? null })), db };
  } catch {
    return { cards: [], db };
  }
}

export default async function MusingCards({ cards, db }: { cards: Card[]; db: boolean }) {
  return <MusingCardsClient cards={cards} db={db} ai={hasAnthropicKey()} />;
}
