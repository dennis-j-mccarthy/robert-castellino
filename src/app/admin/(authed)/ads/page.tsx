import fs from "node:fs";
import path from "node:path";
import { adAccountId, isAdsConfigured } from "@/lib/meta/ads";
import { DEFAULT_LINK, PAGE_ID } from "@/lib/ads-drafts";
import AdsClient, { type LibraryImage } from "./AdsClient";

export const dynamic = "force-dynamic";

const IMG_RE = /\.(jpe?g|png|webp)$/i;

/** Every image under public/assets/collections/**, grouped by folder. */
function libraryImages(): LibraryImage[] {
  const root = path.join(process.cwd(), "public", "assets", "collections");
  const out: LibraryImage[] = [];
  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true, recursive: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (!e.isFile() || !IMG_RE.test(e.name)) continue;
    const parent = (e as fs.Dirent & { parentPath?: string; path?: string }).parentPath ??
      (e as fs.Dirent & { path?: string }).path ?? root;
    const rel = path.relative(root, path.join(parent, e.name)).split(path.sep).join("/");
    const collection = rel.includes("/") ? rel.split("/")[0] : "";
    out.push({
      src: `/assets/collections/${rel}`,
      collection,
      label: e.name.replace(IMG_RE, "").replace(/[-_]+/g, " "),
    });
  }
  out.sort((a, b) => a.collection.localeCompare(b.collection) || a.label.localeCompare(b.label));
  return out;
}

// The Ads maker: compose creative here, create it as a PAUSED ad in Bob's
// Meta ad account, review Meta's own preview, then activate when ready.
export default function AdminAdsPage() {
  return (
    <section className="admin-page">
      <h1>Ads</h1>
      <p>
        Build a Facebook / Instagram ad from Bob&rsquo;s photographs and send it
        to his ad account <em>paused</em>. Nothing spends until you press
        Activate.
      </p>
      <AdsClient
        configured={isAdsConfigured()}
        account={adAccountId()}
        pageId={PAGE_ID()}
        defaultLink={DEFAULT_LINK}
        library={libraryImages()}
      />
    </section>
  );
}
