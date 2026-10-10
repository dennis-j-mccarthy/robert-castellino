import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MUSINGS as STATIC_MUSINGS } from "@/data/musings";
import {
  CAT_META,
  getMusing,
  getMusingNeighbors,
} from "@/lib/data-source";

type Params = { id: string };

// Pre-render the static-data IDs at build time. DB-only IDs will be
// rendered on demand (Next will 404 unless dynamicParams allows them).
// We always allow them so admin-added musings can be reached without a
// rebuild.
export const dynamicParams = true;

export function generateStaticParams(): Params[] {
  return STATIC_MUSINGS.map((m) => ({ id: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const m = await getMusing(id);
  if (!m) return {};
  const title = `${m.title} — Musings — Robert Castellino`;
  const description = m.excerpt.replace(/<[^>]+>/g, "");
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: m.img ? [{ url: m.img }] : undefined,
      authors: ["Robert Castellino"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: m.img ? [m.img] : undefined,
    },
  };
}

export default async function MusingDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const m = await getMusing(id);
  if (!m) notFound();
  const neighbors = await getMusingNeighbors(id);
  if (!neighbors) notFound();
  const { prev, next } = neighbors;
  const c = CAT_META[m.cat];

  // JSON-LD BlogPosting schema for SEO. Dates are emitted only when real ISO
  // timestamps exist (DB-backed rows); the static "Spring 2024"-style date is
  // not valid schema.org and is intentionally omitted. undefined keys are
  // dropped by JSON.stringify.
  const url = `https://robertcastellino.com/musings/${m.id}`;
  const image = m.img
    ? [m.img.startsWith("/") ? `https://robertcastellino.com${m.img}` : m.img]
    : undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: m.title,
    description: m.excerpt.replace(/<[^>]+>/g, ""),
    author: { "@type": "Person", name: "Robert Castellino" },
    publisher: { "@type": "Person", name: "Robert Castellino" },
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image,
    datePublished: m.createdAt,
    dateModified: m.updatedAt ?? m.createdAt,
  };

  return (
    <section className="route route--detail">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="detail" data-cat={m.cat}>
        <header className="detail__head">
          <Link className="detail__back" href="/musings">
            <svg viewBox="0 0 14 14" width="11" height="11">
              <path
                d="M12 7H2M7 2L2 7l5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
            All Musings
          </Link>
          <div className="detail__meta">
            <span
              className="detail__cat"
              style={{ ["--c" as string]: c.color }}
            >
              <i />
              {c.label}
            </span>
            <span className="detail__num">{m.num}</span>
          </div>
          <h1 className="detail__title">{m.title}</h1>
          <div className="detail__byline">
            <span>By Robert Castellino</span>
            <span className="detail__sep">·</span>
            <span>{m.date}</span>
            {m.loc && (
              <>
                <span className="detail__sep">·</span>
                <span>{m.loc}</span>
              </>
            )}
          </div>
        </header>

        {m.img ? (
          <div className="detail__hero">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.img} alt={m.title} />
          </div>
        ) : (
          <div className="detail__rule" />
        )}

        <div className="detail__body">
          {m.body.map((p, i) => (
            <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
          ))}
        </div>

        <footer className="detail__foot">
          <Link
            className="detail__nav detail__nav--prev"
            href={`/musings/${prev.id}`}
          >
            <span className="detail__nav-k">← Previous</span>
            <span className="detail__nav-t">{prev.title}</span>
          </Link>
          <Link
            className="detail__nav detail__nav--next"
            href={`/musings/${next.id}`}
          >
            <span className="detail__nav-k">Next →</span>
            <span className="detail__nav-t">{next.title}</span>
          </Link>
        </footer>
      </article>
    </section>
  );
}
