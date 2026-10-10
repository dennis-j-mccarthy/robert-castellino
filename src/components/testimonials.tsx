"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Quote = { text: string; name: string; role: string };

const QUOTES: Quote[] = [
  {
    text: "Robert is one of the most talented photographers I have ever met. His photographs represent in many ways his creativity, tremendous attention-to-detail, and his ability to tell a story through his photography — his love of the subject, his personal knowledge of the setting, the historical. He is a master.",
    name: "Jim Williams",
    role: "Dean of Libraries, University of Colorado Boulder",
  },
  {
    text: "Simply put, Robert Castellino is one of the finest photographers we have in the Boulder/Denver area. His skills extend well beyond the realm of photography — his work, particularly his books, provides an unparalleled record of the beauty, uniqueness and historical richness of the Colorado Front Range.",
    name: "Stewart Shayah Sallo",
    role: "Owner, Boulder Weekly",
  },
  {
    text: "You are such a gifted photographer, Bob. Our daughter was quite sensitive about her appearance with braces, but you focused on capturing her power and her future. She loved the whole experience and said it was the best weekend of her senior year. We were all really pleased with the results — well done!",
    name: "Dita H.",
    role: "Boulder, Colorado",
  },
  {
    text: "I've been following Bob's work all of his life — I'm his brother. I've watched him inspire young people and adults alike with his images, and teach others to do the same. He's helped me immeasurably with my own photography. Bob is a photographer par excellence, and a teacher at heart.",
    name: "Ray Castellino, D.C.",
    role: "Co-Founder, BEBA.org",
  },
  {
    text: "I hired Robert to photograph my daughter for her senior portraits. He had great ideas for settings and did a wonderful job. The photo we chose for her yearbook won most creative out of 375 seniors. I would highly recommend Robert for any type of photo shoot.",
    name: "Kathy Brozek",
    role: "Owner, Medical Billing Services",
  },
  {
    text: "Bob is a delight to work with — creative, high energy, dynamic, always in motion. His eye for detail and beauty is unmatched; his dedication to clients is five star. He is one of those people who makes a lasting impression on you for life.",
    name: "Brenda Fraser",
    role: "Owner, A Force for Good",
  },
  {
    text: "Bob is a great photographer with a sharp eye for composition and the technical know-how to bring those compositions to life. He has a personable style, sharing enthusiasm for his craft and years of knowledge that have helped me reach my professional goals and made me a better photographer.",
    name: "Jim Paul",
    role: "Principal, James Paul Architecture",
  },
  {
    text: "The depth, detail and solidity of Bob's images speak to his passion for preparation and planning; his compositions betray the soul of an artist. He brings great energy, drive and determination to his work.",
    name: "Fergus Stone",
    role: "Fergus Sound Enterprises",
  },
  {
    text: "If there were such a title as Holistic Photographer, Robert would fit the bill. He sees the big picture in his excellent work, always connecting on the human level. The work he did with students at our charter school was outstanding — a motivating force and example for anyone interested in photography.",
    name: "David Hazen",
    role: "Educator",
  },
  {
    text: "Robert is personable and attentive. He takes a genuine interest in the worlds of others, manages cross-disciplinary work with ease, and has a great feel for developing non-traditional business models.",
    name: "Bobby McGee",
    role: "Owner, Bobby McGee Endurance Sports",
  },
];

const INTERVAL = 7000;

export function Testimonials() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const go = useCallback((n: number) => {
    setI((prev) => (n + QUOTES.length) % QUOTES.length);
  }, []);

  useEffect(() => {
    if (paused || reduced.current) return;
    const t = setInterval(() => setI((p) => (p + 1) % QUOTES.length), INTERVAL);
    return () => clearInterval(t);
  }, [paused]);

  const q = QUOTES[i];

  return (
    <section className="tst" aria-roledescription="carousel" aria-label="Testimonials">
      <header className="section-head section-head--center">
        <div>
          <span className="section-head__eyebrow">— In their words</span>
          <h2 className="section-head__title">
            A master. <em>Par excellence.</em>
          </h2>
        </div>
      </header>

      <div
        className="tst__stage"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <button
          type="button"
          className="tst__arrow tst__arrow--prev"
          aria-label="Previous testimonial"
          onClick={() => go(i - 1)}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <figure className="tst__quote" key={i} aria-live="polite">
          <span className="tst__mark" aria-hidden="true">&ldquo;</span>
          <blockquote className="tst__text">{q.text}</blockquote>
          <figcaption className="tst__by">
            <span className="tst__name">{q.name}</span>
            <span className="tst__role">{q.role}</span>
          </figcaption>
        </figure>

        <button
          type="button"
          className="tst__arrow tst__arrow--next"
          aria-label="Next testimonial"
          onClick={() => go(i + 1)}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="tst__dots" role="tablist" aria-label="Choose testimonial">
        {QUOTES.map((qd, n) => (
          <button
            key={n}
            type="button"
            role="tab"
            aria-selected={n === i}
            aria-label={`Testimonial ${n + 1} — ${qd.name}`}
            className={`tst__dot${n === i ? " is-on" : ""}`}
            onClick={() => setI(n)}
          />
        ))}
      </div>
    </section>
  );
}
