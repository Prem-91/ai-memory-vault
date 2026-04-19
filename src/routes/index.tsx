import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Brain,
  Zap,
  FolderKanban,
  Sparkles,
  Globe,
  WifiOff,
  ArrowRight,
  Check,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Context Bridge — Memory for every AI conversation" },
      {
        name: "description",
        content:
          "Stop re-explaining your projects. AI Context Bridge captures, organizes, and instantly injects your context into any AI chat.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Brain, title: "Smart Capture", desc: "One-click save from ChatGPT, Claude, or Gemini." },
  { icon: Zap, title: "One-Click Inject", desc: "Paste your full context into any chat instantly." },
  { icon: FolderKanban, title: "Project Organization", desc: "Group memories by project with goals & stack." },
  { icon: Sparkles, title: "AI Analysis", desc: "Auto-extract decisions, key points & action items." },
  { icon: Globe, title: "Cross-Platform", desc: "Bridge context across every AI tool you use." },
  { icon: WifiOff, title: "Offline First", desc: "Captures sync the moment you're back online." },
];

function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Nav */}
      <header className="relative z-10 px-6 md:px-10 py-5 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#how" className="hover:text-foreground transition">How it works</a>
          <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="gradient-bg glow-violet-sm border-0">
            <Link to="/signup">Start Free</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 px-6 md:px-10 pt-16 md:pt-24 pb-20 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground mb-6">
            <span className="size-1.5 rounded-full bg-primary glow-violet-sm" />
            New: Realtime sync from your Chrome extension
          </span>
          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
            Your AI conversations
            <br />
            deserve a <span className="gradient-text">memory</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Stop re-explaining your projects. AI Context Bridge captures, organizes, and instantly
            injects your context into any AI chat.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Button asChild size="lg" className="gradient-bg glow-violet border-0 h-12 px-6">
              <Link to="/signup">
                Start Free <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 border-border">
              <Link to="/login">See Demo</Link>
            </Button>
          </div>
        </motion.div>

        {/* Hero mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-16 relative"
        >
          <div className="relative mx-auto max-w-4xl rounded-2xl glass-strong p-2 glow-violet">
            <div className="rounded-xl bg-background/80 grid-pattern p-6 md:p-10 min-h-[280px]">
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { label: "Memories", value: "248", color: "from-violet-600 to-cyan-500" },
                  { label: "Projects", value: "12", color: "from-cyan-500 to-violet-600" },
                  { label: "Injections", value: "1.2k", color: "from-violet-600 to-pink-500" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl glass p-4 text-left">
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                    <div className={`mt-1 text-3xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid md:grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="rounded-xl glass p-4 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold uppercase">
                        ChatGPT
                      </span>
                      <span className="text-[10px] text-muted-foreground">2 min ago</span>
                    </div>
                    <div className="text-sm font-semibold">Refactor authentication flow</div>
                    <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      Discussed JWT rotation, session storage, and middleware patterns…
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Problem */}
      <section className="relative z-10 px-6 md:px-10 py-20 max-w-6xl mx-auto">
        <h2 className="text-center text-3xl md:text-4xl font-bold">The context problem</h2>
        <p className="text-center mt-3 text-muted-foreground">Three pains every AI power-user knows.</p>
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {[
            { title: "Lost context every conversation", desc: "Every new chat starts from zero. Your AI forgets what you built yesterday." },
            { title: "Re-explaining everything", desc: "Pasting the same project background again and again wastes hours every week." },
            { title: "Switching AI tools costs time", desc: "Moving between Claude, ChatGPT, and Gemini means rebuilding context each time." },
          ].map((p) => (
            <div key={p.title} className="rounded-xl glass p-6">
              <div className="size-8 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center font-bold">!</div>
              <h3 className="mt-4 font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 md:px-10 py-20 max-w-6xl mx-auto">
        <h2 className="text-center text-3xl md:text-4xl font-bold">Everything you need to remember</h2>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                whileHover={{ y: -3 }}
                className="rounded-xl glass p-6 hover:border-primary/30 hover:glow-violet-sm transition"
              >
                <div className="size-10 rounded-lg gradient-bg flex items-center justify-center glow-violet-sm">
                  <Icon className="size-5 text-white" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 px-6 md:px-10 py-20 max-w-5xl mx-auto">
        <h2 className="text-center text-3xl md:text-4xl font-bold">How it works</h2>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            { n: "1", t: "Capture", d: "One click to save any AI conversation." },
            { n: "2", t: "Organize", d: "AI extracts decisions, key points, action items." },
            { n: "3", t: "Inject", d: "Paste your context into any AI in seconds." },
          ].map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto size-14 rounded-2xl gradient-bg flex items-center justify-center text-2xl font-bold text-white glow-violet">
                {s.n}
              </div>
              <h3 className="mt-4 text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 px-6 md:px-10 py-20 max-w-4xl mx-auto">
        <h2 className="text-center text-3xl md:text-4xl font-bold">Simple pricing</h2>
        <div className="mt-12 grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl glass p-8">
            <h3 className="font-semibold text-lg">Free</h3>
            <div className="mt-2 text-4xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              {["50 memories", "3 projects", "Basic export", "Chrome extension"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="size-4 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-6 w-full" variant="outline">
              <Link to="/signup">Start Free</Link>
            </Button>
          </div>
          <div className="rounded-2xl glass-strong p-8 border border-primary/30 glow-violet relative">
            <span className="absolute -top-3 right-6 rounded-full gradient-bg px-3 py-1 text-[10px] font-bold uppercase text-white">Popular</span>
            <h3 className="font-semibold text-lg">Pro</h3>
            <div className="mt-2 text-4xl font-bold">$9<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              {[
                "Unlimited memories",
                "Unlimited projects",
                "AI analysis with Gemini",
                "Team features",
                "Priority support",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="size-4 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-6 w-full gradient-bg border-0">
              <Link to="/signup">Upgrade to Pro</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border px-6 md:px-10 py-8 mt-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Logo />
          <p>© {new Date().getFullYear()} AI Context Bridge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
