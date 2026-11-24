/*
  Client-safe types and constants for Creator → Plan. No server imports here:
  PlanClient / WeekClient import from this file, plan.ts re-exports it.
*/

export const TZ = "America/Denver";
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Monday … 6 = Sunday (plan order)
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type Autonomy = "draft" | "publish-posts" | "publish-all";

export interface PlanSettings {
  posts: { perWeek: 0 | 1 | 2 | 3 | 5 | 7; days: Weekday[]; time: string }; // "07:30"
  newsletter: { cadence: "weekly" | "biweekly" | "monthly" | "off"; day: Weekday; time: string };
  email: { mode: "as-needed" | "suggest-weekly" };
  leads: { cadence: "off" | "weekly" | "monthly" };
  blog: { cadence: "off" | "monthly" | "twice-monthly" };
  autonomy: Autonomy;
  arrival: { day: Weekday; time: string }; // when the plan is built + emailed
  notifyEmail: string; // where the Monday plan goes
}

export const DEFAULT_PLAN: PlanSettings = {
  posts: { perWeek: 3, days: [1, 3, 5], time: "07:30" },
  newsletter: { cadence: "biweekly", day: 3, time: "09:00" },
  email: { mode: "as-needed" },
  leads: { cadence: "off" },
  blog: { cadence: "twice-monthly" },
  autonomy: "draft",
  arrival: { day: 0, time: "12:00" },
  notifyEmail: "",
};

export type PlanItemKind = "post" | "newsletter" | "email" | "blog" | "leads" | "plan";
export type PlanItemState = "suggested" | "drafted" | "approved" | "scheduled" | "done" | "skipped";

export interface PlanItem {
  id: string;
  kind: PlanItemKind;
  /** ISO instant, UTC. */
  at: string;
  /** 0–6 within the week (Mon–Sun), for rendering. */
  day: Weekday;
  title: string;
  note?: string;
  state: PlanItemState;
  /** Suggested plate for posts/newsletter. */
  image?: { src: string; url: string; label: string; bookPage: number | null } | null;
  pillarId?: string | null;
  /** Deep link into the tool with the slot prefilled. */
  href: string;
}

