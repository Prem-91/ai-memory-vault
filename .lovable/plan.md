
# AI Context Bridge — Full Build Plan

A dark-themed SaaS dashboard that captures, organizes, and injects AI-conversation context across ChatGPT, Claude, and Gemini. Adapted to the Lovable stack (TanStack Start + Lovable Cloud) — same features, native primitives.

## Stack adaptation (your spec → Lovable)
- **Routing**: TanStack Start file routes in `src/routes/` (not Next.js App Router)
- **Backend**: Lovable Cloud (Supabase) — Auth, Postgres + RLS, Realtime, Storage
- **Server logic**: TanStack `createServerFn` instead of `/api/*` route handlers (same RPC behavior)
- **AI**: Your own Gemini API key stored as a project secret (`GEMINI_API_KEY`), called from a server function
- **State/data**: TanStack Query for caching, optimistic updates, debounced search
- **Forms**: react-hook-form + zod
- **UI**: shadcn/ui + Tailwind v4, framer-motion micro-interactions, lucide icons

## Database (Lovable Cloud, RLS on every table)
`profiles`, `projects`, `memories`, `context_injections` exactly as specced. Auto-create profile on signup via trigger. Policies: users can only read/write rows where `user_id = auth.uid()`. Indexes on `user_id`, `project_id`, `created_at`, plus a tsvector index on memories for full-text search.

## Design system
- Dark only: bg `#0a0a0f`, surface `#111118`, card `#1a1a24`, border `#1e1e2e`
- Accent violet `#7c3aed` with glow, secondary cyan `#06b6d4`, gradient `from-violet-600 to-cyan-500`
- Glassmorphism cards (backdrop-blur, white/5, white/10 border)
- Inter font, hover-scale + glow micro-animations on interactive elements
- Platform badge colors: ChatGPT emerald, Claude orange, Gemini blue, Manual gray

## Pages (all 10)
1. **`/`** — Landing: gradient hero, problem cards, 6-feature grid, 3-step how-it-works, 2-tier pricing, footer
2. **`/login`, `/signup`** — Centered glass card, email/password, gradient submit, floating labels, error glow
3. **`/dashboard`** — Sidebar (240px) + topbar layout. Stats row (4 metrics), recent memories grid, active projects horizontal scroll, quick-capture widget, activity timeline. Realtime "new memory" toast.
4. **`/dashboard/memories`** — Search + platform/project filters + sort + Grid/List/Timeline view toggle. Debounced search (300ms), virtualized list at 100+ items, empty state.
5. **`/dashboard/memories/[id]`** — Tabs: Overview / Insights / Context Pack / Related. Inline-editable title, action items with checkboxes, copy-to-clipboard context preview, JSON + Markdown export.
6. **`/dashboard/projects`** — Grid + "New Project" modal (name, description, goals, tech-stack chip input, constraints, 8-color picker)
7. **`/dashboard/projects/[id]`** — Header with stats, right metadata sidebar (auto-save progress notes), scoped memories grid, "Generate Context Pack" combining all project memories
8. **`/dashboard/capture`** — Title, platform selector, capture-method selector, large textarea, project + tags, "Analyze & Save". Analysis preview panel lets user edit AI output before saving.
9. **`/dashboard/settings`** — Profile (avatar upload to Storage), Preferences (default project, auto-analyze toggle), Integration (extension status), Data (export JSON/MD, import, danger-zone delete-all), Plan (usage bar, upgrade CTA)
10. **`/dashboard/export`** — Multi-select memories, project filter, date range, format selector (JSON / MD / Plain / Context Pack), preview, download + copy

## Reusable components
`MemoryCard`, `ProjectCard`, `PlatformBadge`, `QuickCapture` (fixed bottom-right FAB + slide-up panel), `ContextInjectModal`, `GlobalSearch` (Cmd+K overlay, keyboard nav), `LoadingSkeletons`, sonner toasts.

## Server functions (replaces your `/api/*` routes)
- `analyzeMemory` — calls Gemini 1.5 Flash with structured JSON prompt, retries 3x with exponential backoff, returns summary/key_points/decisions/open_questions/action_items/relevance_score
- `createMemory`, `updateMemory`, `archiveMemory` (soft delete), `searchMemories` (full-text)
- `generateContextPack` — formats selected memories into the `--- AI Memory Vault Context ---` block exactly as specced
- `getProjectContext` — full project context pack
- Server route `/api/extension/sync` — Bearer-token (Supabase JWT) authenticated POST endpoint for extension captures

## Realtime + extension bridge
- Subscribe to `memories` table on dashboard mount → toast "New memory captured" on INSERT, invalidate Query cache
- Detect `window.__AI_MEMORY_VAULT_EXTENSION` on dashboard → green "Extension Connected" badge, else "Install Extension" CTA pointing to the downloadable .zip

## Chrome Extension scaffold (MV3)
Bundled in `/dev-server/extension/`, packaged to `public/ai-context-bridge-extension.zip`:
- `manifest.json` (MV3, permissions: activeTab, storage, scripting)
- Content script that injects `window.__AI_MEMORY_VAULT_EXTENSION = true` and adds a "Capture to Vault" button on chatgpt.com / claude.ai / gemini.google.com
- Popup with sign-in (paste Supabase session token), recent captures list, "Open Dashboard" button
- Background service worker that POSTs captures to `/api/extension/sync` with the user's bearer token
- Settings page in dashboard surfaces installation instructions + download link (fetch+blob pattern)

## Responsive
- ≥1280px full sidebar + content
- 768–1280px icon-only collapsed sidebar, hover to expand
- <768px bottom nav bar, stacked cards

## Performance & quality
- TanStack Query for all reads/mutations, optimistic archive/delete
- 300ms debounce on search, virtualized memory list (react-virtuoso) past 100 items
- Lazy avatars, skeleton loaders matching card dimensions
- All server fns wrapped in try/catch returning typed `{ data, error }` shape
- Offline detection banner via `navigator.onLine` + online/offline events
- Local timezone formatting via date-fns

## Secrets needed (I'll prompt for these during build)
- `GEMINI_API_KEY` — your Google AI Studio key
- Supabase URL/keys are auto-provisioned by Lovable Cloud

## Build order
1. Lovable Cloud + schema + RLS + auth trigger
2. Auth pages + protected route guard (`_authenticated` layout)
3. Design tokens + shared layout (sidebar, topbar, FAB)
4. Memories CRUD + Gemini analyze server fn + Capture page
5. Dashboard home + Projects (list, detail, modal)
6. Memory detail tabs + Context Pack generator + Export center
7. Settings + realtime subscription + extension-detect badge
8. Landing page polish + responsive pass
9. Chrome extension scaffold + zip packaging + download flow
10. End-to-end QA pass
