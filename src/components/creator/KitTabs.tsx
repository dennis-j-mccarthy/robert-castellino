"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Tool 2 · Brand kit has two tabs: Pictures (the library) and Brand kit
// (logos, colours, type, the words). Shared by both pages.
const TABS = [
  { href: "/creator/library", label: "Pictures", hint: "the plates and photos" },
  { href: "/creator/brand", label: "Brand kit", hint: "logo, colours, type, the words" },
];

export default function KitTabs() {
  const path = usePathname() ?? "";
  return (
    <nav className="kit-tabs" aria-label="Brand kit sections">
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
