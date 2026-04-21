// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Inject EXTERNAL_SUPABASE_* secrets as VITE-style build-time constants so the
// browser bundle can reach the user's own Supabase project (not Lovable Cloud).
const externalUrl = process.env.EXTERNAL_SUPABASE_URL ?? "";
const externalKey = process.env.EXTERNAL_SUPABASE_PUBLISHABLE_KEY ?? "";

export default defineConfig({
  vite: {
    define: {
      "import.meta.env.VITE_EXTERNAL_SUPABASE_URL": JSON.stringify(externalUrl),
      "import.meta.env.VITE_EXTERNAL_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(externalKey),
    },
  },
});
