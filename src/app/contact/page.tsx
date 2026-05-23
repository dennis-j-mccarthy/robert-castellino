"use client";

import { useState } from "react";
import { PageHero } from "@/components/page-hero";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // No backend wired yet — just acknowledge the submission.
    setSent(true);
  }

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

            <button type="submit" className="btn btn--gold btn--lg contact__submit">
              Send the note
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
