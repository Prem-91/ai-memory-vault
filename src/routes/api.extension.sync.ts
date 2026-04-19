import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

const SyncSchema = z.object({
  title: z.string().min(1).max(500),
  raw_content: z.string().min(1).max(200_000),
  source_platform: z.enum(["chatgpt", "claude", "gemini", "manual", "selection"]).default("manual"),
  capture_method: z.string().max(50).default("auto"),
  project_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const Route = createFileRoute("/api/extension/sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = request.headers.get("authorization");
          if (!auth?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ error: "Missing bearer token" }), {
              status: 401,
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
          }
          const token = auth.slice(7);

          const SUPABASE_URL = process.env.SUPABASE_URL!;
          const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
          const userClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          });

          const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
          if (claimsErr || !claims?.claims?.sub) {
            return new Response(JSON.stringify({ error: "Invalid token" }), {
              status: 401,
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
          }
          const userId = claims.claims.sub;

          const body = await request.json();
          const parsed = SyncSchema.parse(body);

          const { data, error } = await supabaseAdmin
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

          if (error) throw error;

          return new Response(JSON.stringify({ data }), {
            status: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Server error";
          return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
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
