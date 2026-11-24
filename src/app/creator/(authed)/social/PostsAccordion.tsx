"use client";

import type { ReactNode } from "react";
import { Accordion } from "@/components/creator/TwoAccordion";

// Posts: ① Instant post ② Make a post ③ My posts. All closed on arrival.
export default function PostsAccordion({ instant, make, posts, postCount }: { instant: ReactNode; make: ReactNode; posts: ReactNode; postCount: number }) {
  return (
    <Accordion panels={[
      { id: "instant", n: 1, title: "Instant post", sub: "a photo from your phone or desktop · three bullets · the studio builds it", body: instant },
      { id: "make", n: 2, title: "Make a post", sub: "where · picture from the Brand kit · what it's about", body: make },
      { id: "posts", n: 3, title: "My posts", sub: `${postCount} on the Page · published, scheduled, drafts`, body: posts },
    ]} />
  );
}

