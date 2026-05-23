import Link from "next/link";

export default function Home() {
  return (
    <section className="route route--home">
      {/* HERO */}
      <div className="hero">
        <div className="hero__media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/hero-zion.jpg"
            alt="Robert Castellino photographing Zion Canyon at sunset"
          />
          <div className="hero__vignette" />
          <div className="hero__lower-fade" />
        </div>

        <div className="hero__chrome">
          <div className="hero__eyebrow">
            <span className="dot" />
            <span>A Photographer&apos;s Life — Fifty Years on the Land</span>
          </div>

          <h1 className="hero__title">
            <span className="hero__line hero__line--a">Light</span>
            <span className="hero__line hero__line--b"><em>Catcher</em></span>
          </h1>

          <p className="hero__sub">
            Half a century of large-format nature photography from the Colorado
            Rockies — mountains, streams, light, land, sky. A working archive by
            a photographer whose prints hang in museums, statehouses, and a great
            many living rooms.
          </p>

          <div className="hero__cta-row">
            <Link className="btn btn--ghost" href="/about">Meet Robert</Link>
            <Link className="btn btn--bare" href="/gallery">
              View the Gallery
              <svg viewBox="0 0 14 14" width="11" height="11"><path d="M2 7h10M7 2l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.4"/></svg>
            </Link>
          </div>
        </div>

        <div className="hero__meta">
          <div className="hero__meta-block">
            <span className="hero__meta-k">N 37.2982°</span>
            <span className="hero__meta-v">W 113.0263°</span>
          </div>
          <div className="hero__meta-block">
            <span className="hero__meta-k">Elev.</span>
            <span className="hero__meta-v">4,400 ft</span>
          </div>
          <div className="hero__meta-block">
            <span className="hero__meta-k">Est.</span>
            <span className="hero__meta-v">Boulder · 1984</span>
          </div>
        </div>

        <div className="hero__scroll">
          <span>Scroll</span>
          <span className="hero__scroll-line" />
        </div>
      </div>

      {/* SELECTED WORK */}
      <section className="selected">
        <header className="section-head">
          <div>
            <span className="section-head__eyebrow">— From the archive</span>
            <h2 className="section-head__title">Half a century <em>of looking.</em></h2>
          </div>
          <Link className="section-head__link" href="/gallery">
            See the full gallery
            <svg viewBox="0 0 14 14" width="11" height="11"><path d="M2 7h10M7 2l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.4"/></svg>
          </Link>
        </header>

        <div className="selected__grid selected__grid--balanced">
          <Link href="/gallery" className="card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/mt-yale.jpg" alt="Mount Yale at last light, Cottonwood Pass" />
            <div className="card__overlay">
              <span className="card__no">N° 014</span>
              <span className="card__title">Mount Yale, Last Light</span>
              <span className="card__loc">Cottonwood Pass · Colorado</span>
            </div>
          </Link>
          <Link href="/gallery" className="card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/mt-sopris.jpg" alt="Mount Sopris panoramic" />
            <div className="card__overlay">
              <span className="card__no">N° 022</span>
              <span className="card__title">Mt. Sopris, A Day Folds In</span>
              <span className="card__loc">Carbondale · Colorado</span>
            </div>
          </Link>
          <Link href="/gallery" className="card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/lone-pine.jpg" alt="A lone pine in deep snow at Red Mountain Pass" />
            <div className="card__overlay">
              <span className="card__no">N° 037</span>
              <span className="card__title">Lone Pine, Quiet Drift</span>
              <span className="card__loc">Red Mountain Pass · Colorado</span>
            </div>
          </Link>
          <Link href="/gallery" className="card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/horses-snow.jpg" alt="Horses walking through a snow storm" />
            <div className="card__overlay">
              <span className="card__no">N° 041</span>
              <span className="card__title">Walk Through Weather</span>
              <span className="card__loc">Northern Range · Colorado</span>
            </div>
          </Link>
        </div>
      </section>

      {/* PHOTOGRAPHER TEASER */}
      <section className="teaser">
        <div className="teaser__art">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/portrait-hat.png" alt="Robert Castellino portrait" className="teaser__portrait" />
          <div className="teaser__chip">
            <span className="teaser__chip-line">Behind the Camera</span>
            <span className="teaser__chip-name">Robert Castellino</span>
          </div>
        </div>
        <div className="teaser__copy">
          <span className="kicker">— The photographer</span>
          <h2 className="display">
            A practiced eye on<br />
            <em>the natural world.</em>
          </h2>
          <p>
            Robert Castellino has photographed the Colorado high country since 1984.
            Three monographs, two Lowell Thomas Awards, a Hasselblad Masters
            nomination, and prints held in the permanent collections of the Denver
            Art Museum and the Anschutz Collection of American Art.
          </p>
          <p className="muted">
            He still works the same passes he learned in his twenties — Cottonwood,
            Independence, Red Mountain — with a tripod in the truck and half a
            century of weather in his memory.
          </p>
          <Link className="btn btn--ghost" href="/about">Read his story</Link>
        </div>
      </section>

      {/* BOOK TEASER */}
      <section className="book-strip">
        <div className="book-strip__copy">
          <span className="kicker kicker--gold">— A career retrospective</span>
          <h2 className="display">
            <em>Colorado:</em><br />
            Life &amp; Light on the Land.
          </h2>
          <p>The definitive monograph — 168 plates drawn from half a century in
          the Rockies. Foreword by John Fielder. Now in its fifth printing.</p>
          <Link className="btn btn--gold" href="/book">Open the Book</Link>
        </div>
        <div className="book-strip__art">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/book-cover.png" alt="Colorado: Life and Light on the Land — book cover" />
          <div className="book-strip__shelf" />
        </div>
      </section>
    </section>
  );
}
