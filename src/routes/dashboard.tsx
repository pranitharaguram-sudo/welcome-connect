import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LogOut, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { priorityLabel } from "@/lib/onboarding";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your profile — Kindle" },
      { name: "description", content: "Your saved priorities, hobbies, and goals." },
      { property: "og:title", content: "Your profile — Kindle" },
      {
        property: "og:description",
        content: "Your saved priorities, hobbies, and goals.",
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
      <main className="bg-warm flex min-h-screen items-center justify-center">
        <Loader2 className="text-gold size-6 animate-spin" />
      </main>
    );
  }

  return (
    <main className="bg-warm min-h-screen px-5 py-12">
      <div className="mx-auto w-full max-w-3xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-sm">Welcome back</p>
            <h1 className="mt-1 text-4xl font-semibold">
              {nickname ?? user?.email?.split("@")[0]}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => navigate({ to: "/onboarding", search: { edit: "1" } })}
            >
              <Pencil className="mr-2 size-4" />
              Edit answers
            </Button>
            <Button variant="ghost" className="rounded-xl" onClick={signOut}>
              <LogOut className="mr-2 size-4" />
              Sign out
            </Button>
          </div>
        </header>

        <section className="animate-rise mt-8 grid gap-5">
          <article className="bg-card shadow-soft rounded-3xl border p-7">
            <h2 className="text-muted-foreground text-sm tracking-widest uppercase">
              Current priorities
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {answers.priorities.length === 0 ? (
                <p className="text-muted-foreground">Nothing selected yet.</p>
              ) : (
                answers.priorities.map((p) => (
                  <span
                    key={p}
                    className="bg-gold-soft/50 border-gold/40 rounded-full border px-4 py-1.5 text-sm font-medium"
                  >
                    {priorityLabel(p)}
                  </span>
                ))
              )}
            </div>
          </article>

          <article className="bg-card shadow-soft rounded-3xl border p-7">
            <h2 className="text-muted-foreground text-sm tracking-widest uppercase">Hobbies</h2>
            <p className="mt-3 leading-relaxed whitespace-pre-wrap">{answers.hobbies}</p>
          </article>

          <article className="bg-card shadow-soft rounded-3xl border p-7">
            <h2 className="text-muted-foreground text-sm tracking-widest uppercase">
              Focus &amp; goals
            </h2>
            <p className="mt-3 leading-relaxed whitespace-pre-wrap">{answers.goals}</p>
          </article>
        </section>
      </div>
    </main>
  );
}
