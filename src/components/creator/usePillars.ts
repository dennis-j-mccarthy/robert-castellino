"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/creator/client";
import type { Pillar } from "@/lib/creator/pillars";

/** The active pillars, from GET /api/creator/pillars (seeded defaults without a DB). */
export function usePillars(initial: Pillar[] = []) {
  const [pillars, setPillars] = useState<Pillar[]>(initial);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (initial.length) return;
    let alive = true;
    api<{ pillars: Pillar[] }>("/api/creator/pillars")
      .then((d) => alive && setPillars(d.pillars))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [initial.length]);
  return { pillars, error };
}
