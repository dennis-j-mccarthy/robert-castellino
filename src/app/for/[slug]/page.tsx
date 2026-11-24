import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PixelEvent } from "@/components/meta-pixel";
import { BOOK } from "@/data/pricing";
import { getSession } from "@/lib/auth";
import { markdownToHtml, type LandingSections } from "@/lib/creator/landing";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

/*
  Landing pages (Search → Landing pages in the studio). One page per search
  phrase. Published pages are public and in the sitemap. Drafts show only
  to a signed-in admin, with a banner, and are never indexed. The offer is
  the signed book; the button goes to /book with the promo code and a
  utm_campaign naming this page so the sale can be traced back.
*/
export const dynamic = "force-dynamic";

const SITE_URL = "https://robertcastellino.com";
type Faq = { q: string; a: string };

async function load(slug: string) {
  if (!isDatabaseConfigured()) return null;
  const page = await prisma.landingPage.findUnique({ where: { slug } }).catch(() => null);
  if (!page) return null;
  if (page.published) return { page, preview: false };
  return (await getSession()) ? { page, preview: true } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const hit = await load(slug);
  if (!hit) return {};
  const { page, preview } = hit;
  const img = page.heroImage ? (page.heroImage.startsWith("/") ? `${SITE_URL}${page.heroImage}` : page.heroImage) : `${SITE_URL}/gift-series/book-cover-hi.jpg`;
  const description = page.metaDescription || page.intro.slice(0, 155);
  return {
    title: { absolute: page.title },
    description,
    alternates: { canonical: `/for/${page.slug}` },
    openGraph: { type: "website", url: `/for/${page.slug}`, title: page.title, description, images: [{ url: img, alt: page.heroAlt ?? page.h1 }] },
    twitter: { card: "summary_large_image", title: page.title, description, images: [img] },
    ...(preview ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function LandingRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hit = await load(slug);
  if (!hit) notFound();
  const { page, preview } = hit;
  const s = (page.sections ?? null) as LandingSections | null;
  const faq = (Array.isArray(page.faq) ? page.faq : []) as Faq[];
  const buy = `/book?code=${encodeURIComponent(BOOK.promo.code)}&utm_source=landing&utm_campaign=${encodeURIComponent(page.slug)}`;
  const url = `${SITE_URL}/for/${page.slug}`;
  const ld = [
    { "@context": "https://schema.org", "@type": "WebPage", "@id": url, url, name: page.title, description: page.metaDescription, about: page.keyword, author: { "@type": "Person", name: "Robert Castellino" } },
    { "@context": "https://schema.org", "@type": "Book", name: BOOK.title, author: { "@type": "Person", name: "Robert Castellino" }, bookFormat: "https://schema.org/Hardcover", numberOfPages: 116, image: `${SITE_URL}/gift-series/book-cover-hi.jpg`, offers: { "@type": "Offer", price: String(BOOK.promo.price), priceCurrency: "USD", availability: "https://schema.org/InStock", url: `${SITE_URL}/book` } },
    ...(faq.length ? [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }] : []),
  ];

  return (
    <section className="route route--detail lp">
      {!preview && ld.map((o, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(o) }} />)}
      {!preview && <PixelEvent event="ViewContent" params={{ content_name: page.keyword, content_category: "landing" }} />}
      {preview && <div className="lp-draft" role="status">Draft preview. Only signed-in admins see this page until it is published in the studio.</div>}

      <header className="lp-hero">
        <div className="lp-hero__copy">
          {s?.eyebrow && <span className="kicker kicker--gold">{s.eyebrow}</span>}
          <h1 className="lp-hero__h1">{page.h1}</h1>
          {s?.valueProp && <p className="lp-hero__value">{s.valueProp}</p>}
          <div className="lp-hero__actions">
            <Link href={buy} className="lp-buy lp-buy--big">{s?.ctaButton ?? "Order the signed book"}</Link>
            <span className="lp-price">${BOOK.promo.price} signed · shipped from Boulder</span>
          </div>
        </div>
        {page.heroImage && (
          <figure className="lp-hero__media">
            {/* eslint-disable-next-line @next/next/no-img-element -- plate from the library */}
            <img src={page.heroImage} alt={page.heroAlt ?? ""} />
            {page.heroAlt && <figcaption>{page.heroAlt}</figcaption>}
          </figure>
        )}
      </header>

      {page.intro && <p className="lp-lede">{page.intro}</p>}

      {s && s.benefits.length > 0 && (
        <section className="lp-cards" aria-label="What you get">
          {s.benefits.map((b, i) => (
            <div key={i} className="lp-card"><span className="lp-card__n">0{i + 1}</span><h3>{b.title}</h3><p>{b.text}</p></div>
          ))}
        </section>
      )}

      {s && (
        <section className="lp-band">
          <h2>{s.ctaHeadline}</h2>
          <Link href={buy} className="lp-buy lp-buy--big">{s.ctaButton}</Link>
        </section>
      )}

      <article className="detail">
        <div className="detail__body lp-body" dangerouslySetInnerHTML={{ __html: markdownToHtml(page.body) }} />
      </article>

      {s && s.steps.length > 0 && (
        <section className="lp-steps-wrap" aria-label="How it works">
          <h2 className="lp-h2">How it works</h2>
          <ol className="lp-steps">
            {s.steps.map((st, i) => (
              <li key={i}><span className="lp-steps__n">{i + 1}</span><h3>{st.title}</h3><p>{st.text}</p></li>
            ))}
          </ol>
        </section>
      )}

      {faq.length > 0 && (
        <section className="lp-faq" aria-label="Questions">
          <h2 className="lp-h2">Questions people ask</h2>
          {faq.map((f, i) => (
            <details key={i} open={i === 0}><summary>{f.q}</summary><p>{f.a}</p></details>
          ))}
        </section>
      )}

      <section className="lp-final">
        <div>
          <h2>{s?.ctaHeadline ?? "Order the signed book"}</h2>
          <p>{BOOK.title}. 84 plates, 116 pages, first printing, signed by Robert in the studio. Limited prints of the same plates are in the <Link href="/gallery">gallery</Link>.</p>
        </div>
        <Link href={buy} className="lp-buy lp-buy--big">{s?.ctaButton ?? "Order the signed book"}</Link>
      </section>
    </section>
  );
}
