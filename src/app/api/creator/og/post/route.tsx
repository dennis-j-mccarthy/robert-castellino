import { ImageResponse } from "next/og";
import { SIZES, designedPalette, type DesignedSize, type DesignedTheme } from "@/lib/creator/designed";
import { studio } from "@/studio.config";

/*
  GET /api/creator/og/post — renders a designed post as a PNG from query
  params (theme, tone, size, eyebrow, statement, sub, statLabel, items, img).
  Public on purpose: Facebook fetches the picture when a post is published.
  It renders only the text it is given, in the site's colours and font, with
  the site's wordmark; nothing here reads the database.
*/
export const runtime = "nodejs";

const UA = "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:12.0) Gecko/20100101 Firefox/12.0"; // makes Google serve woff/ttf, which satori can read
const fontCache = new Map<string, Promise<ArrayBuffer | null>>();
function googleFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  const key = `${family}:${weight}`;
  if (!fontCache.has(key)) {
    fontCache.set(key, (async () => {
      try {
        const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`, { headers: { "User-Agent": UA } })).text();
        const m = css.match(/src: url\(([^)]+)\)/);
        if (!m) return null;
        return await (await fetch(m[1])).arrayBuffer();
      } catch {
        return null;
      }
    })());
  }
  return fontCache.get(key)!;
}

const clean = (s: string | null, max: number) => (s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
function rgba(h: string, a: number) {
  const m = h.replace("#", "");
  const n = m.length === 3 ? m.split("").map((c) => c + c).join("") : m.padEnd(6, "0").slice(0, 6);
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function Check({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", width: 40, height: 40, borderRadius: 10, backgroundColor: color, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <div style={{ display: "flex", width: 14, height: 24, borderRight: "5px solid #fff", borderBottom: "5px solid #fff", transform: "rotate(45deg)", marginTop: -6 }} />
    </div>
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams;
  const pal = designedPalette();
  const theme = (q.get("theme") || "statement") as DesignedTheme;
  const tone = (q.get("tone") || "field") as "field" | "paper" | "ink";
  const size = (q.get("size") || "square") as DesignedSize;
  const [w, h] = SIZES[size] ?? SIZES.square;
  const eyebrow = clean(q.get("eyebrow"), 60).toUpperCase();
  const statement = clean(q.get("statement"), 160) || studio.brand.tagline;
  const sub = clean(q.get("sub"), 220);
  const statLabel = clean(q.get("statLabel"), 40).toUpperCase();
  const items = (q.get("items") || "").split("|").map((s) => clean(s, 60)).filter(Boolean).slice(0, 5);
  const img = q.get("img") || "";
  const imgUrl = /^https?:\/\//i.test(img) ? img : img ? `${url.origin}${img.startsWith("/") ? "" : "/"}${img}` : "";

  const [b700, b500] = await Promise.all([googleFont(pal.font, 700), googleFont(pal.font, 500)]);
  const fonts = [b700 && { name: "Brand", data: b700, weight: 700 as const, style: "normal" as const }, b500 && { name: "Brand", data: b500, weight: 500 as const, style: "normal" as const }].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 700 | 500; style: "normal" }[];
  const family = fonts.length ? "Brand" : "sans-serif";

  // Colours by tone.
  const bg = tone === "ink" ? pal.ink : tone === "paper" ? pal.paper : pal.accent;
  const fg = tone === "paper" ? pal.ink : "#ffffff";
  const soft = tone === "paper" ? rgba(pal.ink, 0.66) : "rgba(255,255,255,0.78)";
  const eye = tone === "paper" ? pal.accent : tone === "ink" ? pal.accent2 : "rgba(255,255,255,0.85)";
  const pad = Math.round(w * 0.085);
  const tall = h / w;
  const base = { width: "100%", height: "100%", display: "flex", flexDirection: "column" as const, padding: pad, fontFamily: family, backgroundColor: bg, color: fg, justifyContent: "space-between" as const };

  const logo = studio.brand.logo ? (/^https?:\/\//i.test(studio.brand.logo) ? studio.brand.logo : `${url.origin}${studio.brand.logo}`) : null;
  const Wordmark = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} height={44} alt="" style={{ height: 44, objectFit: "contain", filter: tone === "paper" ? "none" : "brightness(0) invert(1)" }} />
        ) : (
          <div style={{ display: "flex", fontSize: 26, fontWeight: 700, letterSpacing: 1 }}>{studio.site.name}</div>
        )}
      </div>
      <div style={{ display: "flex", fontSize: 20, fontWeight: 500, color: soft }}>{pal.domain}</div>
    </div>
  );
  const Eyebrow = ({ text, color }: { text: string; color?: string }) =>
    text ? <div style={{ display: "flex", fontSize: 24, fontWeight: 700, letterSpacing: 5, color: color ?? eye }}>{text}</div> : <div style={{ display: "flex" }} />;

  let node: React.ReactNode;
  if (theme === "stat") {
    node = (
      <div style={{ ...base, backgroundColor: tone === "field" ? pal.paper : bg, color: tone === "field" ? pal.ink : fg }}>
        <Eyebrow text={eyebrow || "BY THE NUMBERS"} color={pal.accent} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: statement.length > 6 ? 170 : 230, fontWeight: 700, lineHeight: 1, letterSpacing: -6, color: pal.accent }}>{statement}</div>
          {statLabel ? <div style={{ display: "flex", fontSize: 28, fontWeight: 700, letterSpacing: 6, color: tone === "field" ? rgba(pal.ink, 0.6) : soft, marginTop: 10 }}>{statLabel}</div> : null}
          {sub ? <div style={{ display: "flex", fontSize: 36, fontWeight: 500, lineHeight: 1.3, marginTop: 30, maxWidth: w - pad * 2 - 60 }}>{sub}</div> : null}
        </div>
        <Wordmark />
      </div>
    );
  } else if (theme === "checklist" || theme === "steps") {
    const steps = theme === "steps";
    node = (
      <div style={base}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Eyebrow text={eyebrow || (steps ? "HOW IT WORKS" : "WHAT YOU GET")} />
          <div style={{ display: "flex", fontSize: statement.length > 40 ? 64 : 78, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2, marginTop: 20, maxWidth: w - pad * 2 }}>{statement}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {items.slice(0, steps ? 4 : 5).map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: 26 }}>
              {steps ? (
                <div style={{ display: "flex", width: 64, height: 64, borderRadius: 999, backgroundColor: tone === "paper" ? pal.accent : "#ffffff", color: tone === "paper" ? "#ffffff" : pal.ink, fontSize: 32, fontWeight: 700, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
              ) : (
                <Check color={tone === "paper" ? pal.accent2 : "rgba(255,255,255,0.28)"} />
              )}
              <div style={{ display: "flex", fontSize: 38, fontWeight: 500, marginLeft: 24, lineHeight: 1.15 }}>{it}</div>
            </div>
          ))}
        </div>
        <Wordmark />
      </div>
    );
  } else if (theme === "quote") {
    node = (
      <div style={base}>
        <div style={{ display: "flex", fontSize: 220, fontWeight: 700, lineHeight: 0.7, color: tone === "paper" ? pal.accent : "rgba(255,255,255,0.5)" }}>&ldquo;</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: statement.length > 90 ? 52 : 66, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1, maxWidth: w - pad * 2 }}>{statement}</div>
          {sub ? <div style={{ display: "flex", fontSize: 28, fontWeight: 700, letterSpacing: 3, color: soft, marginTop: 34, textTransform: "uppercase" }}>{sub}</div> : null}
        </div>
        <Wordmark />
      </div>
    );
  } else if (theme === "photo-hero" && imgUrl) {
    const sSize = statement.length > 60 ? 64 : statement.length > 36 ? 80 : 100;
    node = (
      <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", fontFamily: family, backgroundColor: pal.ink }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgUrl} width={w} height={h} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="" />
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", background: `linear-gradient(to top, ${rgba(pal.ink, 0.94)} 6%, ${rgba(pal.ink, 0.5)} ${tall > 1.5 ? 40 : 46}%, ${rgba(pal.ink, 0)} 74%)` }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end", width: "100%", height: "100%", padding: pad, color: "#fff" }}>
          {eyebrow ? <div style={{ display: "flex", alignSelf: "flex-start", backgroundColor: pal.accent, color: "#fff", fontSize: 22, fontWeight: 700, letterSpacing: 3, padding: "10px 20px", borderRadius: 999, marginBottom: 26 }}>{eyebrow}</div> : null}
          <div style={{ display: "flex", fontSize: sSize, fontWeight: 700, lineHeight: 1.0, letterSpacing: -2, maxWidth: w - pad * 2 }}>{statement}</div>
          {sub ? <div style={{ display: "flex", fontSize: 32, fontWeight: 500, lineHeight: 1.3, color: "rgba(255,255,255,0.9)", marginTop: 22, maxWidth: w - pad * 2 - 80 }}>{sub}</div> : null}
          <div style={{ display: "flex", marginTop: 36 }}><Wordmark /></div>
        </div>
      </div>
    );
  } else {
    const sSize = statement.length > 70 ? 66 : statement.length > 40 ? 84 : 112;
    node = (
      <div style={base}>
        <Eyebrow text={eyebrow || studio.site.name.toUpperCase()} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: sSize, fontWeight: 700, lineHeight: 1.0, letterSpacing: -2, maxWidth: w - pad * 2 }}>{statement}</div>
          {sub ? <div style={{ display: "flex", fontSize: 36, fontWeight: 500, lineHeight: 1.32, color: soft, marginTop: 30, maxWidth: w - pad * 2 - 80 }}>{sub}</div> : null}
        </div>
        <Wordmark />
      </div>
    );
  }

  return new ImageResponse(node, { width: w, height: h, fonts: fonts.length ? fonts : undefined, headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
