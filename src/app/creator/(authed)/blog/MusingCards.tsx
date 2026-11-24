import Link from "next/link";
import { MUSINGS as STATIC_MUSINGS } from "@/data/musings";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

/*
  Tool 3 · Blog leads with the Musings as cards, four across: live and draft,
  newest first, each with Edit / Posts / Newsletter. The writer sits below.
*/

type Card = { id: string; title: string; date: string; img: string | null; excerpt: string; published: boolean; updatedAt: string | null };

export async function loadMusingCards(): Promise<Card[]> {
  if (!isDatabaseConfigured()) return STATIC_MUSINGS.map((m) => ({ id: m.id, title: m.title, date: m.date, img: m.img ?? null, excerpt: m.excerpt, published: true, updatedAt: null }));
  try {
    const rows = await prisma.musing.findMany({ orderBy: [{ updatedAt: "desc" }], select: { id: true, title: true, date: true, img: true, excerpt: true, published: true, updatedAt: true } });
    if (!rows.length) return STATIC_MUSINGS.map((m) => ({ id: m.id, title: m.title, date: m.date, img: m.img ?? null, excerpt: m.excerpt, published: true, updatedAt: null }));
    return rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }));
  } catch {
    return [];
  }
}

export default function MusingCards({ cards }: { cards: Card[] }) {
  const live = cards.filter((c) => c.published).length;
  return (
    <section className="mc" aria-labelledby="mc-title">
      <div className="mc__head">
        <h2 id="mc-title">Your Musings <span className="cr-h2sub">· {live} live{cards.length - live ? ` · ${cards.length - live} draft${cards.length - live === 1 ? "" : "s"}` : ""}</span></h2>
        <Link className="btn btn--ghost ads-btn-xs" href="/creator/blog/posts">Manage all →</Link>
      </div>
      <div className="mc__grid">
        <a href="#write" className="mc__card mc__card--new">
          <span className="mc__plus">+</span>
          <b>New Musing</b>
          <span>Write one below, from a note or from nothing.</span>
        </a>
        {cards.map((c) => (
          <article key={c.id} className="mc__card">
            <div className="mc__img">
              {c.img ? <img src={c.img} alt="" loading="lazy" /> : <span className="mc__noimg">No picture yet</span>}
              <span className={`mc__state${c.published ? " is-live" : ""}`}>{c.published ? "Live" : "Draft"}</span>
            </div>
            <div className="mc__body">
              <b>{c.title}</b>
              <span className="mc__date">{c.date}</span>
              <p>{c.excerpt}</p>
              <div className="mc__actions">
                <Link className="btn ads-btn-xs" href={`/creator/blog/posts#${c.id}`}>Edit</Link>
                <Link className="btn ads-btn-xs" href={`/creator/social?musingId=${c.id}${c.img ? `&imageId=${encodeURIComponent(c.img)}` : ""}`}>Posts</Link>
                <Link className="btn ads-btn-xs" href={`/creator/newsletter?musingIds=${c.id}`}>Newsletter</Link>
                {c.published && <a className="btn btn--ghost ads-btn-xs" href={`/musings/${c.id}`} target="_blank" rel="noreferrer">View ↗</a>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
