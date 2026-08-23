import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/use-auth";
import journeyPath from "@/assets/journey-path.jpg";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your Journey Awaits — Wayfarer" },
      {
        name: "description",
        content:
          "Sign in with Google or email to begin your journey and map the worlds that matter to you.",
      },
      { property: "og:title", content: "Your Journey Awaits — Wayfarer" },
      {
        property: "og:description",
        content: "Begin your journey. Sign in with Google or email.",
      },
    ],
  }),
  component: LandingPage,
});

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.9 2.6 13.8l7.8 6c1.9-5.7 7.2-10.3 13.6-10.3z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-2.8-.4-4.1H24v7.8h12.7c-.3 2.1-1.6 5.3-4.7 7.4l7.6 5.9c4.5-4.2 6.9-10.3 6.9-17z"
      />
      <path
        fill="#FBBC05"
        d="M10.4 28.2c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6C1 16 0 19.9 0 23.5s1 7.5 2.6 10.7l7.8-6z"
      />
      <path
        fill="#34A853"
        d="M24 47.5c6.2 0 11.4-2 15.2-5.6l-7.6-5.9c-2 1.4-4.8 2.4-7.6 2.4-6.4 0-11.7-4.6-13.6-10.3l-7.8 6C6.5 42.1 14.6 47.5 24 47.5z"
      />
    </svg>
  );
}

function Compass() {
  return (
    <svg viewBox="0 0 100 100" className="text-gold mx-auto size-16" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="50" cy="50" r="14" opacity="0.6" />
        <circle cx="50" cy="50" r="22" opacity="0.25" />
      </g>
      <path d="M50 6 57 43 94 50 57 57 50 94 43 57 6 50 43 43Z" fill="currentColor" />
    </svg>
  );
}

function LandingPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [showEmail, setShowEmail] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentEmail, setSentEmail] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      void navigate({ to: "/onboarding", replace: true });
    }
  }, [loading, session, navigate]);

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in didn't work. Please try again.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/onboarding", replace: true });
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { nickname: nickname.trim() },
        },
      });
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      if (!data.session) {
        setSentEmail(true);
        return;
      }
      void navigate({ to: "/onboarding", replace: true });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      void navigate({ to: "/onboarding", replace: true });
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-14">
      <img
        src={journeyPath}
        alt="A lantern-lit stone path winding toward a distant golden castle at dusk"
        width={1024}
        height={1536}
        className="absolute inset-0 size-full object-cover object-bottom"
      />
      <div className="bg-night/80 absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background" />

      <div className="animate-rise relative w-full max-w-md text-center">
        <Compass />
        <h1 className="mt-7 text-5xl leading-tight font-semibold sm:text-6xl">
          Your Journey
          <span className="text-gilded block">Awaits</span>
        </h1>
        <p className="font-sans mt-5 text-lg text-foreground/75 italic">
          Every step brings you closer to who you're meant to become.
        </p>

        {sentEmail ? (
          <div className="glass-panel shadow-deep mt-10 space-y-4 rounded-3xl p-7">
            <h2 className="text-2xl">Check your inbox</h2>
            <p className="text-muted-foreground text-sm">
              We sent a confirmation link to <strong>{email}</strong>. Follow it, and the
              path continues.
            </p>
            <Button variant="ghost" onClick={() => setSentEmail(false)}>
              Back
            </Button>
          </div>
        ) : !showEmail ? (
          <div className="mt-11 space-y-7">
            <Button
              onClick={handleGoogle}
              disabled={busy}
              className="border-gold/50 shadow-glow h-14 w-full rounded-full border tracking-[0.28em] uppercase"
            >
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Begin Journey
            </Button>
            <p className="text-muted-foreground text-sm">Log in to continue</p>
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleGoogle}
                aria-label="Continue with Google"
                className="border-gold/35 hover:border-gold/80 hover:shadow-glow flex size-14 items-center justify-center rounded-full border bg-card/60 transition-all"
              >
                <GoogleMark />
              </button>
              <button
                type="button"
                onClick={() => setShowEmail(true)}
                aria-label="Continue with email"
                className="border-gold/35 hover:border-gold/80 hover:shadow-glow flex size-14 items-center justify-center rounded-full border bg-card/60 transition-all"
              >
                <Mail className="text-gold size-5" />
              </button>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <span className="gold-rule flex-1" />
              <span className="text-muted-foreground font-sans text-sm italic">
                Three questions await
              </span>
              <span className="gold-rule flex-1" />
            </div>
          </div>
        ) : (
          <div className="glass-panel shadow-deep mt-9 rounded-3xl p-7 text-left">
            <h2 className="text-center text-xl tracking-widest uppercase">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <form onSubmit={handleEmail} className="mt-6 space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="nickname">Nickname</Label>
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="What shall we call you?"
                    maxLength={40}
                    required
                    className="h-11 rounded-xl bg-background/40"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  maxLength={255}
                  required
                  className="h-11 rounded-xl bg-background/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                  className="h-11 rounded-xl bg-background/40"
                />
              </div>
              <Button
                type="submit"
                disabled={busy}
                className="border-gold/50 h-12 w-full rounded-full border tracking-[0.2em] uppercase"
              >
                {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
                {mode === "signin" ? "Enter" : "Create account"}
              </Button>
            </form>
            <p className="text-muted-foreground mt-5 text-center text-sm">
              {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
              <button
                type="button"
                className="text-gold underline-offset-4 hover:underline"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              >
                {mode === "signin" ? "Create an account" : "Sign in"}
              </button>
            </p>
            <button
              type="button"
              onClick={() => setShowEmail(false)}
              className="text-muted-foreground mt-4 w-full text-center text-xs tracking-widest uppercase hover:text-foreground"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
