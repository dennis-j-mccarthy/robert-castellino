import { fmtDay, getPlanSettings, getWeeklyPlan, weekStart } from "@/lib/creator/plan";
import PlanClient from "./PlanClient";

export const dynamic = "force-dynamic";

// Tool 9 · Plan: the rhythm. Dials for how often each thing goes out, the
// autonomy ladder, and a look at the plan built from them.
export default async function PlanPage() {
  const [settings, plan] = await Promise.all([getPlanSettings(), getWeeklyPlan(weekStart())]);
  const lines = plan ? plan.items.map((i) => `${fmtDay(i.at)} · ${i.title}`) : [];
  return (
    <section className="admin-page cr-page">
      <div className="tl-eyebrow">8 · Plan</div>
      <h1>How often, and how much help</h1>
      <p>Set the rhythm once. Every Monday at noon you get the week&rsquo;s plan by email and on the home screen: what&rsquo;s drafted, what&rsquo;s scheduled, what needs you.</p>
      <PlanClient initial={settings} nextPlan={plan ? { weekStart: plan.weekStart, lines, emailedAt: plan.emailedAt } : null} />
    </section>
  );
}
