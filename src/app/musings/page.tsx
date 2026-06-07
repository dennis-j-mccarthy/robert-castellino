import { getAllMusings } from "@/lib/data-source";
import MusingsClient from "./MusingsClient";

export const dynamic = "force-dynamic";

export default async function MusingsPage() {
  const musings = await getAllMusings();
  return <MusingsClient musings={musings} />;
}
