import type { Metadata } from "next";
import { getAllMusings } from "@/lib/data-source";
import MusingsClient from "./MusingsClient";

// Each page names itself as canonical (the root layout no longer points every page at "/").
export const metadata: Metadata = { alternates: { canonical: "/musings" } };


export const dynamic = "force-dynamic";

export default async function MusingsPage() {
  const musings = await getAllMusings();
  return <MusingsClient musings={musings} />;
}
