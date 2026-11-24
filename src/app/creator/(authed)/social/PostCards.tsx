"use client";

import { useState } from "react";

export type PostCard = {
  id: string; platform: string; caption: string; image: string | null; imageId: string | null;
  state: "published" | "scheduled" | "draft" | "failed"; approved: boolean; when: string; sort: number; link: string | null; error: string | null;
};

type Filter = "all" | PostCard["state"];

const PLATFORM: Record<string, string> = { facebook: "Facebook", instagram: "Instagram", pinterest: "Pinterest", reel: "Reel", email: "Email" };
const STATE: Record<PostCard["state"], string> = { published: "Published", scheduled: "Scheduled", draft: "Draft", failed: "Failed" };

export default function PostCards({ rows }: { rows: PostCard[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const count = (s: PostCard["state"]) => rows.filter((r) => r.state === s).length;
  const chips: Array<[Filter, string, number]> = [
    ["all", "All", rows.length],
    ["published", "Published", count("published")],
    ["scheduled", "Scheduled", count("scheduled")],
    ["draft", "Drafts", count("draft")],
  ];
  if (count("failed")) chips.push(["failed", "Failed", count("failed")]);

  const shown = rows
    .filter((r) => filter === "all" || r.state === filter)
    .sort((a, b) => {
      // Scheduled soonest-first; everything else newest-first.
      if (a.state === "scheduled" && b.state === "scheduled") return a.sort - b.sort;
      return b.sort - a.sort;
    });

  return (
    <section className="pc" aria-labelledby="pc-title">
      <div className="pc__head">
        <h2 id="pc-title">All posts</h2>
        <div className="pc__chips" role="tablist" aria-label="Show">
          {chips.map(([k, label, n]) => (
            <button key={k} type="button" role="tab" aria-selected={filter === k} className={`pc__chip is-${k}${filter === k ? " is-on" : ""}`} onClick={() => setFilter(k)}>
              {label} <span>{n}</span>
            </button>
          ))}
        </div>
        <a href="#make" className="btn btn--gold ads-btn-xs">+ New post</a>
      </div>

      {shown.length === 0 ? (
        <p className="pc__empty">{rows.length === 0 ? "No posts yet. Make the first one below." : `Nothing ${filter === "draft" ? "in drafts" : filter}.`}</p>
      ) : (
        <div className="pc__grid">
          {shown.map((r) => {
            const edit = `/creator/social?draftId=${r.id}&imageId=${encodeURIComponent(r.imageId ?? "")}&caption=${encodeURIComponent(r.caption.slice(0, 500))}&platform=${r.platform}#make`;
            return (
              <article key={r.id} className={`pc__card is-${r.state}`}>
                <div className="pc__img">
                  {r.image ? <img src={r.image} alt="" loading="lazy" /> : <span className="pc__noimg">No picture</span>}
                  <span className={`pc__state is-${r.state}`}>{STATE[r.state]}{r.approved ? " · approved" : ""}</span>
                </div>
                <div className="pc__body">
                  <span className="pc__meta">{PLATFORM[r.platform] ?? r.platform}{r.when ? ` · ${r.when}` : ""}</span>
                  <p>{r.caption || <i>No words yet.</i>}</p>
                  {r.state === "failed" && r.error && <span className="pc__err">{r.error}</span>}
                  <div className="pc__actions">
                    {r.link ? (
                      <a className="btn btn--ghost ads-btn-xs" href={r.link} target="_blank" rel="noreferrer">View on Facebook ↗</a>
                    ) : (
                      <a className="btn ads-btn-xs" href={edit}>{r.state === "scheduled" ? "Change" : "Open"}</a>
                    )}
                    {r.link && <a className="btn ads-btn-xs" href={edit}>Post again</a>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
