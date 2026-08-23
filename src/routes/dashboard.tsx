import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Briefcase,
  BookOpen,
  Compass,
  Heart,
  Loader2,
  LogOut,
  Palette,
  Pencil,
  Target,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { priorityLabel } from "@/lib/onboarding";
import worldsMap from "@/assets/worlds-map.jpg";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your Worlds — Wayfarer" },
      {
        name: "description",
        content: "The realms you chose, the passions you keep, and the goals ahead.",
      },
      { property: "og:title", content: "Your Worlds — Wayfarer" },
      {
        property: "og:description",
        content: "The realms you chose, the passions you keep, and the goals ahead.",
      },
    ],
  }),
  component: DashboardPage,
});

type Answers = {
  priorities: string[];
  hobbies: string;
  goals: string;
};

const WORLD_META: Record<string, { icon: LucideIcon; tagline: string }> = {
  career: { icon: Briefcase, tagline: "Build your legacy" },
  growth: { icon: BookOpen, tagline: "Expand your mind" },
  social: { icon: Users, tagline: "Nurture relationships" },
  wellbeing: { icon: Heart, tagline: "Tend to yourself" },
  adventure: { icon: Compass, tagline: "Explore the unknown" },
};

function DashboardPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [nickname, setNickname] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/", replace: true });
      return;
    }
    let active = true;
    void (async () => {
      const [profile, response] = await Promise.all([
        supabase.from("profiles").select("nickname").eq("id", user.id).maybeSingle(),
        supabase
          .from("onboarding_responses")
          .select("priorities, hobbies, goals, completed_at")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      if (!active) return;
      if (!response.data?.completed_at) {
        void navigate({ to: "/onboarding", replace: true });
        return;
      }
      setNickname(profile.data?.nickname ?? null);
      setAnswers({
        priorities: response.data.priorities ?? [],
        hobbies: response.data.hobbies ?? "",
        goals: response.data.goals ?? "",
      });
      setBusy(false);
    })();
    return () => {
      active = false;
    };
  }, [loading, user, navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/", replace: true });
  }

  if (loading || busy || !answers) {
    return (
      <main className="bg-night flex min-h-screen items-center justify-center">
        <Loader2 className="text-gold size-6 animate-spin" />
      </main>
    );
  }

  return (
    <main className="bg-night min-h-screen px-5 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <header className="text-center">
          <p className="text-muted-foreground font-sans text-lg italic">
            Good to see you, {nickname ?? user?.email?.split("@")[0]}.
          </p>
          <h1 className="text-gilded mt-2 text-4xl tracking-[0.18em] uppercase">
            Your Worlds
          </h1>
          <div className="gold-rule mx-auto mt-4 w-40" />
        </header>

        <section className="animate-rise shadow-deep border-gold/25 relative mt-8 overflow-hidden rounded-3xl border">
          <img
            src={worldsMap}
            alt="An illustrated map of glowing fantasy realms linked by a golden path"
            width={1024}
            height={1536}
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-background/55" />
          <div className="relative grid gap-3 p-5 sm:grid-cols-2 sm:p-7">
            {answers.priorities.length === 0 ? (
              <p className="text-muted-foreground">No realms chosen yet.</p>
            ) : (
              answers.priorities.map((p) => {
                const meta = WORLD_META[p];
                const Icon = meta?.icon ?? Compass;
                return (
                  <div
                    key={p}
                    className="glass-panel flex items-center gap-4 rounded-2xl px-4 py-3"
                  >
                    <span className="border-gold/50 text-gold flex size-11 shrink-0 items-center justify-center rounded-full border bg-background/50">
                      <Icon className="size-5" />
                    </span>
                    <span>
                      <span className="block font-display text-sm tracking-[0.2em] uppercase">
                        {priorityLabel(p)}
                      </span>
                      <span className="text-muted-foreground font-sans text-base italic">
                        {meta?.tagline ?? "Your own path"}
                      </span>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="animate-rise mt-6 grid gap-5 sm:grid-cols-2">
          <article className="glass-panel shadow-deep rounded-3xl p-6">
            <h2 className="text-gold flex items-center gap-2 text-sm tracking-[0.22em] uppercase">
              <Palette className="size-4" /> Passions
            </h2>
            <div className="gold-rule my-4" />
            <p className="font-sans text-lg leading-relaxed whitespace-pre-wrap">
              {answers.hobbies}
            </p>
          </article>

          <article className="glass-panel shadow-deep rounded-3xl p-6">
            <h2 className="text-gold flex items-center gap-2 text-sm tracking-[0.22em] uppercase">
              <Target className="size-4" /> The Road Ahead
            </h2>
            <div className="gold-rule my-4" />
            <p className="font-sans text-lg leading-relaxed whitespace-pre-wrap">
              {answers.goals}
            </p>
          </article>
        </section>

        <div className="mt-8 flex justify-center gap-3">
          <Button
            variant="outline"
            className="border-gold/40 rounded-full px-6 tracking-[0.18em] uppercase"
            onClick={() => navigate({ to: "/onboarding", search: { edit: "1" } })}
          >
            <Pencil className="mr-2 size-4" />
            Edit answers
          </Button>
          <Button
            variant="ghost"
            className="rounded-full px-6 tracking-[0.18em] uppercase"
            onClick={signOut}
          >
            <LogOut className="mr-2 size-4" />
            Sign out
          </Button>
        </div>
      </div>
    </main>
  );
}
