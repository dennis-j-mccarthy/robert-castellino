"use client";

import { useState, type ReactNode } from "react";

/*
  The Posts page is two accordions, one open at a time:
    1  Make a post   open when you arrive
    2  My posts      every post on the Page as cards, with filters
*/

type Id = "make" | "posts";

export default function PostsAccordion({ make, posts, postCount }: { make: ReactNode; posts: ReactNode; postCount: number }) {
  const [open, setOpenRaw] = useState<Id>("make");
  // Opening a panel below a tall one would otherwise leave you mid-page: bring its header to the top.
  const setOpen = (id: Id) => {
    setOpenRaw(id);
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "smooth" }));
  };
  return (
    <div className="pa-stack">
      <Row id="make" n={1} title="Make a post" sub="where · picture · what it's about" open={open === "make"} onOpen={setOpen}>{make}</Row>
      <Row id="posts" n={2} title="My posts" sub={`${postCount} on the Page · published, scheduled, drafts`} open={open === "posts"} onOpen={setOpen}>{posts}</Row>
    </div>
  );
}

function Row({ id, n, title, sub, open, onOpen, children }: { id: Id; n: number; title: string; sub: string; open: boolean; onOpen: (id: Id) => void; children: ReactNode }) {
  return (
    <section className={`pa${open ? " is-open" : ""}`} id={id}>
      <button type="button" className="pa__head" aria-expanded={open} aria-controls={`pa-${id}`} onClick={() => onOpen(id)}>
        <span className="pa__n">{n}</span>
        <span className="pa__t"><b>{title}</b><small>{sub}</small></span>
        <span className="pa__chev" aria-hidden="true">{open ? "–" : "+"}</span>
      </button>
      <div id={`pa-${id}`} className="pa__body" hidden={!open}>{children}</div>
    </section>
  );
}
