import { redirect } from "next/navigation";

// Keywords now live inside Search.
export default function KeywordsPage() {
  redirect("/creator/search?open=keywords");
}
