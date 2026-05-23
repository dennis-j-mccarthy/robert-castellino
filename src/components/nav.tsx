"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/timeline", label: "Timeline" },
  { href: "/book", label: "The Book" },
  { href: "/musings", label: "Musings" },
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
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={isActive(l.href) ? "is-active" : ""}
          >
            {l.label}
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
