import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

// Fast, low-cost captions from an uploaded photo. Optional feature:
// with no ANTHROPIC_API_KEY set, this returns 503 and the UI degrades
// gracefully (the AI-assist button just surfaces a "not configured" note).
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

  let body: { imageUrl?: string; title?: string; loc?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { imageUrl, title, loc } = body;
  if (!imageUrl) {
    return NextResponse.json({ error: "Add a photo first." }, { status: 400 });
  }

  const context = [
    title?.trim() && `Working title: ${title.trim()}`,
    loc?.trim() && `Location: ${loc.trim()}`,
  ]
    .filter(Boolean)
    .join(". ");

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "url", url: imageUrl } },
            {
              type: "text",
              text:
                "You write short gallery captions for Robert Castellino, a fine-art, large-format nature photographer. " +
                "Look at this photograph and write ONE to TWO evocative but grounded sentences suitable as a caption on his portfolio. " +
                "Be specific to what is actually visible — light, land, weather, place. Avoid clichés, hyperbole, and hashtags. " +
                (context ? `Context: ${context}. ` : "") +
                "Return only the caption text, with no quotes, label, or preamble.",
            },
          ],
        },
      ],
    });

    const caption = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .trim();

    return NextResponse.json({ caption });
  } catch {
    return NextResponse.json({ error: "AI assist request failed. Try again." }, { status: 502 });
  }
}
