import Link from "next/link";
import { loadLibrary } from "@/lib/creator/library";
import { loadPillars } from "@/lib/creator/pillar-store";
import { MUSING_PILLARS } from "@/lib/creator/seed-data";
import BlogPosts from "./BlogPosts";

export const dynamic = "force-dynamic";

// Content → Blogs: every Musing (drafts and live), edit, publish /
// unpublish, delete, hand off to the Post maker or the newsletter.
export default async function BlogPostsPage() {
  const [pillars, library] = await Promise.all([loadPillars(), loadLibrary()]);
  return (
    <section className="admin-page cr-page">
      <div className="cr-pagehead">
        <h1>Musings</h1>
        <Link className="btn btn--gold ads-btn-sm" href="/creator/blog">+ New Musing</Link>
      </div>
      <p>The same rows /admin/musings manages, seen from the Creator page.</p>
      <BlogPosts pillars={pillars} library={library.items.filter((i) => !i.mockup)} musingPillars={MUSING_PILLARS} />
    </section>
  );
}
