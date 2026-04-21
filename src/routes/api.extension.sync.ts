import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

const SyncSchema = z.object({
  title: z.string().min(1).max(500),
  raw_content: z.string().min(1).max(200_000),
  source_platform: z
    .enum([
      "chatgpt",
      "claude",
      "gemini",
      "perplexity",
      "copilot",
      "mistral",
      "deepseek",
      "grok",
      "poe",
      "you",
      "phind",
      "huggingface",
      "manual",
      "selection",
    ])
    .default("manual"),
  capture_method: z.string().max(50).default("auto"),
  project_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export const Route = createFileRoute("/api/extension/sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const SUPABASE_URL = process.env.EXTERNAL_SUPABASE_URL;
          const SUPABASE_PUBLISHABLE_KEY = process.env.EXTERNAL_SUPABASE_PUBLISHABLE_KEY;
          const SUPABASE_SERVICE_ROLE_KEY = process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY;

          if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
            return new Response(
              JSON.stringify({ error: "Server not configured (missing EXTERNAL Supabase secrets)" }),
              { status: 500, headers: CORS },
            );
          }

          const auth = request.headers.get("authorization");
          if (!auth?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ error: "Missing bearer token" }), {
              status: 401,
              headers: CORS,
            });
          }
          const token = auth.slice(7);

          const userClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          });

          const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
          if (claimsErr || !claims?.claims?.sub) {
            return new Response(JSON.stringify({ error: "Invalid token" }), {
              status: 401,
              headers: CORS,
            });
          }
          const userId = claims.claims.sub;

          let body: unknown;
          try {
            body = await request.json();
          } catch {
            return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
              status: 400,
              headers: CORS,
            });
          }

          const parseResult = SyncSchema.safeParse(body);
          if (!parseResult.success) {
            return new Response(JSON.stringify({ error: "Invalid request payload" }), {
              status: 400,
              headers: CORS,
            });
          }
          const parsed = parseResult.data;

          const adminClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false },
          });

          const { data, error } = await adminClient
            .from("memories")
            .insert({
              user_id: userId,
              title: parsed.title,
              raw_content: parsed.raw_content,
              source_platform: parsed.source_platform,
              capture_method: parsed.capture_method,
              project_id: parsed.project_id ?? null,
              tags: parsed.tags ?? [],
            })
            .select()
            .single();

          if (error) {
            console.error("[extension/sync] insert failed:", error);
            return new Response(JSON.stringify({ error: "Failed to save memory" }), {
              status: 500,
              headers: CORS,
            });
          }

          return new Response(JSON.stringify({ data }), { status: 200, headers: CORS });
        } catch (e) {
          console.error("[extension/sync] unexpected error:", e);
          return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: CORS });
        }
      },
      OPTIONS: async () => {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      },
    },
  },
});
