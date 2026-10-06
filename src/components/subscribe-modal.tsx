"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// Reusable email-capture modal.
//   - auto-arms on public pages: opens after a timer OR on desktop exit-intent,
//     whichever comes first, once per browser session.
//   - never auto-opens for a visitor who dismissed or subscribed within the
//     suppress window; that choice persists in localStorage across reloads.
//   - also opens on demand when anything dispatches `rc-open-subscribe`
//     (e.g. the "Get the letter" CTA on /musings).

const TIMER_MS = 20_000;
const SESSION_KEY = "rc_sub_shown"; // once per tab session (auto-open only)
const SUPPRESS_KEY = "rc_sub_v1"; // { state: "dismissed" | "subscribed", ts }
const SUPPRESS_DAYS = { dismissed: 14, subscribed: 365 } as const;
const OPEN_EVENT = "rc-open-subscribe";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isSuppressed(): boolean {
  try {
    const raw = localStorage.getItem(SUPPRESS_KEY);
    if (!raw) return false;
    const { state, ts } = JSON.parse(raw) as { state: keyof typeof SUPPRESS_DAYS; ts: number };
    const days = SUPPRESS_DAYS[state] ?? 14;
    return Date.now() - ts < days * 86_400_000;
  } catch {
    return false;
  }
}

function remember(state: keyof typeof SUPPRESS_DAYS) {
  try {
    localStorage.setItem(SUPPRESS_KEY, JSON.stringify({ state, ts: Date.now() }));
  } catch {
    /* private mode — fine */
  }
}

export function SubscribeModal() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isAdmin = pathname?.startsWith("/admin") ?? false;

  const openModal = useCallback((auto: boolean) => {
    if (auto) {
      try {
        if (sessionStorage.getItem(SESSION_KEY)) return;
      } catch {
        /* ignore */
      }
    }
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(true);
  }, []);

  // On-demand open (CTA) — always allowed, even if suppressed.
  useEffect(() => {
    const onEvent = () => openModal(false);
    window.addEventListener(OPEN_EVENT, onEvent);
    return () => window.removeEventListener(OPEN_EVENT, onEvent);
  }, [openModal]);

  // Auto-arm: timer + desktop exit-intent, unless suppressed or on /admin.
  useEffect(() => {
    if (isAdmin) return;
    let armed = true;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) armed = false;
    } catch {
      /* ignore */
    }
    if (!armed || isSuppressed()) return;

    const timer = window.setTimeout(() => openModal(true), TIMER_MS);
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) openModal(true);
    };
    document.addEventListener("mouseout", onLeave);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mouseout", onLeave);
    };
  }, [isAdmin, openModal]);

  // Focus the field + wire Esc when open.
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function dismiss() {
    remember("dismissed");
    setOpen(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setStatus("error");
      setMsg("Please enter a valid email address.");
      return;
    }
    setStatus("sending");
    setMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: value, source: "popup" }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Something went wrong — please try again.");
      }
      remember("subscribed");
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Something went wrong — please try again.");
    }
  }

  if (isAdmin || !open) return null;

  return (
    <div className="submodal" role="presentation" onMouseDown={dismiss}>
      <div
        className="submodal__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="submodal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button type="button" className="submodal__close" aria-label="Close" onClick={dismiss}>
          <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
            <path d="M2 2l10 10M12 2L2 12" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>

        {status === "done" ? (
          <div className="submodal__done">
            <span className="kicker kicker--gold">— You&apos;re on the list</span>
            <h3 className="display" id="submodal-title">Thank you.</h3>
            <p>Look for the next letter from the Boulder studio. You can close this now.</p>
            <button type="button" className="btn btn--gold" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        ) : (
          <>
            <span className="kicker kicker--gold">— From the Boulder studio</span>
            <h3 className="display" id="submodal-title">Give the gift of Colorado.</h3>
            <p className="submodal__lede">
              A quiet quarterly letter — new field notes, the occasional plate, and
              first word on prints and the book. No noise.
            </p>
            <form className="submodal__form" onSubmit={submit} noValidate>
              <input
                ref={inputRef}
                type="email"
                inputMode="email"
                autoComplete="email"
                className="submodal__input"
                placeholder="you@email.com"
                aria-label="Email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
              />
              <button type="submit" className="btn btn--gold" disabled={status === "sending"}>
                {status === "sending" ? "Joining…" : "Get the letter"}
              </button>
            </form>
            {status === "error" && <p className="submodal__err" role="alert">{msg}</p>}
            <button type="button" className="submodal__skip" onClick={dismiss}>
              No thanks
            </button>
          </>
        )}
      </div>
    </div>
  );
}
