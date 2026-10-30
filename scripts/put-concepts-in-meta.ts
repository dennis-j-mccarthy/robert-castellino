/*
  One-shot: put all 37 book concepts into the book campaign as PAUSED ads
  (one ad each, in the ad set named by --adset prefix, default "1 ·" Warm),
  then pull out every other ad in the campaign that is not a concept ad
  (the older v4 creatives). Idempotent: concepts already in Meta are skipped.

  Talks to Meta directly (upload image → creative → ad, status PAUSED;
  delete) — the same calls the creator page's "Put in Meta" / "Pull out"
  make, minus the AdDraft bookkeeping, so it also works where DATABASE_URL
  is not available locally. The creator page matches concepts by ad name.
  Nothing is activated.

    node --env-file=.env.local --import tsx scripts/put-concepts-in-meta.ts            # dry run
    node --env-file=.env.local --import tsx scripts/put-concepts-in-meta.ts --apply    # do it
    … --adset "1 ·"   choose the ad set by name prefix
    … --keep-old      don't pull the non-concept ads out
*/
import { CONCEPT_SETS, conceptAdName, conceptNumberFromAdName } from "../src/lib/creator/concepts";
import { BOOK_CAMPAIGN_ID } from "../src/lib/creator/in-market";
import { createAd, createCreative, deleteEntity, listAdSets, listAds, uploadImageFromUrl } from "../src/lib/meta/ads";

const SITE_URL = "https://robertcastellino.com";
const PAGE_ID = process.env.META_PAGE_ID || "134235743309639";
// Bob's Page has no linked Instagram; Meta's page-backed Instagram identity
// (already on the existing creatives) lets the ads run on Instagram placements.
const IG_ACTOR = process.env.META_IG_USER_ID || "17841405304551324";
const LINK = `${SITE_URL}/book`;

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const KEEP_OLD = args.includes("--keep-old");
const adsetPrefix = args.includes("--adset") ? args[args.indexOf("--adset") + 1] : "1 ·";

async function main() {
  const adsets = await listAdSets(BOOK_CAMPAIGN_ID);
  const target = adsets.find((s) => s.name.startsWith(adsetPrefix));
  if (!target) throw new Error(`No ad set starting with "${adsetPrefix}". Have: ${adsets.map((s) => s.name).join(" | ")}`);
  const live = await listAds(BOOK_CAMPAIGN_ID, false);
  const inMeta = new Set(live.map((a) => conceptNumberFromAdName(a.name)).filter((n): n is number => n != null));
  const concepts = CONCEPT_SETS.flatMap((s) => s.ads);
  const todo = concepts.filter((c) => !inMeta.has(c.n));
  const old = live.filter((a) => conceptNumberFromAdName(a.name) == null);

  console.log(`campaign ${BOOK_CAMPAIGN_ID} · ad set "${target.name}" (${target.id})`);
  console.log(`concepts: ${concepts.length} total, ${inMeta.size} already in Meta, ${todo.length} to create`);
  console.log(`non-concept ads to pull out: ${old.length}${KEEP_OLD ? " (kept: --keep-old)" : ""}`);
  if (!APPLY) { console.log("dry run — pass --apply to execute"); return; }

  const hashes = new Map<string, string>(); // plate src → image hash (upload each plate once)
  let created = 0, failed = 0;
  for (const c of todo) {
    const name = conceptAdName(c);
    try {
      let hash = hashes.get(c.plate.src);
      if (!hash) {
        hash = (await uploadImageFromUrl(`${SITE_URL}${c.plate.src}`)).hash;
        hashes.set(c.plate.src, hash);
      }
      const base = { pageId: PAGE_ID, name: `${name} · creative`, imageHash: hash, message: c.pt, headline: c.t, description: c.d, link: LINK, ctaType: "SHOP_NOW", displayLink: "robertcastellino.com" };
      let creativeId: string;
      try {
        creativeId = (await createCreative({ ...base, instagramActorId: IG_ACTOR })).id;
      } catch {
        // If Meta won't take the page-backed id here, let it assign the Instagram identity itself.
        creativeId = (await createCreative(base)).id;
      }
      const { id: adId } = await createAd({ adsetId: target.id, name, creativeId, status: "PAUSED" });
      created++;
      console.log(`  + ${name}  →  ${adId}`);
    } catch (e) {
      failed++;
      console.log(`  ! ${name}  FAILED: ${e instanceof Error ? e.message : e}`);
    }
  }
  console.log(`created ${created}, failed ${failed}`);

  if (!KEEP_OLD && failed === 0) {
    let removed = 0;
    for (const a of old) {
      try {
        await deleteEntity(a.id);
        removed++;
        console.log(`  - pulled out ${a.name} (${a.id})`);
      } catch (e) {
        console.log(`  ! could not pull out ${a.name}: ${e instanceof Error ? e.message : e}`);
      }
    }
    console.log(`pulled out ${removed} of ${old.length}`);
  } else if (!KEEP_OLD) {
    console.log("skipped pull-out because some concepts failed to create");
  }

  const after = await listAds(BOOK_CAMPAIGN_ID, false);
  const active = after.filter((a) => a.effectiveStatus === "ACTIVE").length;
  console.log(`campaign now has ${after.length} ads · ${active} ACTIVE (must be 0)`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
