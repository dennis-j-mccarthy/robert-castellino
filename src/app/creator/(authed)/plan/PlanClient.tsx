"use client";

import { useState } from "react";
import { WEEKDAYS, type Autonomy, type PlanSettings, type Weekday } from "@/lib/creator/plan-types";

/*
  Tool 9 · Plan. Dials on the left, autonomy ladder + "next plan" on the right.
  Autosaves on every change (PUT /api/creator/plan) and shows a quiet state line.
*/

type RunResult = { weekStart: string; items: number; emailed: boolean; to: string | null; reason?: string };

const POST_OPTIONS: Array<[PlanSettings["posts"]["perWeek"], string]> = [[0, "off"], [1, "1 a week"], [2, "2"], [3, "3 a week"], [5, "weekdays"], [7, "daily"]];
const NL_OPTIONS: Array<[PlanSettings["newsletter"]["cadence"], string]> = [["weekly", "weekly"], ["biweekly", "every 2 weeks"], ["monthly", "monthly"], ["off", "off"]];
const LEADS_OPTIONS: Array<[PlanSettings["leads"]["cadence"], string]> = [["off", "off"], ["weekly", "weekly"], ["monthly", "monthly"]];
const BLOG_OPTIONS: Array<[PlanSettings["blog"]["cadence"], string]> = [["twice-monthly", "2 a month"], ["monthly", "monthly"], ["off", "off"]];
const AUTONOMY: Array<[Autonomy, string, string]> = [
  ["draft", "Drafts, I approve", "Everything is written and scheduled; nothing goes out until you approve it on the plan."],
  ["publish-posts", "Publishes posts, I approve the rest", "Posts go on their own. Newsletter and email wait for you."],
  ["publish-all", "Publishes everything", "You get the plan and can stop anything before it goes."],
];

