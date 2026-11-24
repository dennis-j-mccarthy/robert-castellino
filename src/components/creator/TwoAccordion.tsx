"use client";

import { useEffect, useState, type ReactNode } from "react";

/*
  Two panels, one open at a time. The first is open on arrival. Opening a
  panel scrolls its header to the top so a tall panel above never leaves
  you mid-page. Anything on the page can open a panel by dispatching
  `window.dispatchEvent(new CustomEvent("creator:open-panel", { detail: id }))`.
*/

export type Panel = { id: string; n: number; title: string; sub: string; body: ReactNode };

export const OPEN_PANEL_EVENT = "creator:open-panel";
export function openPanel(id: string) {
  window.dispatchEvent(new CustomEvent(OPEN_PANEL_EVENT, { detail: id }));
}

export default function TwoAccordion({ panels, initial = null }: { panels: [Panel, Panel]; initial?: string | null }) {
  return <Accordion panels={panels} initial={initial} />;
}

/**
 * Any number of panels, one open at a time. `initial` names the panel open
 * on arrival; null (the default) means all closed. Clicking the open panel's
 * header closes it.
 */
export function Accordion({ panels, initial = null }: { panels: Panel[]; initial?: string | null }) {
  const [open, setOpenRaw] = useState<string | null>(initial);
  const setOpen = (id: string) => {
    setOpenRaw(id);
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "smooth" }));
  };
  const toggle = (id: string) => (open === id ? setOpenRaw(null) : setOpen(id));
  useEffect(() => {
    const on = (e: Event) => { const id = (e as CustomEvent<string>).detail; if (panels.some((p) => p.id === id)) setOpen(id); };
    window.addEventListener(OPEN_PANEL_EVENT, on);
    return () => window.removeEventListener(OPEN_PANEL_EVENT, on);
  }, [panels]);
  return (
    <div className="pa-stack">
      {panels.map((p) => {
        const on = open === p.id;
        return (
          <section key={p.id} className={`pa${on ? " is-open" : ""}`} id={p.id}>
            <button type="button" className="pa__head" aria-expanded={on} aria-controls={`pa-${p.id}`} onClick={() => toggle(p.id)}>
              <span className="pa__n">{p.n}</span>
              <span className="pa__t"><b>{p.title}</b><small>{p.sub}</small></span>
              <span className={`pa__ctl${on ? " is-open" : ""}`} aria-hidden="true">
                <span>{on ? "Close" : "Open"}</span>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
              </span>
            </button>
            <div id={`pa-${p.id}`} className="pa__body" hidden={!on}>{p.body}</div>
          </section>
        );
      })}
    </div>
  );
}
