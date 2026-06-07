"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SeedButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function handleSeed() {
    if (!confirm("Import all static musings and collections into the database? This only runs if the tables are currently empty.")) return;
    setState("busy");
    setMsg("");
    try {
      const res = await fetch("/api/admin/seed", { method: "POST" });
      const data = await res.json() as {
        ok?: boolean;
        seeded?: { musings: number; collections: number; photos: number };
        skipped?: { musings: boolean; collections: boolean };
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setState("error");
        setMsg(data.error ?? "Seed failed.");
        return;
      }
      const { seeded, skipped } = data;
      const parts: string[] = [];
      if (seeded?.musings) parts.push(`${seeded.musings} musings`);
      if (seeded?.collections) parts.push(`${seeded.collections} collections`);
      if (seeded?.photos) parts.push(`${seeded.photos} photos`);
      if (skipped?.musings) parts.push("musings already existed (skipped)");
      if (skipped?.collections) parts.push("collections already existed (skipped)");
      setMsg(parts.join(" · ") || "Nothing to seed.");
      setState("done");
      router.refresh();
    } catch {
      setState("error");
      setMsg("Network error.");
    }
  }

  return (
    <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--rule)" }}>
      <h2 style={{ fontSize: "13px", fontFamily: "var(--mono)", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--bone-70)", marginBottom: "10px" }}>
        Database
      </h2>
      <p style={{ fontSize: "14px", color: "var(--bone-70)", marginBottom: "16px" }}>
        The database is currently empty. Import the existing static content to start managing it here.
      </p>
      <button
        className="btn btn--gold"
        onClick={handleSeed}
        disabled={state === "busy" || state === "done"}
      >
        {state === "busy" ? "Seeding…" : state === "done" ? "Done ✓" : "Import static content into database"}
      </button>
      {msg && (
        <p style={{ marginTop: "12px", fontSize: "13px", color: state === "error" ? "#e07070" : "var(--bone-70)" }}>
          {msg}
        </p>
      )}
    </div>
  );
}
