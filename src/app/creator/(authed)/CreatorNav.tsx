"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: Array<[string, string]> = [
  ["/creator/essence", "Essence"],
  ["/creator/blog", "Blog"],
  ["/creator/library", "Library"],
  ["/creator/social", "Social"],
  ["/creator/ads", "Paid social"],
  ["/creator/email", "Email"],
];

export default function CreatorNav() {
  const path = usePathname() ?? "";
  return (
    <>
      {LINKS.map(([href, label]) => (
        <Link key={href} href={href} className={path.startsWith(href) ? "is-active" : undefined}>
          {label}
        </Link>
      ))}
    </>
  );
}
