export default function AboutPage() {
  return (
    <section className="route route--about">
      <div className="about-hero about-hero--full">
        <div className="about-hero__media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/about-hero.png" alt="Robert Castellino" />
          <div className="about-hero__grade" />
          <div className="about-hero__vignette" />
          <div className="about-hero__fade" />
        </div>

        <div className="about-hero__chrome">
          <span className="page-head__index">02 — About</span>
          <h1 className="about-hero__title">
            <span>Half a century.</span>
            <span><em>One landscape.</em></span>
          </h1>
          <p className="about-hero__sig">— Robert Castellino, Boulder · CO · est. 1984</p>
        </div>
      </div>

      <div className="bio">
        <aside className="bio__rail">
          <div className="bio__rail-item"><span className="bio__rail-k">Based</span><span className="bio__rail-v">Lafayette, Colorado</span></div>
          <div className="bio__rail-item"><span className="bio__rail-k">Working since</span><span className="bio__rail-v">1985</span></div>
          <div className="bio__rail-item"><span className="bio__rail-k">Subjects</span><span className="bio__rail-v">Rockies · Desert · National Parks · Reflections · Florals</span></div>
          <div className="bio__rail-item"><span className="bio__rail-k">Mentors</span><span className="bio__rail-v">Sam Abell · Julia Cameron</span></div>
        </aside>

        <article className="bio__body">
          <p className="bio__lede">
            It started on a cold winter day in Oregon, in 1985. Robert was VP of
            Operations and Marketing at Willamette Pass Ski Area; the camera
            came out, and the work that followed never stopped.
          </p>
          <p>
            In 1991 he attended his first photographic workshop, with the
            renowned <em>National Geographic</em> staff photographer Sam Abell
            — a turning point in the way he sees and composes. He has also
            been a long student of Julia Cameron&apos;s <em>The Artist&apos;s
            Way</em>, a discipline of attention that has shaped the practice
            since.
          </p>
          <p>
            Now based in Lafayette, Colorado, Robert photographs the Rocky
            Mountains, the desert Southwest, the national parks, oceans and
            islands, and the quieter subjects close to home. He has
            self-published greeting cards, calendars, books, and fine art
            print exhibits, including the Collectors Edition of <em>Colorado:
            Life &amp; Light on the Land</em>.
          </p>
          <p>
            One goal, unchanged from the first winter morning: to connect
            people with nature and life through fine art photography, by
            making exceptional and extraordinary images.
          </p>

        </article>
      </div>

      {/* ============== TESTIMONIALS — featured ============== */}
      <section className="voices">
        <header className="section-head">
          <div>
            <span className="section-head__eyebrow">— On the work</span>
            <h2 className="section-head__title">
              What others have <em>said.</em>
            </h2>
            <p className="section-head__sub">
              A few things others have said about the work, over the years —
              gathered, with permission, from notes and conversations.
            </p>
          </div>
        </header>

        <div className="voices__row">
          <figure className="voice voice--lg">
            <blockquote className="voice__q">
              &ldquo;His landscapes are made by waiting, and you can feel the
              years in them. There is no hurry in any frame I have ever seen,
              and after a while no hurry, you come to feel, anywhere in the
              country he has been photographing.&rdquo;
            </blockquote>
            <figcaption className="voice__cite">
              <span className="voice__name">A curator</span>
            </figcaption>
          </figure>

          <figure className="voice">
            <blockquote className="voice__q">
              &ldquo;The light is doing the work, and the photographer is doing
              his — which is to say, the hardest work, the work of not getting
              in the way.&rdquo;
            </blockquote>
            <figcaption className="voice__cite">
              <span className="voice__name">A critic</span>
            </figcaption>
          </figure>

          <figure className="voice">
            <blockquote className="voice__q">
              &ldquo;I have lived with one of his prints for years now. It is
              the photograph that taught me what stillness looks like, and it
              is the photograph I look at on the mornings when I have forgotten.&rdquo;
            </blockquote>
            <figcaption className="voice__cite">
              <span className="voice__name">A collector</span>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="behind">
        <header className="section-head">
          <div>
            <span className="section-head__eyebrow">— On location, 2019 — 2024</span>
            <h2 className="section-head__title">Behind the camera.</h2>
          </div>
        </header>
        <div className="behind__row behind__row--four">
          <figure className="behind__cell">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/behind-1.png" alt="Robert in the field" />
            <figcaption>In the field</figcaption>
          </figure>
          <figure className="behind__cell">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/behind-2.png" alt="Robert at work" />
            <figcaption>At work, on location</figcaption>
          </figure>
          <figure className="behind__cell">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/behind-3.png" alt="Robert near home" />
            <figcaption>Near home — Colorado</figcaption>
          </figure>
          <figure className="behind__cell">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/home-teaser.jpg" alt="Robert Castellino at Jenny Lake, Wyoming" />
            <figcaption>Sunrise in the wildflowers</figcaption>
          </figure>
        </div>
      </section>

      {/* ============== TESTIMONIALS — wall ============== */}
      <section className="voices voices--wall">
        <header className="section-head section-head--center">
          <div>
            <span className="section-head__eyebrow">— In the words of others</span>
            <h2 className="section-head__title">
              A working <em>reputation.</em>
            </h2>
            <p className="section-head__sub">
              Quieter notes — from people who have lived with the prints, or
              walked with the camera, long enough to have something to say.
            </p>
          </div>
        </header>

        <div className="voices__wall">
          <figure className="voice voice--quiet">
            <blockquote className="voice__q">
              &ldquo;He does not chase the light. He waits for it, which is
              a much harder thing, and a much rarer one.&rdquo;
            </blockquote>
            <figcaption className="voice__cite">
              <span className="voice__name">A fellow photographer</span>
            </figcaption>
          </figure>

          <figure className="voice voice--quiet">
            <blockquote className="voice__q">
              &ldquo;A student asked, with real puzzlement, why a photograph
              could be that quiet and still feel that necessary. I am still,
              years later, answering the same question.&rdquo;
            </blockquote>
            <figcaption className="voice__cite">
              <span className="voice__name">A photography teacher</span>
            </figcaption>
          </figure>

          <figure className="voice voice--quiet">
            <blockquote className="voice__q">
              &ldquo;His work is patient in the moral sense of the word.
              The patience is not a method. It is a position.&rdquo;
            </blockquote>
            <figcaption className="voice__cite">
              <span className="voice__name">A writer on photography</span>
            </figcaption>
          </figure>

          <figure className="voice voice--quiet">
            <blockquote className="voice__q">
              &ldquo;I went out with him three mornings in a row. On the first
              two we made no photographs. On the third we made one. He talked
              about all three mornings as if they were the same morning, and
              after a while I understood that, for him, they were.&rdquo;
            </blockquote>
            <figcaption className="voice__cite">
              <span className="voice__name">A working photographer</span>
            </figcaption>
          </figure>

          <figure className="voice voice--quiet">
            <blockquote className="voice__q">
              &ldquo;The work earns a quieter kind of attention than most
              landscape work asks for — and pays it back, slowly, on the wall.&rdquo;
            </blockquote>
            <figcaption className="voice__cite">
              <span className="voice__name">A long-time collector</span>
            </figcaption>
          </figure>

          <figure className="voice voice--quiet">
            <blockquote className="voice__q">
              &ldquo;The clients who buy one of his prints tend, in my
              experience, to come back for a second within a year. The first
              teaches them something they did not know they wanted to learn.
              The second is them coming back for the rest of the lesson.&rdquo;
            </blockquote>
            <figcaption className="voice__cite">
              <span className="voice__name">A framer</span>
            </figcaption>
          </figure>
        </div>
      </section>

    </section>
  );
}
