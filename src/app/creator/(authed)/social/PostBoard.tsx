import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { absoluteImageUrl } from "@/lib/creator/library";
import { fmtDay, fmtTime } from "@/lib/creator/plan";

/*
  Tool 4 · Posts leads with every post, by state: Published, Scheduled,
  Unpublished (drafts, approved-not-sent, failed). The maker sits below.
*/

type Row = { id: string; platform: string; caption: string; image: string | null; status: string; scheduledAt: Date | null; publishedAt: Date | null; updatedAt: Date; metaPostId: string | null; error: string | null; musingId: string };

export async function loadPosts(): Promise<Row[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    return await prisma.socialDraft.findMany({ orderBy: [{ updatedAt: "desc" }], take: 200, select: { id: true, platform: true, caption: true, image: true, status: true, scheduledAt: true, publishedAt: true, updatedAt: true, metaPostId: true, error: true, musingId: true } });
  } catch {
    return [];
  }
}

const LABEL: Record<string, string> = { facebook: "Facebook", instagram: "Instagram", pinterest: "Pinterest", reel: "Reel", email: "Email" };

export default function PostBoard({ rows }: { rows: Row[] }) {
  const published = rows.filter((r) => r.status === "posted");
  const scheduled = rows.filter((r) => r.status === "scheduled").sort((a, b) => (a.scheduledAt?.getTime() ?? 0) - (b.scheduledAt?.getTime() ?? 0));
  const unpublished = rows.filter((r) => r.status !== "posted" && r.status !== "scheduled");
  const groups: Array<[string, string, Row[]]> = [
    ["Published", "Live on the Page.", published],
    ["Scheduled", "Meta will post these on their own.", scheduled],
    ["Unpublished", "Drafts, approved but unsent, or failed.", unpublished],
  ];
  return (
    <section className="pb" aria-labelledby="pb-title">
      <div className="pb__head">
        <h2 id="pb-title">All posts <span className="cr-h2sub">· {published.length} published · {scheduled.length} scheduled · {unpublished.length} unpublished</span></h2>
        <a href="#make" className="btn btn--gold ads-btn-xs">+ New post</a>
      </div>
      <div className="pb__cols">
        {groups.map(([name, exp, list]) => (
          <div key={name} className={`pb__col is-${name.toLowerCase()}`}>
            <h3>{name} <span>{list.length}</span></h3>
            <p className="pb__exp">{exp}</p>
            {list.length === 0 ? <p className="pb__empty">None yet.</p> : (
              <div className="pb__list">
                {list.slice(0, 12).map((r) => {
                  const when = r.status === "scheduled" ? r.scheduledAt : r.status === "posted" ? r.publishedAt ?? r.updatedAt : r.updatedAt;
                  const href = r.status === "posted" && r.metaPostId ? `https://www.facebook.com/${r.metaPostId}` : `/creator/social?draftId=${r.id}&imageId=${encodeURIComponent(r.image ?? "")}&caption=${encodeURIComponent(r.caption.slice(0, 500))}&platform=${r.platform}`;
                  return (
                    <a key={r.id} href={href} className="pb__card" target={r.status === "posted" && r.metaPostId ? "_blank" : undefined} rel="noreferrer">
                      {r.image ? <img src={absoluteImageUrl(r.image)} alt="" loading="lazy" /> : <span className="pb__noimg" />}
                      <span className="pb__t">
                        <span className="pb__meta">{LABEL[r.platform] ?? r.platform}{when ? ` · ${fmtDay(when)} ${fmtTime(when)}` : ""}{r.status === "failed" ? " · failed" : r.status === "approved" ? " · approved" : r.status === "draft" ? " · draft" : ""}</span>
                        <span className="pb__cap">{r.caption}</span>
                      </span>
                    </a>
                  );
                })}
                {list.length > 12 && <p className="pb__empty">and {list.length - 12} more</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
