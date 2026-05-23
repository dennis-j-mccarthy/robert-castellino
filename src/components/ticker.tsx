"use client";

import { usePathname } from "next/navigation";

const MAP: Record<string, { idx: string; name: string }> = {
  "/": { idx: "01", name: "Home" },
  "/about": { idx: "02", name: "About" },
  "/timeline": { idx: "03", name: "Timeline" },
  "/gallery": { idx: "04", name: "Gallery" },
  "/book": { idx: "05", name: "The Book" },
  "/musings": { idx: "06", name: "Musings" },
  "/contact": { idx: "07", name: "Contact" },
};

export function Ticker() {
  const pathname = usePathname();
  // Hide on /gallery — the pinned print-availability bar lives there
  if (pathname === "/gallery") return null;
  let entry = MAP[pathname];
  if (!entry) {
    if (pathname.startsWith("/musings/")) entry = { idx: "08", name: "Field Note" };
    else entry = { idx: "01", name: "Home" };
  }
  return (
    <div className="ticker" aria-hidden="true">
      <span className="ticker__idx">{entry.idx}</span>
      <span className="ticker__name">{entry.name}</span>
    </div>
  );
}
