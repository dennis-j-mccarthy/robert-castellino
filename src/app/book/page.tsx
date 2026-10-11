import { BOOK } from "@/data/pricing";
import { BookBuy } from "./BookBuy";
import { BookFlip } from "./BookFlip";
import { PixelEvent } from "@/components/meta-pixel";

const bookLd = {
  "@context": "https://schema.org",
  "@type": "Book",
  name: "Colorado: Life and Light on the Land",
  author: { "@type": "Person", name: "Robert Castellino" },
  bookFormat: "https://schema.org/Hardcover",
  numberOfPages: 168,
  isbn: "978-0-9972290-0-4",
  inLanguage: "en",
  image: "https://robertcastellino.com/gift-series/book-cover-hi.jpg",
  offers: {
    "@type": "Offer",
    price: String(BOOK.promo.price),
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: "https://robertcastellino.com/book",
  },
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[] }>;
}) {
  const { code } = await searchParams;
  // The $49.95 price is the price: the code is applied for everyone, ad link or not.
  const initialCode = (Array.isArray(code) ? code[0] : code)?.slice(0, 40) || BOOK.promo.code;
  return (
    <section className="route route--book">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookLd) }}
      />
      <div className="book book--landing">
        <div className="book__art">
          <div className="book__halo" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/book-cover.png" alt="Colorado: Life and Light on the Land" className="book__cover" />
          <div className="book__edition">
            <span>Fifth</span>
            <span>Printing</span>
          </div>
          <BookFlip />
        </div>

        <div className="book__copy">
          <span className="page-head__index">Signed by Robert Castellino · shipped from Boulder</span>
          <h1 className="book__title">
            <em>Colorado</em><br />Life &amp; Light on the Land.
          </h1>
          <p className="book__deck">
            Fifty years of Colorado in one 168-page volume, signed by the man who
            made every photograph.
          </p>

          <BookBuy initialCode={initialCode} />
          <PixelEvent event="ViewContent" params={{ content_name: BOOK.title, content_type: "product", value: BOOK.promo.price, currency: "USD" }} />

          <dl className="book__specs">
            <div><dt>Format</dt><dd>11 × 11″ hardcover · cloth bound</dd></div>
            <div><dt>Extent</dt><dd>168 pages · 124 plates</dd></div>
            <div><dt>Paper</dt><dd>157gsm archival matte, FSC</dd></div>
            <div><dt>Printing</dt><dd>Fifth edition · hand-bound, smyth-sewn</dd></div>
          </dl>
        </div>
      </div>

      {/* PRAISE */}
      <section className="book-praise">
        <span className="kicker kicker--gold">— On the work</span>
        <div className="book-praise__grid">
          <figure className="book-praise__q">
            <p>
              His work — particularly his books — provides an unparalleled record
              of the beauty, uniqueness and historical richness of the Colorado
              Front Range.
            </p>
            <figcaption>
              <span className="book-praise__name">Stewart Shayah Sallo</span>
              <span className="book-praise__role">Owner, Boulder Weekly</span>
            </figcaption>
          </figure>
          <figure className="book-praise__q">
            <p>
              His ability to tell a story through his photography — his love of the
              subject, his knowledge of the setting, the historical. He is a master.
            </p>
            <figcaption>
              <span className="book-praise__name">Jim Williams</span>
              <span className="book-praise__role">Dean of Libraries, CU Boulder</span>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="spreads">
        <header className="section-head">
          <div>
            <span className="section-head__eyebrow">— A glance inside</span>
            <h2 className="section-head__title">Selected spreads.</h2>
          </div>
        </header>
        <div className="spreads__row">
          <div className="spread">
            <div className="spread__page spread__page--l" style={{ backgroundImage: "url('/assets/maroon-bells.jpg')" }} />
            <div className="spread__page spread__page--r">
              <div className="spread__plate">Plate 014</div>
              <h3>Maroon Bells, Summer&apos;s End</h3>
              <p>
                Aspen Snowmass — Sept. 2022.<br />
                A slow lake, an early frost, and the bells lit for fifty seconds.
              </p>
            </div>
          </div>
          <div className="spread">
            <div className="spread__page spread__page--l spread__page--text">
              <div className="spread__plate">Plate 022</div>
              <h3>Lone Pine, Quiet Drift</h3>
              <p>
                Red Mountain Pass — Feb. 2022.<br />
                The mountain made a bowl of snow and a single tree decided to stand in it.
              </p>
            </div>
            <div className="spread__page spread__page--r" style={{ backgroundImage: "url('/assets/lone-pine.jpg')" }} />
          </div>
          <div className="spread">
            <div className="spread__page spread__page--l" style={{ backgroundImage: "url('/assets/mt-yale.jpg')" }} />
            <div className="spread__page spread__page--r">
              <div className="spread__plate">Plate 041</div>
              <h3>Mount Yale, Last Light</h3>
              <p>
                Cottonwood Pass — June 2023.<br />
                Storms cleared at 18:42. The peaks were lit for less than a minute.
              </p>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
