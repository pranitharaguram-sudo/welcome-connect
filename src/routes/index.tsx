import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Kindle" },
      {
        name: "description",
        content:
          "Create an account or sign in with Google to set up your Kindle profile in three short questions.",
      },
      { property: "og:title", content: "Sign in — Kindle" },
      {
        property: "og:description",
        content: "Create an account or sign in with Google to get started.",
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

function LandingPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
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
    <main className="bg-warm min-h-screen px-5 py-10">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-16">
        <section className="animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 text-sm text-muted-foreground shadow-soft">
            <Sparkles className="size-4 text-gold" />
            Three questions. That's it.
          </span>
          <h1 className="mt-6 text-5xl leading-[1.05] font-semibold sm:text-6xl">
            A warmer place to
            <span className="block text-gold">know yourself better.</span>
          </h1>
          <p className="text-muted-foreground mt-5 max-w-md text-lg">
            Sign in, tell us what matters to you right now, and we'll keep it all in one
            calm little dashboard you can come back to.
          </p>
        </section>

        <section className="animate-rise bg-card shadow-soft rounded-3xl border p-7 sm:p-9">
          {sentEmail ? (
            <div className="space-y-4 text-center">
              <h2 className="text-2xl font-semibold">Check your inbox</h2>
              <p className="text-muted-foreground text-sm">
                We sent a confirmation link to <strong>{email}</strong>. Click it and come
                right back.
              </p>
              <Button variant="outline" onClick={() => setSentEmail(false)}>
                Back
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {mode === "signin"
                  ? "Sign in to pick up where you left off."
                  : "It takes less than a minute."}
              </p>

              <Button
                type="button"
                variant="outline"
                className="mt-6 h-12 w-full gap-3 rounded-xl text-base"
                onClick={handleGoogle}
                disabled={busy}
              >
                <GoogleMark />
                Continue with Google
              </Button>

              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-muted-foreground text-xs tracking-widest uppercase">
                  or
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={handleEmail} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="nickname">Nickname</Label>
                    <Input
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="What should we call you?"
                      maxLength={40}
                      required
                      className="h-11 rounded-xl"
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
                    className="h-11 rounded-xl"
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
                    className="h-11 rounded-xl"
                  />
                </div>
                <Button type="submit" className="h-12 w-full rounded-xl text-base" disabled={busy}>
                  {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </form>

              <p className="text-muted-foreground mt-5 text-center text-sm">
                {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  className="text-gold font-medium underline-offset-4 hover:underline"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                >
                  {mode === "signin" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
