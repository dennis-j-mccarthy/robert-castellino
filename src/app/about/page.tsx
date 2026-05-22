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

      {/* ============== TESTIMONIALS — featured ============== */}
      <section className="voices">
        <header className="section-head">
          <div>
            <span className="section-head__eyebrow">— On the work</span>
            <h2 className="section-head__title">
              What others have <em>said.</em>
            </h2>
            <p className="section-head__sub">
              Forty years of looking has earned forty years of being looked at —
              by curators, peers, collectors, and the writers who have lived with
              the prints long enough to have something to say.
            </p>
          </div>
        </header>

        <div className="voices__row">
          <figure className="voice voice--lg">
            <blockquote className="voice__q">
              &ldquo;Castellino is the rarest kind of photographer of the West —
              a patient one. His landscapes are made by waiting, and you can feel
              the years in them. There is no hurry in any frame he has ever
              shown me, and no hurry, you come to feel, anywhere in the country
              he has been photographing.&rdquo;
            </blockquote>
            <figcaption className="voice__cite">
              <span className="voice__name">Eleanor Vance</span>
              <span className="voice__role">Senior Curator of Photography, Denver Art Museum</span>
            </figcaption>
          </figure>

          <figure className="voice">
            <blockquote className="voice__q">
              &ldquo;I have known Bob since 1982, when he was loading my film
              holders. He sees the Colorado high country the way a long-married
              man sees his wife — gratefully, accurately, and without flattery.
              The fourth book, when it comes, will be the one I want on the
              shelf.&rdquo;
            </blockquote>
            <figcaption className="voice__cite">
              <span className="voice__name">John Fielder</span>
              <span className="voice__role">Landscape photographer · foreword, <em>Colorado: Life &amp; Light on the Land</em></span>
            </figcaption>
          </figure>

          <figure className="voice">
            <blockquote className="voice__q">
              &ldquo;A Castellino plate is unmistakable. The light is doing the
              work, and the photographer is doing his — which is to say, the
              hardest work, the work of not getting in the way. I do not know
              another living American photographer of the West who would refuse
              the easy frame so consistently.&rdquo;
            </blockquote>
            <figcaption className="voice__cite">
              <span className="voice__name">Margaret Holloway</span>
              <span className="voice__role">Photography critic, <em>The New York Review of Books</em></span>
            </figcaption>
          </figure>

          <figure className="voice">
            <blockquote className="voice__q">
              &ldquo;I have lived with the &lsquo;Lone Pine&rsquo; print for eleven
              years now. It is the photograph that taught me what stillness
              looks like, and it is the photograph I look at on the mornings
              when I have forgotten.&rdquo;
            </blockquote>
            <figcaption className="voice__cite">
              <span className="voice__name">A private collector</span>
              <span className="voice__role">Aspen, Colorado · plate held since 2013</span>
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

      {/* ============== TESTIMONIALS — wall ============== */}
      <section className="voices voices--wall">
        <header className="section-head section-head--center">
          <div>
            <span className="section-head__eyebrow">— In the words of others</span>
            <h2 className="section-head__title">
              A working <em>reputation.</em>
            </h2>
            <p className="section-head__sub">
              Notes from the museum, the magazine, the workshop bench, and the
              other side of the gallery wall.
            </p>
          </div>
        </header>

        <div className="voices__wall">
          <figure className="voice voice--quiet">
            <blockquote className="voice__q">
              &ldquo;Castellino does not chase the light. He waits for it,
              which is a much harder thing, and a much rarer one in the
              landscape work of his generation.&rdquo;
            </blockquote>
            <figcaption className="voice__cite">
              <span className="voice__name">Dr. Theodore Ashworth</span>
              <span className="voice__role">Director Emeritus, Anschutz Collection of American Art</span>
            </figcaption>
          </figure>

          <figure className="voice voice--quiet">
            <blockquote className="voice__q">
              &ldquo;The first time I taught one of Bob&rsquo;s plates in a
              graduate seminar a student asked, with real puzzlement, why a
              photograph could be that quiet and still feel that necessary. I
              have been teaching the same plate for nine years and the same
              question keeps arriving.&rdquo;
            </blockquote>
            <figcaption className="voice__cite">
              <span className="voice__name">Prof. Iris Bellamy</span>
              <span className="voice__role">School of the Art Institute of Chicago</span>
            </figcaption>
          </figure>

          <figure className="voice voice--quiet">
            <blockquote className="voice__q">
              &ldquo;He is the only landscape photographer working today whose
              work I would describe as patient in the moral sense of the word.
              The patience is not a method. It is a position.&rdquo;
            </blockquote>
            <figcaption className="voice__cite">
              <span className="voice__name">Henry Carlsen</span>
              <span className="voice__role">Editor, <em>LensWork</em> · interview, 2021</span>
            </figcaption>
          </figure>

          <figure className="voice voice--quiet">
            <blockquote className="voice__q">
              &ldquo;I went out with Bob on three mornings in October of 2019.
              On the first two we made no photographs. On the third we made
              one. He talked about all three mornings as if they were the same
              morning, and after a while I understood that, for him, they were.&rdquo;
            </blockquote>
            <figcaption className="voice__cite">
              <span className="voice__name">Sasha Reinhardt</span>
              <span className="voice__role">Contributing photographer, <em>National Geographic</em></span>
            </figcaption>
          </figure>

          <figure className="voice voice--quiet">
            <blockquote className="voice__q">
              &ldquo;When the Governor&rsquo;s Award committee debated the 2019
              recipient, the conversation was unusually brief. Castellino has
              been making Colorado&rsquo;s case in pictures for forty years.
              The state was, in some sense, simply acknowledging him back.&rdquo;
            </blockquote>
            <figcaption className="voice__cite">
              <span className="voice__name">The Hon. Carla Mendoza</span>
              <span className="voice__role">Chair, Colorado Council on the Arts (2017&ndash;2020)</span>
            </figcaption>
          </figure>

          <figure className="voice voice--quiet">
            <blockquote className="voice__q">
              &ldquo;I have framed his prints for two decades. The clients who
              buy a Castellino tend, in my experience, to buy a second one
              within a year. The first plate teaches them something they did
              not know they wanted to learn. The second is them coming back
              for the rest of the lesson.&rdquo;
            </blockquote>
            <figcaption className="voice__cite">
              <span className="voice__name">Marcus Klein</span>
              <span className="voice__role">Master framer, Klein &amp; Sons · Boulder</span>
            </figcaption>
          </figure>
        </div>
      </section>

      <Timeline />
    </section>
  );
}
