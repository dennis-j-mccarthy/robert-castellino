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

export default function TwoAccordion({ panels }: { panels: [Panel, Panel] }) {
  return <Accordion panels={panels} />;
}

/** Any number of panels, one open at a time; the first is open on arrival. */
export function Accordion({ panels, initial }: { panels: Panel[]; initial?: string }) {
  const [open, setOpenRaw] = useState<string>(initial ?? panels[0].id);
  const setOpen = (id: string) => {
    setOpenRaw(id);
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "smooth" }));
  };
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
            <button type="button" className="pa__head" aria-expanded={on} aria-controls={`pa-${p.id}`} onClick={() => setOpen(p.id)}>
              <span className="pa__n">{p.n}</span>
              <span className="pa__t"><b>{p.title}</b><small>{p.sub}</small></span>
              <span className="pa__chev" aria-hidden="true">{on ? "–" : "+"}</span>
            </button>
            <div id={`pa-${p.id}`} className="pa__body" hidden={!on}>{p.body}</div>
          </section>
        );
      })}
    </div>
  );
}
