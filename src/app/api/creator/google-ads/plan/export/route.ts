import { loadAdsPlan, planToEditorCsv } from "@/lib/creator/ads-plan";
import { creatorGuard } from "@/lib/creator/guard";
import { studio } from "@/studio.config";

/* GET → the plan as a Google Ads Editor CSV (download). */
export const runtime = "nodejs";

export async function GET() {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  const csv = planToEditorCsv(await loadAdsPlan());
  const name = `${studio.site.short.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-google-ads-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"` } });
}
