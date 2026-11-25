import Anthropic from "@anthropic-ai/sdk";

/*
  Claude helper for the Creator page generators. SERVER ONLY.

  One call shape for every generator: a system prompt (brandSystemPrompt),
  a user message, and a JSON schema the answer must match. Adaptive
  thinking is on; effort is per call. Throws a plain Error with a
  human-readable message — routes turn that into a 502.
*/

export const MODEL = "claude-opus-5";

export function hasAnthropicKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export const AI_NOT_CONFIGURED = "AI isn't configured yet. Add ANTHROPIC_API_KEY in the Vercel project.";

export interface GenerateJsonOptions {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
  effort?: "low" | "medium" | "high";
  /** An https image the model should look at before answering. */
  imageUrl?: string;
}


/*
  Pictures go to the model as bytes, not as a link. The site's public URL may
  not be where the app is served from (a custom domain still on an old host,
  a preview deploy, localhost), and the model's own fetch then fails with
  "Unable to download the file". We fetch the picture here, where the host
  is reachable, and fall back to the URL only if that fetch fails.
*/
async function imageBlock(url: string): Promise<Anthropic.ImageBlockParam> {
  try {
    const r = await fetch(url, { cache: "no-store" });
    const ct = (r.headers.get("content-type") || "").split(";")[0].trim();
    const ok = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
    const mt = ok.find((m) => m === ct);
    if (r.ok && mt) {
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length > 0 && buf.length < 20 * 1024 * 1024) {
        return { type: "image", source: { type: "base64", media_type: mt, data: buf.toString("base64") } };
      }
    }
  } catch {
    /* fall through to the URL */
  }
  return { type: "image", source: { type: "url", url } };
}

export async function generateJson<T>(opts: GenerateJsonOptions): Promise<T> {
  if (!hasAnthropicKey()) throw new Error(AI_NOT_CONFIGURED);
  const client = new Anthropic();
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 4000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: opts.effort ?? "low",
      format: { type: "json_schema", schema: opts.schema },
    },
    system: opts.system,
    messages: [
      {
        role: "user",
        content: opts.imageUrl
          ? [await imageBlock(opts.imageUrl), { type: "text", text: opts.user }]
          : opts.user,
      },
    ],
  });
  if (res.stop_reason === "max_tokens") throw new Error("The model ran out of room — try again.");
  if (res.stop_reason === "refusal") throw new Error("The model declined this request.");
  const block = res.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!block) throw new Error("No answer came back — try again.");
  try {
    return JSON.parse(block.text) as T;
  } catch {
    throw new Error("The answer wasn't valid JSON — try again.");
  }
}

/** A short, safe message for the UI from any thrown value. */
export function aiErrorMessage(e: unknown, fallback = "Generation failed. Try again."): string {
  if (e instanceof Anthropic.AuthenticationError) return "The Anthropic API key was rejected.";
  if (e instanceof Anthropic.RateLimitError) return "Rate limited by the model — wait a moment and try again.";
  if (e instanceof Anthropic.APIError) return `Model error (${e.status ?? "?"})${e.message ? `: ${e.message.slice(0, 160)}` : ""} — try again.`;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}
