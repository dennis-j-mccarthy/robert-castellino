/*
  The tone brief for the blog generator (/creator/blog), the caption writer
  and the newsletter. Stored as JSON on the BlogSettings singleton
  (src/lib/creator/tone-store.ts). Client-safe: pure data helpers.
*/

export interface BlogTone {
  voice: string; // how it should sound
  audience: string; // who it's for
  style: string; // length / structure / formatting notes
  dos: string; // things to lean into
  donts: string; // things to avoid
}

const CAP = 1200;

export const EMPTY_TONE: BlogTone = { voice: "", audience: "", style: "", dos: "", donts: "" };

/** Normalise a tone object off the wire: coerce to strings, trim, clamp. */
export function cleanTone(input: unknown): BlogTone {
  const t = (input ?? {}) as Partial<Record<keyof BlogTone, unknown>>;
  const field = (v: unknown) => String(v ?? "").trim().slice(0, CAP);
  return {
    voice: field(t.voice),
    audience: field(t.audience),
    style: field(t.style),
    dos: field(t.dos),
    donts: field(t.donts),
  };
}

/** Render the tone as a labelled block for the system prompt. */
export function tonePrompt(tone: BlogTone): string {
  const lines: string[] = [];
  if (tone.voice) lines.push(`VOICE: ${tone.voice}`);
  if (tone.audience) lines.push(`AUDIENCE: ${tone.audience}`);
  if (tone.style) lines.push(`STYLE: ${tone.style}`);
  if (tone.dos) lines.push(`DO: ${tone.dos}`);
  if (tone.donts) lines.push(`DON'T: ${tone.donts}`);
  return lines.length
    ? lines.join("\n")
    : "(no specific tone set — unhurried, observational, first person, grounded in place)";
}
