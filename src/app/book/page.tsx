import Link from "next/link";

export default function BookPage() {
  return (
    <section className="route route--book">
      <div className="book">
        <div className="book__art">
          <div className="book__halo" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/book-cover.png" alt="Colorado: Life and Light on the Land" className="book__cover" />
          <div className="book__edition">
            <span>Fifth</span>
            <span>Printing</span>
          </div>
        </div>

        <div className="book__copy">
          <span className="page-head__index">04 — The Monograph</span>
          <h1 className="book__title">
            <em>Colorado</em><br />Life &amp; Light on the Land.
          </h1>
          <p className="book__deck">
            The career retrospective. Forty years of the high country, the plains,
            and the long Colorado sky, drawn together in a 168-page monograph.
            Foreword by John Fielder. Hand-bound, smyth-sewn, printed on 157gsm
            archival matte stock.
          </p>

          <dl className="book__specs">
            <div><dt>Format</dt><dd>11 × 11″ hardcover · cloth bound</dd></div>
            <div><dt>Extent</dt><dd>168 pages · 124 plates</dd></div>
            <div><dt>Paper</dt><dd>157gsm archival matte, FSC</dd></div>
            <div><dt>Printing</dt><dd>Fifth edition · signed copies available</dd></div>
            <div><dt>Foreword</dt><dd>by John Fielder</dd></div>
            <div><dt>Price</dt><dd><span className="price">$ 75</span> <span className="price__note">+ shipping, signed +$10</span></dd></div>
          </dl>

          <div className="book__cta">
            <Link className="btn btn--gold btn--lg" href="/book">Order a signed copy</Link>
            <Link className="btn btn--ghost btn--lg" href="/book">Preview the plates</Link>
          </div>

          <p className="book__shipnote">Shipped from the Boulder studio · usually within 3 business days.</p>
        </div>
      </div>

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
                A slow lake, an early frost, and the bells lit for forty seconds.
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

      <section className="prints">
        <header className="section-head section-head--center">
          <div>
            <span className="section-head__eyebrow">— Also from the studio</span>
            <h2 className="section-head__title">Limited edition prints.</h2>
            <p className="section-head__sub">
              Each photograph is offered in four finishes, signed and editioned.
              Edition sizes vary by format and image.
            </p>
          </div>
        </header>

        <div className="prints__grid">
          <article className="print">
            <div className="print__media">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/print-canvas.png" alt="Canvas print" /></div>
            <div className="print__body">
              <span className="print__kind">Gallery Canvas</span>
              <h4>Cotton canvas · stretched on poplar</h4>
              <p>Sizes 16×24&quot; to 40×60&quot;. Edition of 75.</p>
              <span className="print__price">from $475</span>
            </div>
          </article>
          <article className="print">
            <div className="print__media">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/print-metal.png" alt="Metal print" /></div>
            <div className="print__body">
              <span className="print__kind">Aluminum</span>
              <h4>Dye-infused on brushed metal</h4>
              <p>Sizes 16×24&quot; to 40×60&quot;. Edition of 50.</p>
              <span className="print__price">from $625</span>
            </div>
          </article>
          <article className="print">
            <div className="print__media">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/print-acrylic.png" alt="Acrylic print" /></div>
            <div className="print__body">
              <span className="print__kind">TruLife Acrylic</span>
              <h4>Face-mount, glare-free</h4>
              <p>Sizes 16×24&quot; to 40×60&quot;. Edition of 25.</p>
              <span className="print__price">from $1,250</span>
            </div>
          </article>
          <article className="print">
            <div className="print__media">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/print-on-wall.png" alt="Paper print on wall" /></div>
            <div className="print__body">
              <span className="print__kind">Archival Paper</span>
              <h4>Hahnemühle Photo Rag 308</h4>
              <p>Sizes 11×14&quot; to 30×40&quot;. Edition of 100.</p>
              <span className="print__price">from $185</span>
            </div>
          </article>
        </div>
      </section>
    </section>
  );
}
