"use client";

import { useState } from "react";
import type { PlanItem, PlanItemState } from "@/lib/creator/plan-types";

// Approve / skip buttons on the home screen. Approving a slot opens the
// tool with the slot prefilled; the state is recorded so the plan shows it.
export default function WeekClient({ item }: { item: PlanItem }) {
  const [state, setState] = useState<PlanItemState>(item.state);
  const [busy, setBusy] = useState(false);
  async function set(next: PlanItemState) {
    setBusy(true);
    try {
      await fetch("/api/creator/plan/item", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: item.id, state: next }) });
      setState(next);
    } finally {
      setBusy(false);
    }
  }
  if (state === "skipped") return <span className="wk-state">Skipped · <button type="button" className="wk-link" disabled={busy} onClick={() => set("suggested")}>undo</button></span>;
  if (state === "done" || state === "scheduled") return <span className="wk-state is-done">{state === "done" ? "Done" : "Scheduled"}</span>;
  return (
    <span className="wk-actions">
      <a className="btn btn--gold ui-btn-xs" href={item.href} onClick={() => { if (state === "suggested") void set("approved"); }}>{state === "approved" ? "Open" : "Open & draft"}</a>
      <button type="button" className="btn ui-btn-xs" disabled={busy} onClick={() => set("skipped")}>Skip</button>
    </span>
  );
}
