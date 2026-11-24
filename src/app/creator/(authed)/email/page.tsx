import Link from "next/link";

export const dynamic = "force-dynamic";

// Tool 5 · Email. One note to one person or a few. Not the newsletter (tool 6).
// The sending side isn't wired yet; this page holds the place and explains it.
export default function EmailPage() {
  return (
    <section className="admin-page cr-page">
      <div className="tl-eyebrow">5 · Email · coming</div>
      <h1>Write a note</h1>
      <p>One person or a short list, in your voice, from one line of yours. This is the personal note: the collector who asked about a print, the three people who bought the book this week. The issue that goes to everyone is <Link href="/creator/newsletter">tool 6, Newsletter</Link>.</p>
      <div className="cr-soon">
        <b>Not switched on yet.</b>
        <p>What it will do: pick who (a name, or a group such as &ldquo;bought the book this week&rdquo; from the site, or a Leads group), say what in one line, read the note the studio writes, fix anything, send or schedule. Sent through the studio&rsquo;s own address, with replies going to Bob.</p>
      </div>
    </section>
  );
}
