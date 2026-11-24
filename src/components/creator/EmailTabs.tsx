"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Tool 5 · Email has two tabs: A note (one person or a few) and Newsletter
// (the issue to everyone, built from Musings).
const TABS = [
  { href: "/creator/email", label: "A note", hint: "one person or a few" },
  { href: "/creator/newsletter", label: "Newsletter", hint: "the issue, from your Musings" },
];

export default function EmailTabs() {
  const path = usePathname() ?? "";
  return (
    <nav className="kit-tabs" aria-label="Email sections">
      {TABS.map((t) => {
        const on = path === t.href || path.startsWith(t.href + "/");
        return (
          <Link key={t.href} href={t.href} className={`kit-tab${on ? " is-on" : ""}`} aria-current={on ? "page" : undefined}>
            <b>{t.label}</b><span>{t.hint}</span>
          </Link>
        );
      })}
    </nav>
  );
}
