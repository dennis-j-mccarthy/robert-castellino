"use client";

import { useEffect, useState } from "react";

interface Props {
  configured: boolean;
  connected: boolean;
  page: string | null;
  instagram: string | null;
  fbUser: string | null;
  tokenExpiresAt: string | null;
}

const card: React.CSSProperties = {
  border: "1px solid var(--rule, #2a2a2a)",
  borderRadius: 10,
  padding: "18px 20px",
  marginTop: 20,
};
const label: React.CSSProperties = {
  fontSize: 12,
  fontFamily: "var(--mono, monospace)",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--bone-70, #999)",
  marginBottom: 8,
  display: "block",
};
const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--rule, #2a2a2a)",
  background: "transparent",
  color: "inherit",
  font: "inherit",
};

const ERRORS: Record<string, string> = {
  not_configured: "The Meta app isn't set up yet (missing App ID/Secret).",
  declined: "Facebook authorization was declined.",
  no_code: "Facebook didn't return an authorization code.",
  bad_state: "Security check failed — please try connecting again.",
  no_pages: "That Facebook account doesn't manage any Pages.",
  connect_failed: "Couldn't complete the connection.",
};

export default function SocialClient(props: Props) {
  const [connected, setConnected] = useState(props.connected);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // composer
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<
    | { ok: true; id: string; scheduled: boolean; scheduledAt: string | null; page: string }
    | { ok: false; error: string }
    | null
  >(null);

  // Surface ?connected / ?error from the OAuth round-trip, then clean the URL.
  // This is a one-time sync from an external source (the redirect URL) into
  // UI state on mount — exactly what an effect is for here.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const connectedFlag = q.get("connected") === "1";
    const code = q.get("error");
    if (!connectedFlag && !code) return;
    const detail = q.get("detail");
    const next: { connectedToTrue: boolean; notice: typeof notice } = connectedFlag
      ? { connectedToTrue: true, notice: { kind: "ok", text: "Facebook connected." } }
      : {
          connectedToTrue: false,
          notice: {
            kind: "err",
            text: (ERRORS[code!] || "Connection error.") + (detail ? ` (${detail})` : ""),
          },
        };
    /* eslint-disable react-hooks/set-state-in-effect -- one-time URL→state sync on mount */
    if (next.connectedToTrue) setConnected(true);
    setNotice(next.notice);
    /* eslint-enable react-hooks/set-state-in-effect */
    window.history.replaceState({}, "", "/admin/social");
  }, []);

  async function disconnect() {
    await fetch("/api/admin/meta/disconnect", { method: "POST" });
    setConnected(false);
    setNotice({ kind: "ok", text: "Disconnected." });
  }

  async function submit(schedule: boolean) {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/facebook/post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          caption,
          imageUrl: imageUrl.trim() || undefined,
          scheduledAt: schedule ? scheduledAt : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) setResult({ ok: false, error: data.error || "Failed." });
      else setResult({ ok: true, ...data });
    } catch (e: unknown) {
      setResult({ ok: false, error: e instanceof Error ? e.message : "Network error." });
    } finally {
      setBusy(false);
    }
  }

  if (!props.configured) {
    return (
      <div style={{ ...card, borderColor: "#b9871f" }}>
        <strong>Meta app not set up yet.</strong>
        <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
          Add <code>META_APP_ID</code> and <code>META_APP_SECRET</code> from your
          Meta app (developers.facebook.com) to the environment, then reload.
          See <code>docs/META_SETUP.md</code> for the step-by-step.
        </p>
      </div>
    );
  }

  return (
    <>
      {notice && (
        <div
          style={{
            ...card,
            borderColor: notice.kind === "ok" ? "#4a7" : "#e07070",
            color: notice.kind === "ok" ? "inherit" : "#e07070",
          }}
        >
          {notice.text}
        </div>
      )}

      {/* Connection */}
      <div style={card}>
        <span style={label}>Connection</span>
        {connected ? (
          <>
            <div style={{ fontSize: 15 }}>
              Connected to <strong>{props.page}</strong>
              {props.instagram ? ` · IG @${props.instagram}` : ""}
            </div>
            {props.fbUser && (
              <div style={{ fontSize: 13, color: "var(--bone-70,#999)", marginTop: 4 }}>
                Authorized by {props.fbUser}
                {props.tokenExpiresAt
                  ? ` · token renews before ${new Date(props.tokenExpiresAt).toLocaleDateString()}`
                  : ""}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <a className="btn btn--ghost" href="/api/admin/meta/connect">Reconnect</a>
              <button className="btn btn--ghost" onClick={disconnect}>Disconnect</button>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, marginBottom: 14 }}>
              Not connected. Authorize once with Bob&rsquo;s Facebook to let the
              app publish to his Page.
            </p>
            <a className="btn btn--gold" href="/api/admin/meta/connect">
              Connect Facebook
            </a>
          </>
        )}
      </div>

      {/* Composer */}
      <div style={{ ...card, opacity: connected ? 1 : 0.55 }}>
        <span style={label}>New post</span>
        <textarea
          style={{ ...input, minHeight: 110, resize: "vertical" }}
          placeholder="Write the caption…"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          disabled={!connected || busy}
        />
        <div style={{ marginTop: 12 }}>
          <span style={label}>Image URL (optional — must be public)</span>
          <input
            style={input}
            placeholder="https://robertcastellino.com/assets/…jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            disabled={!connected || busy}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <span style={label}>Schedule (optional — leave blank to post now)</span>
          <input
            style={{ ...input, maxWidth: 260 }}
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            disabled={!connected || busy}
          />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            className="btn btn--gold"
            onClick={() => submit(false)}
            disabled={!connected || busy || !caption.trim()}
          >
            {busy ? "Working…" : "Publish now"}
          </button>
          <button
            className="btn btn--ghost"
            onClick={() => submit(true)}
            disabled={!connected || busy || !caption.trim() || !scheduledAt}
          >
            Schedule
          </button>
        </div>

        {result && result.ok && (
          <div style={{ ...card, borderColor: "#4a7", marginTop: 16 }}>
            {result.scheduled ? "Scheduled" : "Published"} to{" "}
            <strong>{result.page}</strong>. Post id{" "}
            <code>{result.id}</code>
            {result.scheduledAt
              ? ` · ${new Date(result.scheduledAt).toLocaleString()}`
              : ""}
            .
          </div>
        )}
        {result && !result.ok && (
          <div style={{ ...card, borderColor: "#e07070", color: "#e07070", marginTop: 16 }}>
            {result.error}
          </div>
        )}
      </div>
    </>
  );
}
