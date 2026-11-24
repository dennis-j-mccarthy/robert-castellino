import Link from "next/link";
import EmailTabs from "@/components/creator/EmailTabs";

export const dynamic = "force-dynamic";

// Tool 5 · Email. One note to one person or a few. Not the newsletter (tool 6).
// The sending side isn't wired yet; this page holds the place and explains it.
export default function EmailPage() {
  return (
    <section className="admin-page cr-page">
      <div className="tl-eyebrow">5 · Email</div>
      <h1>Email</h1>
      <p>Two kinds of email, one place. <b>A note</b> is one person or a short list, in your voice, from one line of yours. <b>Newsletter</b> is the issue that goes to everyone, built by dragging in your Musings.</p>
      <EmailTabs />
      <div className="cr-soon">
        <b>A note is not switched on yet.</b>
        <p>What it will do: pick who (a name, or a group such as &ldquo;bought the book this week&rdquo; from the site, or a Leads group), say what in one line, read the note the studio writes, fix anything, send or schedule. Sent through the studio&rsquo;s own address, with replies going to Bob. Until then, the <Link href="/creator/newsletter">Newsletter</Link> tab works today.</p>
      </div>
    </section>
  );
}
