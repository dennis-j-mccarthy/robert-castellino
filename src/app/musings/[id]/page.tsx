import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  MUSINGS,
  CAT_META,
  getMusing,
  getMusingNeighbors,
} from "@/data/musings";

type Params = { id: string };

export function generateStaticParams(): Params[] {
  return MUSINGS.map((m) => ({ id: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const m = getMusing(id);
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
  const m = getMusing(id);
  if (!m) notFound();
  const neighbors = getMusingNeighbors(id)!;
  const { prev, next } = neighbors;
  const c = CAT_META[m.cat];

  // JSON-LD Article schema for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: m.title,
    description: m.excerpt.replace(/<[^>]+>/g, ""),
    author: { "@type": "Person", name: "Robert Castellino" },
    image: m.img ? [`https://robertcastellino.com${m.img}`] : undefined,
    datePublished: m.date,
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
