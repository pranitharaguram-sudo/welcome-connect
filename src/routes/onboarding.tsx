import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { PRIORITY_OPTIONS } from "@/lib/onboarding";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your three questions — Kindle" },
      {
        name: "description",
        content: "Tell us your priorities, hobbies, and goals in three short steps.",
      },
      { property: "og:title", content: "Your three questions — Kindle" },
      {
        property: "og:description",
        content: "Tell us your priorities, hobbies, and goals in three short steps.",
      },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [checking, setChecking] = useState(true);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState("");
  const [goals, setGoals] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/", replace: true });
      return;
    }
    let active = true;
    supabase
      .from("onboarding_responses")
      .select("priorities, hobbies, goals, completed_at")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        if (data?.completed_at) {
          void navigate({ to: "/dashboard", replace: true });
          return;
        }
        if (data) {
          setPriorities(data.priorities ?? []);
          setHobbies(data.hobbies ?? "");
          setGoals(data.goals ?? "");
        }
        setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [loading, user, navigate]);

  function togglePriority(value: string) {
    setPriorities((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value],
    );
  }

  const canContinue =
    (step === 0 && priorities.length > 0) ||
    (step === 1 && hobbies.trim().length > 0) ||
    (step === 2 && goals.trim().length > 0);

  async function finish() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("onboarding_responses").upsert(
      {
        user_id: user.id,
        priorities,
        hobbies: hobbies.trim().slice(0, 1000),
        goals: goals.trim().slice(0, 1000),
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    setSaving(false);
    if (error) {
      toast.error("We couldn't save your answers. Please try again.");
      return;
    }
    void navigate({ to: "/dashboard", replace: true });
  }

  if (loading || checking) {
    return (
      <main className="bg-warm flex min-h-screen items-center justify-center">
        <Loader2 className="text-gold size-6 animate-spin" />
      </main>
    );
  }

  return (
    <main className="bg-warm min-h-screen px-5 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-gold" : "bg-gold-soft/60"
              }`}
            />
          ))}
        </div>
        <p className="text-muted-foreground mt-3 text-sm">Question {step + 1} of 3</p>

        <div key={step} className="animate-rise bg-card shadow-soft mt-6 rounded-3xl border p-7 sm:p-10">
          {step === 0 && (
            <>
              <h1 className="text-3xl font-semibold">
                What is the priority in your life right now?
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">Pick as many as you like.</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {PRIORITY_OPTIONS.map((option) => {
                  const active = priorities.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => togglePriority(option.value)}
                      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                        active
                          ? "border-gold bg-gold-soft/40 shadow-soft"
                          : "bg-sand/40 hover:border-gold/60"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                          active ? "bg-gold border-gold text-primary-foreground" : "border-border"
                        }`}
                      >
                        {active && <Check className="size-3.5" />}
                      </span>
                      <span>
                        <span className="block font-medium">{option.label}</span>
                        <span className="text-muted-foreground text-sm">{option.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="text-3xl font-semibold">What are your hobbies?</h1>
              <p className="text-muted-foreground mt-2 text-sm">
                The things you'd happily lose an afternoon to.
              </p>
              <Textarea
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
                maxLength={1000}
                rows={6}
                placeholder="Baking, long walks, film photography…"
                className="mt-6 rounded-2xl text-base"
              />
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-3xl font-semibold">
                What are your areas of focus in the near future?
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                And what goals do you wish to achieve?
              </p>
              <Textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                maxLength={1000}
                rows={6}
                placeholder="Finish my certification, run a half marathon…"
                className="mt-6 rounded-2xl text-base"
              />
            </>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || saving}
            >
              <ArrowLeft className="mr-1 size-4" />
              Back
            </Button>
            {step < 2 ? (
              <Button
                type="button"
                className="rounded-xl px-6"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canContinue}
              >
                Continue
                <ArrowRight className="ml-1 size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                className="rounded-xl px-6"
                onClick={finish}
                disabled={!canContinue || saving}
              >
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                Finish
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
