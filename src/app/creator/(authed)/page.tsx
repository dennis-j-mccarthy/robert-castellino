import Link from "next/link";
import { getRunningNow } from "@/lib/creator/running-now";
import { fmtDay, fmtTime, getPlanSettings, getWeeklyPlan, weekStart, WEEKDAYS, type PlanItem } from "@/lib/creator/plan";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import WeekClient from "./WeekClient";

export const dynamic = "force-dynamic";

/*
  Home · This week. The plan for the current week (built Monday noon from
  tool 9), what needs Bob, the ads at a glance, and the dials in one line.
  If no plan exists yet the page says so and points at Plan.
*/

const KIND_LABEL: Record<PlanItem["kind"], string> = { post: "Post", newsletter: "Newsletter", email: "Email", blog: "Blog post", leads: "Leads", plan: "Plan" };

export default async function ThisWeek() {
  const start = weekStart();
  const [settings, plan, ads, queued] = await Promise.all([
    getPlanSettings(),
    getWeeklyPlan(start),
    getRunningNow().catch(() => null),
    isDatabaseConfigured() ? prisma.socialDraft.findMany({ where: { status: "scheduled", scheduledAt: { gte: start, lt: new Date(start.getTime() + 7 * 86400000) } }, select: { id: true, caption: true, image: true, scheduledAt: true, platform: true } }).catch(() => []) : Promise.resolve([]),
  ]);
  const items = plan?.items ?? [];
  const open = items.filter((i) => i.state === "suggested" || i.state === "approved" || i.state === "drafted");
  const todayIdx = (() => { const d = new Date(); const wd = new Intl.DateTimeFormat("en-US", { timeZone: "America/Denver", weekday: "short" }).format(d); return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(wd); })();
  const dayNums = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat("en-US", { timeZone: "America/Denver", day: "numeric" }).format(new Date(start.getTime() + i * 86400000)));
  const spend = ads?.campaigns.reduce((s, c) => s + c.spend7d, 0) ?? 0;
  const buys = ads?.campaigns.reduce((s, c) => s + c.purchases7d, 0) ?? 0;
  const clicks = ads?.campaigns.reduce((s, c) => s + c.linkClicks7d, 0) ?? 0;

  return (
    <section className="admin-page cr-page">
      <div className="tl-eyebrow">Home · {fmtDay(new Date())}</div>
      <h1>This week</h1>
      <p>{plan ? `Your plan for the week of ${fmtDay(start)}. ${open.length ? `${open.length} thing${open.length === 1 ? "" : "s"} need a look; everything else is set.` : "Nothing is waiting on you."}` : "No plan has been built for this week yet. It arrives every Monday at noon from your Plan, or you can build it now."}</p>

      <div className="wk-grid">
        <section className="tl-card wk-card">
          <h4>The week ahead</h4>
          <p className="wk-exp">Built from your Plan: {settings.posts.perWeek} post{settings.posts.perWeek === 1 ? "" : "s"}{settings.newsletter.cadence !== "off" ? `, newsletter ${settings.newsletter.cadence === "weekly" ? "weekly" : settings.newsletter.cadence === "biweekly" ? "every 2 weeks" : "monthly"}` : ""}. Click anything to change it.</p>
          <div className="wk-week">
            {WEEKDAYS.map((w, i) => (
              <div key={w} className={`wk-day${i === todayIdx ? " is-today" : ""}`}>
                <div className="wk-day__d">{w.toUpperCase()}<b>{dayNums[i]}</b></div>
                {items.filter((it) => it.day === i).map((it) => (
                  <a key={it.id} href={it.href} className={`wk-ev is-${it.kind}${it.state === "skipped" ? " is-skipped" : ""}`} title={it.title}>
                    <span>{KIND_LABEL[it.kind]} · {fmtTime(it.at)}</span>
                  </a>
                ))}
                {queued.filter((q) => q.scheduledAt && Math.floor((q.scheduledAt.getTime() - start.getTime()) / 86400000) === i).map((q) => (
                  <a key={q.id} href="/creator/social" className="wk-ev is-post is-live" title={q.caption}><span>Scheduled · {fmtTime(q.scheduledAt!)}</span></a>
                ))}
              </div>
            ))}
          </div>
          {!plan && (
            <p className="wk-empty">Nothing here yet. <Link href="/creator/plan">Open Plan</Link> and press &ldquo;Build this week now&rdquo;.</p>
          )}
        </section>

        <section className="tl-card wk-card">
          <h4>Needs you</h4>
          <p className="wk-exp">Open a slot to draft it, or skip it. Nothing goes out until you do.</p>
          {open.length === 0 ? (
            <p className="wk-empty">{plan ? "All clear." : "The list fills in when the plan is built."}</p>
          ) : (
            <div className="wk-need">
              {open.map((it) => (
                <div key={it.id} className="wk-item">
                  {it.image ? <img src={it.image.url} alt="" /> : <span className={`wk-ico is-${it.kind}`}>{KIND_LABEL[it.kind][0]}</span>}
                  <div className="wk-item__t"><b>{it.title}</b><span>{fmtDay(it.at)} · {fmtTime(it.at)}{it.note ? ` · ${it.note}` : ""}</span></div>
                  <WeekClient item={it} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="tl-card wk-card">
          <h4>Ads, last 7 days</h4>
          <p className="wk-exp">{ads?.campaigns.filter((c) => c.status === "ACTIVE").length ?? 0} campaign{(ads?.campaigns.filter((c) => c.status === "ACTIVE").length ?? 0) === 1 ? "" : "s"} running. From Meta.</p>
          <div className="wk-stats">
            <div><b>${spend.toFixed(0)}</b><span>spent</span></div>
            <div><b>{clicks.toLocaleString()}</b><span>clicks</span></div>
            <div><b>{buys}</b><span>books sold</span></div>
            <div><b>{buys ? `$${(spend / buys).toFixed(0)}` : "—"}</b><span>per book</span></div>
          </div>
          <Link href="/creator/ads" className="wk-link">Open Ads →</Link>
        </section>

        <section className="tl-card wk-card">
          <h4>Your plan</h4>
          <p className="wk-exp">Change a number and next Monday&rsquo;s plan follows it.</p>
          <dl className="wk-dl">
            <div><dt>Posts</dt><dd>{settings.posts.perWeek === 0 ? "off" : settings.posts.perWeek === 7 ? "daily" : settings.posts.perWeek === 5 ? "weekdays" : `${settings.posts.perWeek} a week · ${settings.posts.days.map((d) => WEEKDAYS[d]).join(" ")}`}</dd></div>
            <div><dt>Newsletter</dt><dd>{settings.newsletter.cadence === "off" ? "off" : `${settings.newsletter.cadence === "weekly" ? "weekly" : settings.newsletter.cadence === "biweekly" ? "every 2 weeks" : "monthly"} · ${WEEKDAYS[settings.newsletter.day]}`}</dd></div>
            <div><dt>Email</dt><dd>{settings.email.mode === "as-needed" ? "as needed" : "suggest one a week"}</dd></div>
            <div><dt>Plan arrives</dt><dd>Monday 12:00 MT{plan?.emailedAt ? ` · last sent ${fmtDay(plan.emailedAt)}` : ""}</dd></div>
          </dl>
          <Link href="/creator/plan" className="wk-link">Open Plan →</Link>
        </section>
      </div>
    </section>
  );
}
