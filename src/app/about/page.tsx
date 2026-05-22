import { Timeline } from "@/components/timeline";

export default function AboutPage() {
  return (
    <section className="route route--about">
      <div className="about-hero">
        <div className="about-hero__media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/portrait-hat.png" alt="Robert Castellino in studio portrait" />
          <div className="about-hero__grade" />
        </div>

        <div className="about-hero__copy">
          <span className="page-head__index">03 — About</span>
          <h1 className="about-hero__title">
            <span>Forty years.</span>
            <span><em>One landscape.</em></span>
          </h1>
          <p className="about-hero__sig">— Robert Castellino, Boulder · CO · est. 1984</p>
        </div>
      </div>

      <div className="bio">
        <aside className="bio__rail">
          <div className="bio__rail-item"><span className="bio__rail-k">Based</span><span className="bio__rail-v">Boulder, Colorado</span></div>
          <div className="bio__rail-item"><span className="bio__rail-k">Working since</span><span className="bio__rail-v">1984</span></div>
          <div className="bio__rail-item"><span className="bio__rail-k">Subjects</span><span className="bio__rail-v">Landscape · Weather · Wildlife</span></div>
          <div className="bio__rail-item"><span className="bio__rail-k">Format</span><span className="bio__rail-v">4×5 large format · medium format digital</span></div>
          <div className="bio__rail-item"><span className="bio__rail-k">Collected</span><span className="bio__rail-v">Denver Art Museum · Anschutz · private</span></div>
          <div className="bio__rail-item"><span className="bio__rail-k">Published</span><span className="bio__rail-v">National Geographic · Outside · Colorado Life</span></div>
        </aside>

        <article className="bio__body">
          <p className="bio__lede">
            Robert Castellino made his first published photograph on Independence Pass
            in the fall of 1984. He has been at it, with patience and increasing
            renown, for forty years since.
          </p>
          <p>
            Born in 1958 and trained at the Brooks Institute of Photography, Robert
            came West for a summer and stayed for a life. He worked as an assistant
            for John Fielder through the mid-1980s, then opened his own studio in
            Boulder in 1989 — the same address it occupies today.
          </p>
          <p>
            His landscapes are recognized for their restraint and their gravity.
            He still works almost exclusively in large format, builds compositions
            slowly, and returns to favored overlooks — Cottonwood, Independence,
            Maroon Lake, the Pawnee — for years at a time before he is satisfied.
          </p>
          <p>
            Three monographs have followed: <em>The High Country</em> (1998, out of
            print), <em>Plains</em> (2011), and his career retrospective
            <em> Colorado: Life &amp; Light on the Land</em> (2019, now in its fifth
            printing). His work is held in the permanent collections of the Denver
            Art Museum, the Anschutz Collection of American Art, and the Colorado
            Governor&apos;s Mansion, and on the walls of the U.S. Capitol, the St. Julien,
            and the Aspen Institute.
          </p>

          <hr className="rule" />

          <h3 className="bio__h">Selected awards &amp; honors</h3>
          <ul className="bio__list">
            <li><span>2022</span> Lowell Thomas Award — Travel Photography of the Year</li>
            <li><span>2019</span> Colorado Governor&apos;s Award for the Arts</li>
            <li><span>2017</span> Hasselblad Masters — Landscape, nominee</li>
            <li><span>2014</span> Ansel Adams Award for Conservation Photography</li>
            <li><span>2008</span> Lowell Thomas Award — Photo Essay of the Year</li>
            <li><span>1996</span> North American Nature Photography Assn. — Fellow</li>
          </ul>

          <hr className="rule" />

          <h3 className="bio__h">Selected exhibitions</h3>
          <ul className="bio__list">
            <li><span>2023</span> Denver Art Museum — <em>The Long View</em>, solo</li>
            <li><span>2018</span> History Colorado Center — <em>A State in Pictures</em></li>
            <li><span>2011</span> Aspen Art Museum — <em>Plains</em>, solo</li>
            <li><span>2002</span> Smithsonian Institution — <em>The American West</em>, group</li>
          </ul>

          <hr className="rule" />

          <h3 className="bio__h">In conversation</h3>
          <blockquote className="pull">
            &ldquo;The famous view at the famous overlook was made famous by somebody
            who got there before me. I am interested in the ten minutes before that
            photograph, and the ten years after.&rdquo;
          </blockquote>
        </article>
      </div>

      <section className="behind">
        <header className="section-head">
          <div>
            <span className="section-head__eyebrow">— On location, 2019 — 2024</span>
            <h2 className="section-head__title">Behind the camera.</h2>
          </div>
        </header>
        <div className="behind__row">
          <figure className="behind__cell behind__cell--tall">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/about-zion.jpg" alt="Robert photographing in Zion" />
            <figcaption>Zion Canyon, sunset — October 2022</figcaption>
          </figure>
          <figure className="behind__cell">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/portrait-flatirons.png" alt="Robert near the Flatirons" />
            <figcaption>The Flatirons, near home — July 2023</figcaption>
          </figure>
          <figure className="behind__cell">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/portrait-hat.png" alt="Studio portrait" />
            <figcaption>Studio portrait — 1996</figcaption>
          </figure>
        </div>
      </section>

      <Timeline />
    </section>
  );
}
