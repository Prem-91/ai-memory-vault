import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: LoginPage,
});

function LoginPage() {
  const { sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await sendOtp(email, name || undefined);
    setLoading(false);
    if (error) {
      setError(error.message);
      toast.error("Could not send code", { description: error.message });
      return;
    }
    toast.success("Code sent", { description: `Check ${email} for a 6-digit code.` });
    setStep("otp");
  };

  const onVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setError("");
    setLoading(true);
    const { error } = await verifyOtp(email, code);
    setLoading(false);
    if (error) {
      setError(error.message);
      toast.error("Invalid code", { description: error.message });
      return;
    }
    toast.success("Welcome to your vault");
    navigate({ to: "/dashboard" });
  };

  const onResend = async () => {
    setError("");
    setLoading(true);
    const { error } = await sendOtp(email, name || undefined);
    setLoading(false);
    if (error) {
      toast.error("Could not resend", { description: error.message });
      return;
    }
    toast.success("New code sent");
  };

  return (
    <div className="min-h-screen relative grid-pattern flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <div className="rounded-2xl glass-strong p-8 glow-violet-sm">
          {step === "email" ? (
            <>
              <h1 className="text-2xl font-bold">Sign in or create account</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                We'll email you a 6-digit code. No password needed.
              </p>

              <form onSubmit={onSendCode} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Display name (optional)</Label>
                  <Input
                    id="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={error ? "border-destructive ring-2 ring-destructive/30" : ""}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full gradient-bg glow-violet-sm border-0 h-11"
                >
                  {loading ? "Sending code…" : "Send 6-digit code"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                }}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition mb-3"
              >
                <ArrowLeft className="size-3" /> Use a different email
              </button>
              <h1 className="text-2xl font-bold">Enter your code</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sent to <span className="text-foreground font-medium">{email}</span>
              </p>

              <form onSubmit={onVerify} className="mt-6 space-y-5">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={code} onChange={setCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="size-11 text-lg" />
                      <InputOTPSlot index={1} className="size-11 text-lg" />
                      <InputOTPSlot index={2} className="size-11 text-lg" />
                      <InputOTPSlot index={3} className="size-11 text-lg" />
                      <InputOTPSlot index={4} className="size-11 text-lg" />
                      <InputOTPSlot index={5} className="size-11 text-lg" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {error && <p className="text-sm text-destructive text-center">{error}</p>}
                <Button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full gradient-bg glow-violet-sm border-0 h-11"
                >
                  {loading ? "Verifying…" : "Verify & continue"}
                </Button>
                <button
                  type="button"
                  onClick={onResend}
                  disabled={loading}
                  className="block w-full text-center text-xs text-muted-foreground hover:text-foreground transition"
                >
                  Didn't get it? Resend code
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Codes expire in 10 minutes. Free forever — 50 memories, 3 projects.
        </p>
      </div>
    </div>
  );
}
