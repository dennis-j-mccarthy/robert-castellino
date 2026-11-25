import Link from "next/link";
import { panels } from "@/studio.panels";

export const dynamic = "force-dynamic";

// Tool 5 · Email. One note to one person or a few. The newsletter lives on Blog.
// The sending side isn't wired yet; this page holds the place and explains it.
export default function EmailPage() {
  if (panels.replace?.email) return <>{panels.replace.email}</>;
  return (
    <section className="admin-page cr-page">
      <div className="tl-eyebrow">Email</div>
      <h1>Email</h1>
      <p>A note to one person or a short list, in your voice, from one line of yours. The newsletter is made on the <Link href="/creator/blog">Blog</Link> page: star the posts, press Make newsletter.</p>
      <div className="cr-soon">
        <b>A note is not switched on yet.</b>
        <p>What it will do: pick who (a name, or a group such as &ldquo;bought this week&rdquo; from the site, or a Leads group), say what in one line, read the note the studio writes, fix anything, send or schedule. Sent through the studio&rsquo;s own address, with replies going to you. Until then, use your mail app.</p>
      </div>
    </section>
  );
}
