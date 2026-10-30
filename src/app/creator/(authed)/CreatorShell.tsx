"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

/*
  The Throughline shell for /creator: left rail (brand → the thread of
  grouped nav nodes → "Stays in Meta"), a sticky top bar with the
  breadcrumb, quiet Admin / Sign out links and the theme toggle, and the
  content column. Light by default; dark is `data-theme="dark"` on the
  `.tl` root, remembered in localStorage. Pure presentation — the session
  gate lives in layout.tsx.
*/

const THEME_KEY = "tl-theme";
const THEME_EVENT = "tl-theme-change";
type Theme = "light" | "dark";
function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}
function subscribeTheme(cb: () => void) {
  window.addEventListener(THEME_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(THEME_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
const PAGE_ID = "134235743309639";
const AD_ACCOUNT = "1788471615529613";
const CAMPAIGN_ID = "120251354161250171";

export type NavCounts = { library: number | null; queued: number | null };

type Node = { href: string; label: string; chip?: string | null; chipWarn?: boolean };
type Group = { label: string; nodes: Node[] };

function buildNav(counts: NavCounts): Group[] {
  return [
    { label: "Strategy", nodes: [{ href: "/creator/essence", label: "Essence" }] },
    { label: "Creative", nodes: [{ href: "/creator/library", label: "Library", chip: counts.library != null ? String(counts.library) : null }] },
    {
      label: "Channels",
      nodes: [
        { href: "/creator/blog", label: "Blog" },
        { href: "/creator/email", label: "Email" },
        { href: "/creator/social", label: "Post machine", chip: counts.queued ? `${counts.queued} queued` : null },
        { href: "/creator/ads", label: "Paid social" },
      ],
    },
  ];
}

const STAYS_IN_META: Array<[string, string]> = [
  ["Comments & DMs", `https://business.facebook.com/latest/inbox/all?asset_id=${PAGE_ID}`],
  ["Budgets & bidding", `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${AD_ACCOUNT}&selected_campaign_ids=${CAMPAIGN_ID}`],
  ["Build audiences", `https://adsmanager.facebook.com/adsmanager/audiences?act=${AD_ACCOUNT}`],
];

const Chev = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
);
const Out = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" /></svg>
);

export default function CreatorShell({ children, fontClass, counts }: { children: ReactNode; fontClass: string; counts: NavCounts }) {
  const path = usePathname() ?? "";
  const nav = buildNav(counts);
  const flat = nav.flatMap((g) => g.nodes.map((n) => ({ ...n, group: g.label })));
  const activeIdx = flat.findIndex((n) => path === n.href || path.startsWith(n.href + "/"));
  const active = activeIdx >= 0 ? flat[activeIdx] : null;
  const leaf = path.startsWith("/creator/blog/posts") ? "Musings" : active?.label ?? "Creator";

  // Theme lives in localStorage; the server always renders light and the
  // inline script below paints the remembered choice before hydration.
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "light" as const);
  const toggleTheme = useCallback(() => {
    const next = readTheme() === "dark" ? "light" : "dark";
    try { localStorage.setItem(THEME_KEY, next); } catch {}
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  // The mobile drawer is open only for the path it was opened on, so a
  // navigation closes it without an effect.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === path;
  const rootRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLElement>(null);
  const [line, setLine] = useState<{ top: number; height: number; fill: number } | null>(null);

  // The thread line: grey from the first dot to the last, orange up to the active one.
  useLayoutEffect(() => {
    const t = threadRef.current;
    if (!t) return;
    const measure = () => {
      const dots = Array.from(t.querySelectorAll<HTMLElement>(".tl-dot"));
      if (dots.length < 2 || getComputedStyle(dots[0]).display === "none") { setLine(null); return; }
      const tb = t.getBoundingClientRect();
      const c = (el: HTMLElement) => el.getBoundingClientRect().top - tb.top + t.scrollTop + el.offsetHeight / 2;
      const first = c(dots[0]);
      const last = c(dots[dots.length - 1]);
      const act = activeIdx >= 0 && dots[activeIdx] ? c(dots[activeIdx]) : first;
      setLine({ top: first, height: last - first, fill: Math.max(0, act - first) });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeIdx]);

  return (
    <div ref={rootRef} className={`tl ${fontClass}`} data-theme={theme === "dark" ? "dark" : undefined} suppressHydrationWarning>
      {/* Paint the remembered theme before hydration so dark mode doesn't flash. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(localStorage.getItem(${JSON.stringify(THEME_KEY)})==="dark")document.currentScript.parentElement.setAttribute("data-theme","dark")}catch(e){}`,
        }}
      />
      <div className="tl-app">
        <aside className={`tl-rail${open ? " is-open" : ""}`}>
          <div className="tl-brand">
            <Link href="/creator" className="tl-brand__btn" aria-label="Creator home">
              <span className="tl-mark">RC</span>
              <span style={{ minWidth: 0 }}>
                <span className="tl-brand__name">Robert Castellino</span>
                <span className="tl-brand__ind">Fine-art landscape · Boulder, CO</span>
              </span>
              <svg className="tl-brand__chev" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M7 10l5 5 5-5" /></svg>
            </Link>
            <button type="button" className="tl-burger" aria-expanded={open} aria-controls="tl-thread" aria-label="Menu" onClick={() => setOpenFor(open ? null : path)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>

          <nav className="tl-thread" id="tl-thread" ref={threadRef} aria-label="Creator sections">
            {line && (
              <>
                <span className="tl-line" style={{ top: line.top, height: line.height }} aria-hidden="true" />
                <span className="tl-fill" style={{ top: line.top, height: line.fill }} aria-hidden="true" />
              </>
            )}
            {nav.map((g) => (
              <div className="tl-grp" key={g.label}>
                <div className="tl-gl">{g.label}</div>
                {g.nodes.map((n) => {
                  const i = flat.findIndex((f) => f.href === n.href);
                  const cls = i === activeIdx ? " is-active" : activeIdx > i ? " is-passed" : "";
                  return (
                    <Link key={n.href} href={n.href} className={`tl-node${cls}`} aria-current={i === activeIdx ? "page" : undefined}>
                      <span className="tl-dot" aria-hidden="true" />
                      <span className="tl-node__label">{n.label}</span>
                      {n.chip && <span className={`tl-badge${n.chipWarn ? " tl-badge--warn" : ""}`}>{n.chip}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="tl-metabox">
            <div className="tl-metabox__h">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" /></svg>
              Stays in Meta
            </div>
            {STAYS_IN_META.map(([label, href]) => (
              <a key={href} href={href} target="_blank" rel="noreferrer">{label}<Out /></a>
            ))}
          </div>
        </aside>

        <div className="tl-main">
          <header className="tl-top">
            <div className="tl-crumb">
              <span className="tl-crumb__root">Robert Castellino</span>
              <span className="tl-crumb__root"><Chev /></span>
              {active && (
                <>
                  <span>{active.group}</span>
                  <Chev />
                </>
              )}
              <b>{leaf}</b>
            </div>
            <div className="tl-top__sp" />
            <Link href="/admin" className="tl-quiet">← Admin</Link>
            <form action="/api/admin/logout" method="post" className="tl-quiet-form">
              <button type="submit" className="tl-quiet">Sign out</button>
            </form>
            <button type="button" className="tl-icbtn" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} title="Theme">
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
              )}
            </button>
          </header>
          <main className="tl-view">{children}</main>
        </div>
      </div>
    </div>
  );
}
