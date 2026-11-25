"use client";

import type { ReactNode } from "react";
import TwoAccordion from "@/components/creator/TwoAccordion";

// Blog: ① Write a post ② My posts (shown as "Musings" on the public site) (cards, stars, Make newsletter).
export default function BlogAccordion({ write, musings, live, drafts }: { write: ReactNode; musings: ReactNode; live: number; drafts: number }) {
  return (
    <TwoAccordion panels={[
      { id: "write", n: 1, title: "Write a blog post", sub: "tone · title · write · publish", body: write },
      { id: "musings", n: 2, title: "My blog posts", sub: `${live} live${drafts ? ` · ${drafts} draft${drafts === 1 ? "" : "s"}` : ""} · star posts for the newsletter`, body: musings },
    ]} />
  );
}
