import { redirect } from "next/navigation";

// Competitors now live inside Search.
export default function CompetitorsPage() {
  redirect("/creator/search?open=competitors");
}
