"use client";

import type { ReactNode } from "react";
import TwoAccordion from "@/components/creator/TwoAccordion";

// Posts: ① Make a post (open on arrival) ② My posts.
export default function PostsAccordion({ make, posts, postCount }: { make: ReactNode; posts: ReactNode; postCount: number }) {
  return (
    <TwoAccordion panels={[
      { id: "make", n: 1, title: "Make a post", sub: "where · picture · what it's about", body: make },
      { id: "posts", n: 2, title: "My posts", sub: `${postCount} on the Page · published, scheduled, drafts`, body: posts },
    ]} />
  );
}
