import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

// AI assist for the blog (musings). Two modes:
//   expand → turn rough notes into finished paragraphs (Bob's voice)
//   meta   → suggest a short excerpt (and title) from the body
// With no ANTHROPIC_API_KEY set this returns 503 and the UI degrades gracefully.
const SYSTEM =
  "You help Robert Castellino write short first-person 'musings' for his fine-art nature photography site. " +
  "Robert is a large-format landscape photographer of fifty years — the Colorado Rockies, wild light, land, water, sky. " +
  "Voice: unhurried, observational, quietly literary, grounded in place and craft. No hype, no hashtags, no emoji.";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI assist isn't configured yet. Add ANTHROPIC_API_KEY in the Vercel project." },
      { status: 503 },
    );
  }

  let b: { mode?: string; notes?: string; body?: string; title?: string; loc?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const client = new Anthropic();
  const mode = b.mode || "expand";
  const ctx = [b.title?.trim() && `Title: ${b.title.trim()}`, b.loc?.trim() && `Location: ${b.loc.trim()}`]
    .filter(Boolean)
    .join(". ");

  try {
    if (mode === "meta") {
      const source = (b.body || "").trim();
      if (!source) return NextResponse.json({ error: "Write the musing first." }, { status: 400 });
      const msg = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 220,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content:
              "From the musing below, propose a short evocative title (max ~8 words) and a one- or two-sentence excerpt (max ~200 chars) for the listing. " +
              "Return EXACTLY two lines:\nTITLE: <title>\nEXCERPT: <excerpt>\n\nMusing:\n" +
              source,
          },
        ],
      });
      const text = msg.content.filter((x): x is Anthropic.TextBlock => x.type === "text").map((x) => x.text).join("\n");
      const title = (text.match(/TITLE:\s*(.+)/i)?.[1] || "").trim();
      const excerpt = (text.match(/EXCERPT:\s*([\s\S]+)/i)?.[1] || "").trim();
      return NextResponse.json({ title, excerpt });
    }

    const notes = (b.notes || "").trim();
    if (!notes) return NextResponse.json({ error: "Type a few notes first." }, { status: 400 });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1100,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content:
            (ctx ? ctx + ".\n\n" : "") +
            "Expand these rough notes into a finished musing of roughly 150–400 words. " +
            "Plain prose in Robert's voice; separate paragraphs with a blank line. " +
            "Return only the musing text — no title, no preamble.\n\nNotes:\n" +
            notes,
        },
      ],
    });
    const draft = msg.content.filter((x): x is Anthropic.TextBlock => x.type === "text").map((x) => x.text).join("\n").trim();
    return NextResponse.json({ text: draft });
  } catch {
    return NextResponse.json({ error: "AI assist request failed. Try again." }, { status: 502 });
  }
}
