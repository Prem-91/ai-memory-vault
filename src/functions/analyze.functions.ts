import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const AnalysisSchema = z.object({
  summary: z.string().default(""),
  key_points: z.array(z.string()).default([]),
  decisions: z.array(z.string()).default([]),
  open_questions: z.array(z.string()).default([]),
  action_items: z.array(z.string()).default([]),
  relevance_score: z.number().min(0).max(100).default(50),
});

export type MemoryAnalysis = z.infer<typeof AnalysisSchema>;

const InputSchema = z.object({
  raw_content: z.string().min(1).max(120_000),
  title_hint: z.string().max(500).optional(),
});

const PROMPT = `You are an AI conversation analyzer. Extract structured information from the provided conversation.
Return ONLY valid JSON with no markdown, no code fences, no commentary.

The JSON must match this schema:
{
  "summary": string (2-3 sentences),
  "key_points": string[] (5 most important points),
  "decisions": string[] (decisions made),
  "open_questions": string[] (unresolved questions),
  "action_items": string[] (tasks or next steps),
  "relevance_score": number (0-100, how actionable this context is)
}`;

async function callGemini(rawContent: string, apiKey: string): Promise<MemoryAnalysis> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: `${PROMPT}\n\nConversation:\n${rawContent}` }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 200)}`);
  }

  const data: unknown = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const text = (data as any)?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Gemini returned non-JSON");
    parsed = JSON.parse(match[0]);
  }
  return AnalysisSchema.parse(parsed);
}

export const analyzeMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<{ data: MemoryAnalysis | null; error: string | null }> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { data: null, error: "AI analysis not configured" };
    }

    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await callGemini(data.raw_content, apiKey);
        return { data: result, error: null };
      } catch (e) {
        lastErr = e;
        await new Promise((r) => setTimeout(r, 400 * Math.pow(2, attempt)));
      }
    }
    console.error("Gemini analysis failed after 3 attempts:", lastErr);
    return {
      data: null,
      error: "Analysis failed. Please try again.",
    };
  });
