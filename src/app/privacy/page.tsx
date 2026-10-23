import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — Robert Castellino Photography",
  description:
    "How Robert Castellino Photography, LLC handles the information you share with us.",
};

// Plain-language privacy policy. Also serves as the privacy-policy and
// data-deletion URL for the studio's Meta (Facebook/Instagram) app.
export default function PrivacyPage() {
  return (
    <section className="route route--privacy">
      <div className="page-head">
        <span className="page-head__index">Privacy</span>
        <h1 className="page-head__title">Privacy policy</h1>
        <p className="page-head__lede">Last updated October 23, 2026</p>
      </div>

      <article className="bio__body" style={{ maxWidth: "68ch", margin: "0 auto", padding: "0 1rem 4rem" }}>
        <h2>Who we are</h2>
        <p>
          Robert Castellino Photography, LLC (&ldquo;we&rdquo;, &ldquo;the
          studio&rdquo;) operates robertcastellino.com and the studio&rsquo;s
          Facebook and Instagram presence. Questions about this policy go to{" "}
          <a href="mailto:studio@robertcastellino.com">studio@robertcastellino.com</a>.
        </p>

        <h2>What we collect</h2>
        <p>
          <strong>Contact form.</strong> Your name, email address and message,
          used only to reply to you.
        </p>
        <p>
          <strong>Orders.</strong> When you buy a book or print we receive your
          name, shipping address, email and order details. Card payments are
          handled by our payment processor; we never see or store your full
          card number.
        </p>
        <p>
          <strong>Site analytics.</strong> Standard, aggregated visit data
          (pages viewed, device type, approximate region) to understand how the
          site is used.
        </p>
        <p>
          <strong>Facebook and Instagram.</strong> The studio&rsquo;s publishing
          tools post to our own Page and run our own ads through Meta&rsquo;s
          API. They do not collect, store or access personal data of people who
          view, like or comment on those posts beyond what Meta shows every Page
          owner.
        </p>

        <h2>How we use it</h2>
        <p>
          To answer your messages, fulfil and support orders, and improve the
          site. We do not sell or rent personal information. We share it only
          with the services needed to do those things (payment, shipping,
          email delivery) and when the law requires.
        </p>

        <h2>Cookies</h2>
        <p>
          The site uses the minimum cookies needed for checkout and analytics.
          You can block cookies in your browser; checkout may not work without
          them.
        </p>

        <h2>Keeping and deleting your data</h2>
        <p>
          Order records are kept as long as tax and accounting rules require.
          Contact messages are kept until the conversation is finished. To see,
          correct or delete the information we hold about you, email{" "}
          <a href="mailto:studio@robertcastellino.com">studio@robertcastellino.com</a>{" "}
          with the subject line &ldquo;Data request&rdquo; and we will act on it
          within 30 days.
        </p>

        <h2>Changes</h2>
        <p>
          If this policy changes we will update the date at the top of this
          page.
        </p>
      </article>
    </section>
  );
}
