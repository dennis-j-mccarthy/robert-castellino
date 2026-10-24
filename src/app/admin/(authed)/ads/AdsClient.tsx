"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export interface LibraryImage {
  src: string; // /assets/collections/…
  collection: string;
  label: string;
  /** Page where this plate appears in the print PDF of the book, when it does. */
  bookPage?: number;
}

const IN_BOOK = "__book__";

interface Props {
  configured: boolean;
  account: string;
  pageId: string;
  defaultLink: string;
  library: LibraryImage[];
}

interface Insights {
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
  cpc: number;
}

interface Draft {
  id: string;
  name: string;
  imageUrl: string;
  imageHash: string | null;
  message: string;
  headline: string;
  description: string | null;
  link: string;
  ctaType: string;
  campaignId: string | null;
  adsetId: string | null;
  creativeId: string | null;
  metaAdId: string | null;
  status: string;
  error: string | null;
  previewUrl: string | null;
  adsManagerUrl: string | null;
  metaStatus?: string | null;
  adsetName?: string | null;
  insights?: Insights | null;
}

interface Campaign {
  id: string;
  name: string;
  objective: string;
  effectiveStatus: string;
  dailyBudget: number | null;
}
interface AdSet {
  id: string;
  name: string;
  optimizationGoal: string;
  effectiveStatus: string;
}

const CTAS = [
  ["SHOP_NOW", "Shop now"],
  ["LEARN_MORE", "Learn more"],
  ["BUY_NOW", "Buy now"],
  ["ORDER_NOW", "Order now"],
  ["GET_OFFER", "Get offer"],
] as const;
const ctaLabel = (t: string) => CTAS.find(([k]) => k === t)?.[1] ?? t;

// The book's close, shared by every preset; the hook is what changes.
const BOOK_CLOSE =
  "Colorado: Life & Light on the Land — 84 plates, 116 pages, first printing, signed and numbered, certificate of authenticity. $49.95. Shop the signed copy.";
const PRESETS: Array<{ label: string; headline: string; message: string; description: string }> = [
  { label: "Boulder mornings", headline: "Fifty Years of Boulder Mornings — The Book", description: "Signed & numbered first printing · 84 plates · $49.95",
    message: `Boulder looks up at the Flatirons every morning. Robert Castellino waited fifty years for this one.\n\n${BOOK_CLOSE}` },
  { label: "No fakes", headline: "No Filters. No Fakes. 84 Real Colorado Mornings.", description: "The signed book · First printing · $49.95",
    message: `The most photographed mountains in Colorado — and still, nobody stood exactly here on exactly this morning. Eighty-four plates like it, every one a real place, in one signed book.\n\n${BOOK_CLOSE}` },
  { label: "Asleep for this", headline: "The Light You Slept Through, Bound in a Book", description: "Signed & numbered · 84 plates · $49.95",
    message: `Most people were asleep for this. You can keep it on the coffee table anyway.\n\n${BOOK_CLOSE}` },
  { label: "Doesn't fit on a phone", headline: "Colorado, at a Size Your Phone Can't Manage", description: "Signed hardcover · 84 plates · 116 pages · $49.95",
    message: `Colorado doesn't fit on a phone. It barely fits in 116 pages.\n\n${BOOK_CLOSE}` },
  { label: "Turn pages", headline: "Made to Be Turned, Not Scrolled", description: "The signed Colorado book · $49.95",
    message: `Some photographs you scroll past. These you turn pages for.\n\n${BOOK_CLOSE}` },
  { label: "One of them was yours", headline: "Five Decades of Colorado Dawn. One Signed Book.", description: "First printing · Numbered · $49.95",
    message: `Fifty years of Colorado sunrises. Odds are one of them was yours.\n\n${BOOK_CLOSE}` },
  { label: "Ten days of gold", headline: "Ten Days of Gold, Kept for Good — The Book", description: "Signed & numbered first printing · $49.95",
    message: `Aspen gold lasts about ten days in the mountains. In this book it lasts as long as you keep it.\n\n${BOOK_CLOSE}` },
  { label: "Not a screen", headline: "Put Colorado on the Table, Not in a Tab", description: "Signed hardcover · 84 plates · $49.95",
    message: `Not a feed. Not a screen. 116 pages of Colorado you can actually hold.\n\n${BOOK_CLOSE}` },
  { label: "No charger", headline: "The Colorado Gift That Never Needs Charging", description: "Signed & numbered book · $49.95",
    message: `The gift that doesn't need a charger, a password, or a software update.\n\n${BOOK_CLOSE}` },
  { label: "One evening", headline: "Fifty Years to Make. One Evening to Fall For.", description: "Signed & numbered first printing · $49.95",
    message: `Fifty years in the making. One evening to read. A lifetime on the shelf.\n\n${BOOK_CLOSE}` },
];

