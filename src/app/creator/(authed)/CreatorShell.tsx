"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

/*
  The creator studio shell: a top sequence. Nine numbered tools run left to
  right in the order the work happens, each with an icon, its number, its
  name and a three-word explainer. A check marks a tool that is set up, the
  orange underline marks where you are, "soon" marks a tool that isn't built
  yet (it still has a page). Home ("This week") sits top right with Admin,
  Sign out, More and the theme toggle. Pure presentation — the session gate
  lives in layout.tsx.
*/

const THEME_KEY = "tl-theme";
const THEME_EVENT = "tl-theme-change";
type Theme = "light" | "dark";
function readTheme(): Theme {
  try { return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light"; } catch { return "light"; }
}
function subscribeTheme(cb: () => void) {
  window.addEventListener(THEME_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(THEME_EVENT, cb); window.removeEventListener("storage", cb); };
}

const PAGE_ID = "134235743309639";
const AD_ACCOUNT = "1788471615529613";
const CAMPAIGN_ID = "120251354161250171";

export type NavCounts = { library: number | null; queued: number | null };

type Tool = { n: number; href: string; label: string; hint: string; icon: ReactNode; soon?: boolean; match?: string[] };

const I = {
  essence: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /></svg>,
  library: <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 16l5-5 4 4 3-3 6 6" /></svg>,
  blog: <svg viewBox="0 0 24 24"><path d="M4 20h4l10-10-4-4L4 16z" /></svg>,
  posts: <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="12" cy="12" r="3.5" /></svg>,
  email: <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>,
  newsletter: <svg viewBox="0 0 24 24"><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>,
  ads: <svg viewBox="0 0 24 24"><path d="M3 11v2a2 2 0 0 0 2 2h2l6 4V5L7 9H5a2 2 0 0 0-2 2z" /><path d="M17 9a4 4 0 0 1 0 6" /></svg>,
  leads: <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5" /><path d="M2 20a7 7 0 0 1 14 0" /><path d="M17 4a3 3 0 0 1 0 6M22 20a6 6 0 0 0-5-6" /></svg>,
  plan: <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>,
  search: <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.2-4.2" /></svg>,
  home: <svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>,
};

const TOOLS: Tool[] = [
  { n: 1, href: "/creator/essence", label: "Essence", hint: "who you are", icon: I.essence },
  { n: 2, href: "/creator/library", label: "Brand kit", hint: "pictures & marks", icon: I.library, match: ["/creator/library", "/creator/brand"] },
  { n: 3, href: "/creator/audience", label: "Audience", hint: "who it's for", icon: I.leads },
  { n: 4, href: "/creator/blog", label: "Blog", hint: "write", icon: I.blog, match: ["/creator/blog"] },
  { n: 5, href: "/creator/social", label: "Posts", hint: "share a picture", icon: I.posts },
  { n: 6, href: "/creator/email", label: "Email", hint: "notes & the issue", icon: I.email, match: ["/creator/email", "/creator/newsletter"] },
  { n: 7, href: "/creator/ads", label: "Ads", hint: "paid reach", icon: I.ads, match: ["/creator/ads", "/creator/google-ads"] },
  { n: 8, href: "/creator/leads", label: "Leads", hint: "soon", icon: I.search, soon: true },
  { n: 9, href: "/creator/plan", label: "Plan", hint: "the rhythm", icon: I.plan },
];

// Tools that are "set up" show a check. Kept simple and honest: the ones
// that have real data behind them today.
const DONE = new Set([1, 2, 3, 4, 7]);

const MORE: Array<{ label: string; href: string; ext?: boolean }> = [
  { label: "Keywords", href: "/creator/keywords" },
  { label: "Competitors", href: "/creator/competitors" },
  { label: "Google Ads", href: "/creator/google-ads" },
  { label: "Comments & DMs (Meta)", href: `https://business.facebook.com/latest/inbox/all?asset_id=${PAGE_ID}`, ext: true },
  { label: "Budgets & bidding (Meta)", href: `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${AD_ACCOUNT}&selected_campaign_ids=${CAMPAIGN_ID}`, ext: true },
  { label: "Build audiences (Meta)", href: `https://adsmanager.facebook.com/adsmanager/audiences?act=${AD_ACCOUNT}`, ext: true },
  { label: "Admin", href: "/admin" },
];

export default function CreatorShell({ children, fontClass, counts }: { children: ReactNode; fontClass: string; counts: NavCounts }) {
  const path = usePathname() ?? "";
  const active = TOOLS.find((t) => (t.match ?? [t.href]).some((m) => path === m || path.startsWith(m + "/")));
  const isHome = path === "/creator" || path === "/creator/";

  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "light" as const);
  const toggleTheme = useCallback(() => {
    const next = readTheme() === "dark" ? "light" : "dark";
    try { localStorage.setItem(THEME_KEY, next); } catch {}
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  // "More" menu: closes on outside click, Escape, and navigation.
  const [moreFor, setMoreFor] = useState<string | null>(null);
  const moreOpen = moreFor === path;
  const moreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!moreOpen) return;
    const onDoc = (e: MouseEvent) => { if (!moreRef.current?.contains(e.target as Node)) setMoreFor(null); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMoreFor(null); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [moreOpen]);

  // Keep the active tool in view on narrow screens.
  const seqRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = seqRef.current?.querySelector<HTMLElement>(".ts-tool.is-on");
    el?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [path]);

  return (
    <div className={`tl ${fontClass}`} data-theme={theme === "dark" ? "dark" : undefined} suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem(${JSON.stringify(THEME_KEY)})==="dark")document.currentScript.parentElement.setAttribute("data-theme","dark")}catch(e){}` }} />
      <div className="ts-app">
        <header className="ts-top">
          <div className="ts-bar">
            <Link href="/creator" className="ts-brand" aria-label="This week, home">
              <span className="tl-mark">RC</span>
              <span className="ts-brand__t"><b>Robert Castellino</b><span>Creator studio</span></span>
            </Link>
            <div className="ts-bar__sp" />
            <Link href="/creator" className={`ts-home${isHome ? " is-on" : ""}`}>{I.home}<span>This week</span></Link>
            <div className="ts-more" ref={moreRef}>
              <button type="button" className="tl-quiet" aria-expanded={moreOpen} aria-haspopup="menu" onClick={() => setMoreFor(moreOpen ? null : path)}>More ▾</button>
              {moreOpen && (
                <div className="ts-menu" role="menu">
                  {MORE.map((m) => m.ext ? (
                    <a key={m.href} role="menuitem" href={m.href} target="_blank" rel="noreferrer">{m.label} ↗</a>
                  ) : (
                    <Link key={m.href} role="menuitem" href={m.href} onClick={() => setMoreFor(null)}>{m.label}</Link>
                  ))}
                  <form action="/api/admin/logout" method="post"><button type="submit" role="menuitem">Sign out</button></form>
                </div>
              )}
            </div>
            <button type="button" className="tl-icbtn" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} title="Theme">
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
              )}
            </button>
          </div>
          <nav className="ts-seq" ref={seqRef} aria-label="The nine tools, in order">
            {TOOLS.map((t) => {
              const on = active?.n === t.n;
              const chip = t.n === 2 && counts.library != null ? counts.library : t.n === 5 && counts.queued ? counts.queued : null;
              return (
                <Link key={t.n} href={t.href} className={`ts-tool${on ? " is-on" : ""}${t.soon ? " is-soon" : ""}${DONE.has(t.n) ? " is-done" : ""}`} aria-current={on ? "page" : undefined}>
                  <span className="ts-tool__ic" aria-hidden="true">{t.icon}</span>
                  {DONE.has(t.n) && <span className="ts-tool__n" aria-label="set up">✓ set up</span>}
                  <span className="ts-tool__l">{t.label}{chip != null && <span className="ts-tool__chip">{chip}</span>}</span>
                  <span className="ts-tool__h">{t.hint}</span>
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="tl-view ts-view">{children}</main>
      </div>
    </div>
  );
}