export default function PlanClient({ initial, nextPlan }: { initial: PlanSettings; nextPlan: { weekStart: string; lines: string[]; emailedAt: string | null } | null }) {
  const [s, setS] = useState<PlanSettings>(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [run, setRun] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);

  async function save(next: PlanSettings) {
    setS(next);
    setState("saving");
    try {
      const r = await fetch("/api/creator/plan", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ settings: next }) });
      if (!r.ok) throw new Error();
      setState("saved");
    } catch {
      setState("error");
    }
  }
  const up = <K extends keyof PlanSettings>(k: K, v: Partial<PlanSettings[K]>) => save({ ...s, [k]: { ...(s[k] as object), ...v } as PlanSettings[K] });

  async function buildNow(force: boolean) {
    setRunning(true);
    try {
      const r = await fetch("/api/creator/plan/run", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ force, weekOffset: 0 }) });
      setRun(await r.json());
    } finally {
      setRunning(false);
    }
  }

  const toggleDay = (d: Weekday) => {
    const has = s.posts.days.includes(d);
    const days = has ? s.posts.days.filter((x) => x !== d) : [...s.posts.days, d].sort();
    if (!days.length) return;
    up("posts", { days: days as Weekday[], perWeek: ([1, 2, 3, 5, 7].includes(days.length) ? days.length : s.posts.perWeek) as PlanSettings["posts"]["perWeek"] });
  };

  return (
    <div className="pl-grid">
      <section className="tl-card pl-card">
        <Dial label="Posts" sub="Facebook and Instagram">
          <Seg options={POST_OPTIONS} value={s.posts.perWeek} onChange={(v) => up("posts", { perWeek: v })} />
          {s.posts.perWeek > 0 && s.posts.perWeek < 5 && (
            <div className="pl-days" aria-label="Days">
              {WEEKDAYS.map((w, i) => (
                <button key={w} type="button" className={`pl-day${s.posts.days.includes(i as Weekday) ? " is-on" : ""}`} onClick={() => toggleDay(i as Weekday)}>{w[0]}</button>
              ))}
              <input className="pl-time" type="time" value={s.posts.time} onChange={(e) => up("posts", { time: e.target.value })} />
            </div>
          )}
        </Dial>
        <Dial label="Newsletter" sub="the issue to everyone">
          <Seg options={NL_OPTIONS} value={s.newsletter.cadence} onChange={(v) => up("newsletter", { cadence: v })} />
          {s.newsletter.cadence !== "off" && (
            <div className="pl-days">
              {WEEKDAYS.map((w, i) => (
                <button key={w} type="button" className={`pl-day${s.newsletter.day === i ? " is-on" : ""}`} onClick={() => up("newsletter", { day: i as Weekday })}>{w[0]}</button>
              ))}
              <input className="pl-time" type="time" value={s.newsletter.time} onChange={(e) => up("newsletter", { time: e.target.value })} />
            </div>
          )}
        </Dial>
        <Dial label="Email" sub="personal notes">
          <Seg options={[["as-needed", "as needed"], ["suggest-weekly", "suggest one a week"]] as Array<[PlanSettings["email"]["mode"], string]>} value={s.email.mode} onChange={(v) => up("email", { mode: v })} />
        </Dial>
        <Dial label="Leads" sub="find new people · not switched on yet">
          <Seg options={LEADS_OPTIONS} value={s.leads.cadence} onChange={(v) => up("leads", { cadence: v })} />
        </Dial>
        <Dial label="Blog" sub="a new blog post">
          <Seg options={BLOG_OPTIONS} value={s.blog.cadence} onChange={(v) => up("blog", { cadence: v })} />
        </Dial>
        <Dial label="The plan arrives" sub="by email and on the home screen">
          <div className="pl-days">
            {WEEKDAYS.map((w, i) => (
              <button key={w} type="button" className={`pl-day${s.arrival.day === i ? " is-on" : ""}`} onClick={() => up("arrival", { day: i as Weekday })}>{w[0]}</button>
            ))}
            <input className="pl-time" type="time" value={s.arrival.time} onChange={(e) => up("arrival", { time: e.target.value })} />
          </div>
          <input className="pl-input" type="email" placeholder="Send it to… (email)" value={s.notifyEmail} onChange={(e) => setS({ ...s, notifyEmail: e.target.value })} onBlur={() => save(s)} />
          <p className="pl-hint">Right now the plan is built and sent Mondays at noon Mountain time. The day and time here are what next version will honour.</p>
        </Dial>
        <div className="pl-state" aria-live="polite">{state === "saving" ? "Saving…" : state === "saved" ? "Saved" : state === "error" ? "Could not save. Try again." : ""}</div>
      </section>

      <div className="pl-side">
        <section className="tl-card pl-card">
          <h4 className="pl-h">How much the studio does on its own</h4>
          <p className="pl-exp">Start at the top. Move down when you trust it. Today only the first one is wired; the others are recorded and will switch on with the next version.</p>
          <div className="pl-ladder">
            {AUTONOMY.map(([k, t, d]) => (
              <button key={k} type="button" className={`pl-rung${s.autonomy === k ? " is-on" : ""}`} onClick={() => save({ ...s, autonomy: k })}>
                <b>{t}</b><span>{d}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="tl-card pl-card">
          <h4 className="pl-h">This week&rsquo;s plan</h4>
          {nextPlan ? (
            <>
              <p className="pl-exp">Built for the week of {new Date(nextPlan.weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Denver" })}{nextPlan.emailedAt ? ` · emailed ${new Date(nextPlan.emailedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Denver" })}` : " · not emailed yet"}.</p>
              <ul className="pl-lines">{nextPlan.lines.map((l) => <li key={l}>{l}</li>)}</ul>
            </>
          ) : (
            <p className="pl-exp">No plan has been built yet. Build one now to see what Monday will bring from the dials on the left.</p>
          )}
          <div className="pl-actions">
            <button type="button" className="btn btn--gold ui-btn-sm" disabled={running} onClick={() => buildNow(false)}>{running ? "Building…" : nextPlan ? "Email it to me" : "Build this week now"}</button>
            {nextPlan && <button type="button" className="btn ui-btn-sm" disabled={running} onClick={() => buildNow(true)}>Rebuild from the dials</button>}
          </div>
          {run && (
            <p className="pl-hint">
              {run.items} item{run.items === 1 ? "" : "s"} for the week of {new Date(run.weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Denver" })}.{" "}
              {run.emailed ? `Emailed to ${run.to}.` : `Not emailed${run.reason ? ` (${run.reason})` : ""}.`} <a href="/creator">See it on This week →</a>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function Dial({ label, sub, children }: { label: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="pl-dial">
      <div className="pl-dial__l"><b>{label}</b><small>{sub}</small></div>
      <div className="pl-dial__r">{children}</div>
    </div>
  );
}

function Seg<T extends string | number>({ options, value, onChange }: { options: Array<[T, string]>; value: T; onChange: (v: T) => void }) {
  return (
    <div className="pl-seg" role="radiogroup">
      {options.map(([v, l]) => (
        <button key={String(v)} type="button" role="radio" aria-checked={v === value} className={v === value ? "is-on" : ""} onClick={() => onChange(v)}>{l}</button>
      ))}
    </div>
  );
}
