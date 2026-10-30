"use client";

import type { ReactNode } from "react";

/** A plain thumbnail for arbitrary (often external) URLs, with an empty-state fallback. */
export default function Thumb({
  src,
  alt = "",
  className = "ads-table__thumb",
  empty,
}: {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  empty?: ReactNode;
}) {
  if (!src) return <>{empty ?? <div className="ads-table__thumb cr-thumb--empty" />}</>;
  // eslint-disable-next-line @next/next/no-img-element -- arbitrary library / Meta URLs, not optimizable
  return <img className={className} src={src} alt={alt} />;
}