const PREVIEW_FORMATS: Array<[string, string]> = [
  ["MOBILE_FEED_STANDARD", "FB mobile feed"],
  ["DESKTOP_FEED_STANDARD", "FB desktop feed"],
  ["INSTAGRAM_STANDARD", "Instagram feed"],
  ["INSTAGRAM_STORY", "Instagram story"],
  ["FACEBOOK_STORY_MOBILE", "FB story"],
];

const money = (n: number) => `$${n.toFixed(2)}`;

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export default function AdsClient(props: Props) {
  const { configured, account, library, defaultLink } = props;

  // ① image — book ads start on the plates that are actually in the book.
  const bookPlates = useMemo(() => library.filter((i) => i.bookPage), [library]);
  const [imageUrl, setImageUrl] = useState<string>((bookPlates[0] ?? library[0])?.src ?? "");
  const [customUrl, setCustomUrl] = useState("");
  const [collection, setCollection] = useState<string>(bookPlates.length ? IN_BOOK : "");
  // ② copy
  const [name, setName] = useState("Book · Signed copy $49.95");
  const [headline, setHeadline] = useState(PRESETS[0].headline);
  const [message, setMessage] = useState(PRESETS[0].message);
  const [description, setDescription] = useState(PRESETS[0].description);
  const [ctaType, setCtaType] = useState<string>("SHOP_NOW");
  const [link, setLink] = useState(defaultLink);
  // ③ destination
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState("");
  const [adsets, setAdsets] = useState<AdSet[]>([]);
  const [adsetIds, setAdsetIds] = useState<string[]>([]);
  const [destError, setDestError] = useState<string | null>(null);
  // ④ preview / submit
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [current, setCurrent] = useState<Draft | null>(null); // last submitted from the maker
  const [metaPreview, setMetaPreview] = useState<{ src: string | null; format: string } | null>(null);
  // table
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [dupFor, setDupFor] = useState<Draft | null>(null);
  const [dupIds, setDupIds] = useState<string[]>([]);
  const [confirmFor, setConfirmFor] = useState<Draft | null>(null);

  const collections = useMemo(
    () => Array.from(new Set(library.map((i) => i.collection))).filter(Boolean),
    [library],
  );
  const shown = useMemo(
    () =>
      collection === IN_BOOK
        ? bookPlates
        : collection
          ? library.filter((i) => i.collection === collection)
          : library,
    [library, bookPlates, collection],
  );
  const selectedPlate = library.find((i) => i.src === imageUrl);
  const selectedCampaign = campaigns.find((c) => c.id === campaignId);
  const isBookCampaign = /book/i.test(selectedCampaign?.name ?? "");
  // A book ad must show a plate from the book — anything else misrepresents it.
  const notInBook = isBookCampaign && !!imageUrl && !selectedPlate?.bookPage;
  const displayLink = (() => {
    try {
      return new URL(link).hostname.toUpperCase();
    } catch {
      return "ROBERTCASTELLINO.COM";
    }
  })();

  // State is only set inside promise callbacks (external-system sync).
  const loadDrafts = useCallback(
    () =>
      api<{ items: Draft[]; liveError: string | null }>("/api/admin/ads")
        .then((d) => {
          setDrafts(d.items);
          setLiveError(d.liveError);
        })
        .catch((e: Error) => setNotice({ kind: "err", text: e.message || "Couldn't load ads." })),
    [],
  );

  const selectCampaign = useCallback((id: string) => {
    setCampaignId(id);
    setAdsets([]);
    setAdsetIds([]);
    if (!id) return;
    api<{ items: AdSet[] }>(`/api/admin/ads/adsets?campaignId=${encodeURIComponent(id)}`)
      .then((d) => setAdsets(d.items))
      .catch((e: Error) => setDestError(e.message));
  }, []);

  useEffect(() => {
    void loadDrafts();
    if (!configured) return;
    api<{ items: Campaign[] }>("/api/admin/ads/campaigns")
      .then((d) => {
        setCampaigns(d.items);
        const first = d.items.find((c) => /book/i.test(c.name)) ?? d.items[0];
        if (first) selectCampaign(first.id);
      })
      .catch((e: Error) => setDestError(e.message));
  }, [configured, loadDrafts, selectCampaign]);

  function applyPreset(p: (typeof PRESETS)[number]) {
    setHeadline(p.headline);
    setMessage(p.message);
    setDescription(p.description);
  }

  function toggle(list: string[], id: string, set: (v: string[]) => void) {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  const draftBody = () => ({
    name,
    imageUrl,
    message,
    headline,
    description,
    link,
    ctaType,
    campaignId,
    adsetId: adsetIds[0] ?? "",
  });

  async function saveDraft() {
    setBusy("save");
    setNotice(null);
    try {
      const d = await api<{ item: Draft }>("/api/admin/ads", {
        method: "POST",
        body: JSON.stringify(draftBody()),
      });
      setCurrent(d.item);
      setNotice({ kind: "ok", text: "Draft saved (not sent to Meta)." });
      await loadDrafts();
    } catch (e) {
      setNotice({ kind: "err", text: e instanceof Error ? e.message : "Save failed." });
    } finally {
      setBusy(null);
    }
  }

  async function sendToMeta() {
    if (!adsetIds.length) {
      setNotice({ kind: "err", text: "Pick at least one ad set in ③ Destination." });
      return;
    }
    setBusy("send");
    setNotice(null);
    setMetaPreview(null);
    try {
      const created = await api<{ item: Draft }>("/api/admin/ads", {
        method: "POST",
        body: JSON.stringify(draftBody()),
      });
      const sent = await api<{ item: Draft }>(`/api/admin/ads/${created.item.id}/submit`, {
        method: "POST",
        body: JSON.stringify({ adsetId: adsetIds[0] }),
      });
      setCurrent(sent.item);
      setMetaPreview({ src: sent.item.previewUrl, format: "MOBILE_FEED_STANDARD" });
      let extra = "";
      if (adsetIds.length > 1) {
        const dup = await api<{ items: Draft[]; errors: Array<{ error: string }> }>(
          `/api/admin/ads/${created.item.id}/duplicate`,
          { method: "POST", body: JSON.stringify({ adsetIds: adsetIds.slice(1) }) },
        );
        extra = ` +${dup.items.length} more ad set${dup.items.length === 1 ? "" : "s"}`;
        if (dup.errors.length) extra += ` (${dup.errors.length} failed: ${dup.errors[0].error})`;
      }
      setNotice({ kind: "ok", text: `Created in Meta, paused — ad ${sent.item.metaAdId}${extra}.` });
      await loadDrafts();
    } catch (e) {
      setNotice({ kind: "err", text: e instanceof Error ? e.message : "Send failed." });
      await loadDrafts();
    } finally {
      setBusy(null);
    }
  }

  async function loadMetaPreview(d: Draft, format: string) {
    setBusy(`preview:${d.id}`);
    try {
      const p = await api<{ src: string | null }>(
        `/api/admin/ads/${d.id}/preview?format=${encodeURIComponent(format)}`,
      );
      setCurrent(d);
      setMetaPreview({ src: p.src, format });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setNotice({ kind: "err", text: e instanceof Error ? e.message : "Preview failed." });
    } finally {
      setBusy(null);
    }
  }

  async function setStatus(d: Draft, status: "ACTIVE" | "PAUSED") {
    setBusy(`status:${d.id}`);
    setNotice(null);
    try {
      await api(`/api/admin/ads/${d.id}/status`, {
        method: "POST",
        body: JSON.stringify({ status, confirm: status === "ACTIVE" }),
      });
      setNotice({ kind: "ok", text: status === "ACTIVE" ? `“${d.name}” is now active.` : `“${d.name}” paused.` });
      await loadDrafts();
    } catch (e) {
      setNotice({ kind: "err", text: e instanceof Error ? e.message : "Status change failed." });
    } finally {
      setBusy(null);
      setConfirmFor(null);
    }
  }

  async function resubmit(d: Draft) {
    setBusy(`submit:${d.id}`);
    setNotice(null);
    try {
      const r = await api<{ item: Draft }>(`/api/admin/ads/${d.id}/submit`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setCurrent(r.item);
      setMetaPreview({ src: r.item.previewUrl, format: "MOBILE_FEED_STANDARD" });
      setNotice({ kind: "ok", text: `Created in Meta, paused — ad ${r.item.metaAdId}.` });
      await loadDrafts();
    } catch (e) {
      setNotice({ kind: "err", text: e instanceof Error ? e.message : "Send failed." });
      await loadDrafts();
    } finally {
      setBusy(null);
    }
  }

  async function remove(d: Draft) {
    if (!window.confirm(`Delete draft “${d.name}”?`)) return;
    setBusy(`delete:${d.id}`);
    try {
      await api(`/api/admin/ads/${d.id}`, { method: "DELETE" });
      if (current?.id === d.id) setCurrent(null);
      await loadDrafts();
    } catch (e) {
      setNotice({ kind: "err", text: e instanceof Error ? e.message : "Delete failed." });
    } finally {
      setBusy(null);
    }
  }

  async function duplicate() {
    if (!dupFor || !dupIds.length) return;
    setBusy(`dup:${dupFor.id}`);
    setNotice(null);
    try {
      const r = await api<{ items: Draft[]; errors: Array<{ adsetId: string; error: string }> }>(
        `/api/admin/ads/${dupFor.id}/duplicate`,
        { method: "POST", body: JSON.stringify({ adsetIds: dupIds }) },
      );
      const msg = `Duplicated into ${r.items.length} ad set${r.items.length === 1 ? "" : "s"} (paused).`;
      setNotice(
        r.errors.length
          ? { kind: "err", text: `${msg} ${r.errors.length} failed: ${r.errors[0].error}` }
          : { kind: "ok", text: msg },
      );
      setDupFor(null);
      setDupIds([]);
      await loadDrafts();
    } catch (e) {
      setNotice({ kind: "err", text: e instanceof Error ? e.message : "Duplicate failed." });
    } finally {
      setBusy(null);
    }
  }

  const canSend = configured && !!imageUrl && !notInBook && !!headline.trim() && !!message.trim() && adsetIds.length > 0 && !busy;

  return (
    <div className="ads">
      {!configured && (
        <div className="ads-notice ads-notice--warn">
          <strong>Ads token not configured.</strong> Add <code>META_ADS_TOKEN</code> (a user or
          system-user token with <code>ads_management</code>) and optionally{" "}
          <code>META_AD_ACCOUNT_ID</code>. See <code>docs/ADS_SETUP.md</code>. You can still compose
          and save drafts.
        </div>
      )}
      {notice && (
        <div className={`ads-notice ${notice.kind === "ok" ? "ads-notice--ok" : "ads-notice--err"}`}>
          {notice.text}
        </div>
      )}

      {/* ───── Maker ───── */}
      <div className="ads-maker">
        {/* ① Image */}
        <section className="ads-step">
          <header className="ads-step__title"><span>①</span> Image</header>
          <div className="ads-row">
            <select className="ads-input" value={collection} onChange={(e) => setCollection(e.target.value)}>
              {bookPlates.length > 0 && <option value={IN_BOOK}>In the book ({bookPlates.length})</option>}
              <option value="">All collections ({library.length})</option>
              {collections.map((c) => (
                <option key={c} value={c}>{c.replace(/-/g, " ")}</option>
              ))}
            </select>
          </div>
          <div className="ads-grid">
            {shown.map((img) => (
              <button
                key={img.src}
                type="button"
                className={`ads-thumb${imageUrl === img.src ? " is-selected" : ""}`}
                title={img.bookPage ? `${img.label} · book p.${img.bookPage}` : img.label}
                onClick={() => { setImageUrl(img.src); setCustomUrl(""); }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- static library thumbs */}
                <img src={img.src} alt={img.label} loading="lazy" />
                {img.bookPage && <span className="ads-thumb__page">p.{img.bookPage}</span>}
              </button>
            ))}
          </div>
          {notInBook && (
            <div className="ads-hint ads-hint--err">
              This image isn&rsquo;t a plate from the book. Book ads should only show plates that are in it
              — pick from <b>In the book</b>.
            </div>
          )}
          {selectedPlate?.bookPage && (
            <div className="ads-hint">Plate from the book · page {selectedPlate.bookPage}.</div>
          )}
          <label className="ads-label">or paste a public image URL</label>
          <input
            className="ads-input"
            placeholder="https://…/photo.jpg"
            value={customUrl}
            onChange={(e) => { setCustomUrl(e.target.value); if (e.target.value.trim()) setImageUrl(e.target.value.trim()); }}
          />
          <div className="ads-hint">Feed ads work best at 1:1 or 4:5; Meta crops from the centre.</div>
        </section>

        {/* ② Copy */}
        <section className="ads-step">
          <header className="ads-step__title"><span>②</span> Copy</header>
          <label className="ads-label">Ad name (internal)</label>
          <input className="ads-input" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="ads-label">Presets</label>
          <div className="ads-row">
            {PRESETS.map((p) => (
              <button key={p.label} type="button" className="btn btn--ghost ads-btn-sm" onClick={() => applyPreset(p)}>
                {p.label}
              </button>
            ))}
          </div>
          <label className="ads-label">Headline</label>
          <input className="ads-input" value={headline} maxLength={255} onChange={(e) => setHeadline(e.target.value)} />
          <label className="ads-label">Primary text</label>
          <textarea className="ads-input ads-textarea" value={message} maxLength={2000} onChange={(e) => setMessage(e.target.value)} />
          <label className="ads-label">Description (under headline)</label>
          <input className="ads-input" value={description} maxLength={255} onChange={(e) => setDescription(e.target.value)} />
          <div className="ads-row ads-row--2">
            <div>
              <label className="ads-label">Call to action</label>
              <select className="ads-input" value={ctaType} onChange={(e) => setCtaType(e.target.value)}>
                {CTAS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="ads-label">Link</label>
              <input className="ads-input" value={link} onChange={(e) => setLink(e.target.value)} />
            </div>
          </div>
        </section>

        {/* ③ Destination */}
        <section className="ads-step">
          <header className="ads-step__title"><span>③</span> Destination</header>
          {destError && <div className="ads-hint ads-hint--err">{destError}</div>}
          <label className="ads-label">Campaign</label>
          <select className="ads-input" value={campaignId} onChange={(e) => selectCampaign(e.target.value)} disabled={!campaigns.length}>
            {!campaigns.length && <option value="">{configured ? "Loading…" : "Ads token not configured"}</option>}
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.effectiveStatus.toLowerCase()}{c.dailyBudget ? ` · $${c.dailyBudget}/day` : ""}
              </option>
            ))}
          </select>
          <label className="ads-label">Ad sets (audiences) — pick one or more</label>
          <div className="ads-checklist">
            {!adsets.length && <div className="ads-hint">{campaignId ? "Loading ad sets…" : "Choose a campaign."}</div>}
            {adsets.map((s) => (
              <label key={s.id} className="ads-check">
                <input
                  type="checkbox"
                  checked={adsetIds.includes(s.id)}
                  onChange={() => toggle(adsetIds, s.id, setAdsetIds)}
                />
                <span>{s.name}</span>
                <small>{s.optimizationGoal.replace(/_/g, " ").toLowerCase()} · {s.effectiveStatus.toLowerCase()}</small>
              </label>
            ))}
          </div>
          {adsetIds.length > 1 && (
            <div className="ads-hint">One creative, {adsetIds.length} ads — one per ad set. All paused.</div>
          )}
          <div className="ads-hint" style={{ marginTop: 14 }}>
            Account <code>act_{account}</code> · Page <code>{props.pageId}</code>
          </div>
        </section>

        {/* ④ Preview */}
        <section className="ads-step ads-step--preview">
          <header className="ads-step__title"><span>④</span> Preview</header>

          {/* Facebook mobile feed mock */}
          <article className="fbcard">
            <header className="fbcard__head">
              <div className="fbcard__avatar">RC</div>
              <div>
                <div className="fbcard__page">Robert Castellino Photography</div>
                <div className="fbcard__meta">Sponsored · <span aria-hidden>🌐</span></div>
              </div>
            </header>
            <p className="fbcard__msg">{message || "Primary text…"}</p>
            <div className="fbcard__img">
              {imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element -- live preview of arbitrary URL */
                <img src={imageUrl} alt="" />
              ) : (
                <div className="fbcard__img-empty">Pick an image</div>
              )}
            </div>
            <footer className="fbcard__foot">
              <div className="fbcard__link">
                <div className="fbcard__domain">{displayLink}</div>
                <div className="fbcard__headline">{headline || "Headline"}</div>
                {description && <div className="fbcard__desc">{description}</div>}
              </div>
              <span className="fbcard__cta">{ctaLabel(ctaType)}</span>
            </footer>
          </article>

          <div className="ads-row" style={{ marginTop: 14 }}>
            <button className="btn btn--gold" onClick={sendToMeta} disabled={!canSend}>
              {busy === "send" ? "Sending…" : "Send to Meta (paused)"}
            </button>
            <button className="btn btn--ghost" onClick={saveDraft} disabled={!!busy || !imageUrl}>
              {busy === "save" ? "Saving…" : "Save draft"}
            </button>
          </div>

          {/* Meta's real preview, once a creative exists */}
          {current?.creativeId && (
            <div className="ads-metapreview">
              <div className="ads-row ads-row--between">
                <span className="ads-label" style={{ margin: 0 }}>Meta preview · {current.name}</span>
                <select
                  className="ads-input ads-input--sm"
                  value={metaPreview?.format ?? "MOBILE_FEED_STANDARD"}
                  onChange={(e) => void loadMetaPreview(current, e.target.value)}
                >
                  {PREVIEW_FORMATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
              {metaPreview?.src ? (
                <iframe
                  key={metaPreview.src}
                  src={metaPreview.src}
                  title="Meta ad preview"
                  className="ads-metapreview__frame"
                  scrolling="yes"
                />
              ) : (
                <div className="ads-hint">
                  {busy?.startsWith("preview") ? "Loading Meta preview…" : "No preview yet."}
                  {" "}
                  <button type="button" className="ads-linkbtn" onClick={() => void loadMetaPreview(current, metaPreview?.format ?? "MOBILE_FEED_STANDARD")}>
                    Load
                  </button>
                </div>
              )}
              {current.adsManagerUrl && (
                <a className="btn btn--ghost ads-btn-sm" href={current.adsManagerUrl} target="_blank" rel="noreferrer">
                  View ad in Meta ↗
                </a>
              )}
            </div>
          )}
        </section>
      </div>

      {/* ───── Ads table ───── */}
      <section className="ads-list">
        <header className="ads-list__head">
          <h2>Ads</h2>
          <div className="ads-row">
            {liveError && <span className="ads-hint ads-hint--err">Live status unavailable: {liveError}</span>}
            <button type="button" className="btn btn--ghost ads-btn-sm" onClick={() => void loadDrafts()} disabled={!!busy}>
              Refresh
            </button>
          </div>
        </header>
        {!drafts.length ? (
          <div className="ads-hint">No ads yet. Compose one above and send it to Meta paused.</div>
        ) : (
          <div className="ads-tablewrap">
            <table className="ads-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Ad set</th>
                  <th>Status</th>
                  <th>7d spend</th>
                  <th>Clicks</th>
                  <th>CTR</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((d) => {
                  const st = d.status;
                  const live = !!d.metaAdId;
                  const ins = d.insights;
                  const rowBusy = busy?.endsWith(`:${d.id}`);
                  return (
                    <tr key={d.id}>
                      <td>
                        {/* eslint-disable-next-line @next/next/no-img-element -- thumb of arbitrary URL */}
                        <img className="ads-table__thumb" src={d.imageUrl} alt="" />
                      </td>
                      <td>
                        <div className="ads-table__name">{d.name}</div>
                        <div className="ads-table__sub">{d.headline}</div>
                        {d.error && <div className="ads-table__err">{d.error}</div>}
                      </td>
                      <td className="ads-table__sub">{d.adsetName || d.adsetId || "—"}</td>
                      <td>
                        <span className={`ads-pill ads-pill--${st}`} title={d.metaStatus ?? st}>{st}</span>
                        {d.metaStatus && !["ACTIVE", "PAUSED"].includes(d.metaStatus) && (
                          <div className="ads-table__sub">{d.metaStatus.replace(/_/g, " ").toLowerCase()}</div>
                        )}
                      </td>
                      <td>{ins && (st === "active" || ins.spend > 0) ? money(ins.spend) : "—"}</td>
                      <td>{ins && (st === "active" || ins.clicks > 0) ? ins.clicks : "—"}</td>
                      <td>{ins && (st === "active" || ins.impressions > 0) ? `${ins.ctr.toFixed(2)}%` : "—"}</td>
                      <td className="ads-table__actions">
                        {live && st !== "active" && (
                          <button type="button" className="btn btn--gold ads-btn-xs" disabled={!!busy} onClick={() => setConfirmFor(d)}>
                            Activate
                          </button>
                        )}
                        {live && st === "active" && (
                          <button type="button" className="btn btn--ghost ads-btn-xs" disabled={!!busy} onClick={() => void setStatus(d, "PAUSED")}>
                            {rowBusy ? "…" : "Pause"}
                          </button>
                        )}
                        {live && (
                          <button type="button" className="btn btn--ghost ads-btn-xs" disabled={!!busy} onClick={() => { setDupFor(d); setDupIds([]); if (d.campaignId && d.campaignId !== campaignId) selectCampaign(d.campaignId); }}>
                            Duplicate
                          </button>
                        )}
                        {d.creativeId && (
                          <button type="button" className="btn btn--ghost ads-btn-xs" disabled={!!busy} onClick={() => void loadMetaPreview(d, "MOBILE_FEED_STANDARD")}>
                            Preview
                          </button>
                        )}
                        {!live && (
                          <button type="button" className="btn btn--gold ads-btn-xs" disabled={!!busy || !configured || !d.adsetId} title={d.adsetId ? "" : "No ad set chosen"} onClick={() => void resubmit(d)}>
                            {rowBusy ? "…" : "Send"}
                          </button>
                        )}
                        {!live && (
                          <button type="button" className="btn btn--ghost ads-btn-xs" disabled={!!busy} onClick={() => void remove(d)}>
                            Delete
                          </button>
                        )}
                        {d.adsManagerUrl && (
                          <a className="btn btn--ghost ads-btn-xs" href={d.adsManagerUrl} target="_blank" rel="noreferrer">View in Meta ↗</a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Activate confirm */}
      {confirmFor && (
        <div className="ads-modal" role="dialog" aria-modal="true">
          <div className="ads-modal__card">
            <h3>Activate “{confirmFor.name}”?</h3>
            <p>This starts spending from the campaign budget. The ad set and campaign must also be active for delivery.</p>
            <div className="ads-row">
              <button className="btn btn--gold" disabled={!!busy} onClick={() => void setStatus(confirmFor, "ACTIVE")}>
                {busy ? "Working…" : "Activate — start spending"}
              </button>
              <button className="btn btn--ghost" disabled={!!busy} onClick={() => setConfirmFor(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate to other audiences */}
      {dupFor && (
        <div className="ads-modal" role="dialog" aria-modal="true">
          <div className="ads-modal__card">
            <h3>Duplicate “{dupFor.name}”</h3>
            <p>Same creative into other ad sets of this campaign. New ads are created paused.</p>
            <div className="ads-checklist">
              {adsets.filter((s) => s.id !== dupFor.adsetId).map((s) => (
                <label key={s.id} className="ads-check">
                  <input type="checkbox" checked={dupIds.includes(s.id)} onChange={() => toggle(dupIds, s.id, setDupIds)} />
                  <span>{s.name}</span>
                </label>
              ))}
              {!adsets.length && <div className="ads-hint">Loading ad sets…</div>}
            </div>
            <div className="ads-row">
              <button className="btn btn--gold" disabled={!!busy || !dupIds.length} onClick={() => void duplicate()}>
                {busy ? "Working…" : `Duplicate into ${dupIds.length || ""} ad set${dupIds.length === 1 ? "" : "s"}`}
              </button>
              <button className="btn btn--ghost" disabled={!!busy} onClick={() => setDupFor(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
