"use client";

import { useState } from "react";
import { PageHero } from "@/components/page-hero";

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      firstName: String(fd.get("firstName") ?? "").trim(),
      lastName: String(fd.get("lastName") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      message: String(fd.get("message") ?? "").trim(),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setErrorMsg(data?.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("sent");
      form.reset();
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  const sent = status === "sent";
  const sending = status === "sending";

  return (
    <section className="route route--contact">
      <PageHero
        img="/assets/pawnee-buttes.jpg"
        alt="Pawnee Buttes, storm break"
        index="07 — Contact"
        title={<>Get in <em>touch.</em></>}
        sub={
          <>
            Commissions, prints, and licensing inquiries welcome. Robert reads
            every note that comes through and replies as the work allows.
          </>
        }
      />

      <div className="contact">
        {sent ? (
          <div className="contact__thanks">
            <span className="kicker kicker--gold">— Note received</span>
            <h2 className="display">Thank you.</h2>
            <p>
              Your message has been sent. Robert will be in touch as the work
              allows — usually within a few days.
            </p>
          </div>
        ) : (
          <form className="contact__form" onSubmit={onSubmit} noValidate>
            <div className="contact__row">
              <label className="contact__field">
                <span className="contact__label">First name</span>
                <input
                  type="text"
                  name="firstName"
                  autoComplete="given-name"
                  required
                />
              </label>
              <label className="contact__field">
                <span className="contact__label">Last name</span>
                <input
                  type="text"
                  name="lastName"
                  autoComplete="family-name"
                  required
                />
              </label>
            </div>

            <label className="contact__field">
              <span className="contact__label">Email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
              />
            </label>

            <label className="contact__field">
              <span className="contact__label">Message</span>
              <textarea
                name="message"
                rows={7}
                required
              />
            </label>

            {errorMsg && (
              <p className="contact__error" role="alert">{errorMsg}</p>
            )}
            <button
              type="submit"
              className="btn btn--gold btn--lg contact__submit"
              disabled={sending}
              aria-busy={sending}
            >
              {sending ? "Sending…" : "Send the note"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
