"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/timeline", label: "Timeline" },
  { href: "/gallery", label: "Gallery" },
  { href: "/book", label: "The Book" },
  { href: "/musings", label: "Musings" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <header className={`nav ${scrolled ? "is-scrolled" : ""}`}>
      <Link href="/" className="nav__brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="nav__logo"
          src="/assets/logo-script.png"
          alt="Robert Castellino Photography"
        />
      </Link>
      <nav className="nav__menu" aria-label="Primary">
        {links.map((l, i) => (
          <Link
            key={l.href}
            href={l.href}
            className={[isActive(l.href) ? "is-active" : "", i === 0 ? "nav__home" : ""].join(" ").trim()}
            aria-label={i === 0 ? "Home" : undefined}
          >
            {i === 0 ? (
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true" style={{ display: "block" }}>
                <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M7 18v-6h6v6" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            ) : l.label}
          </Link>
        ))}
      </nav>
      <Link className="nav__cta" href="/book">
        <span>View the Book</span>
        <svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true">
          <path
            d="M2 7h10M7 2l5 5-5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      </Link>
    </header>
  );
}
