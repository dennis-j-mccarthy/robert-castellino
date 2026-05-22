"use client";

import { usePathname } from "next/navigation";

const MAP: Record<string, { idx: string; name: string }> = {
  "/": { idx: "01", name: "Home" },
  "/gallery": { idx: "02", name: "Gallery" },
  "/about": { idx: "03", name: "About" },
  "/book": { idx: "04", name: "The Book" },
  "/musings": { idx: "05", name: "Musings" },
};

export function Ticker() {
  const pathname = usePathname();
  let entry = MAP[pathname];
  if (!entry) {
    if (pathname.startsWith("/musings/")) entry = { idx: "06", name: "Field Note" };
    else entry = { idx: "01", name: "Home" };
  }
  return (
    <div className="ticker" aria-hidden="true">
      <span className="ticker__idx">{entry.idx}</span>
      <span className="ticker__name">{entry.name}</span>
    </div>
  );
}
