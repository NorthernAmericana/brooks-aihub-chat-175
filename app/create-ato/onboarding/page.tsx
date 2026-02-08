"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const AUTO_ADVANCE_MS = 4500;

const ONBOARDING_SCREENS = [
  {
    title: "Build your own ATO in minutes",
    body: "Name it, shape its personality, and launch a dedicated slash route for your custom assistant.",
    gradient: "from-fuchsia-600/30 via-violet-500/20 to-blue-500/10",
  },
  {
    title: "Choose your creation path",
    body: "Start with a text-first ATO, or pair your ATO with an avatar experience for richer presence.",
    gradient: "from-rose-500/30 via-orange-500/20 to-amber-400/10",
  },
  {
    title: "Instant route + app install",
    body: "Every ATO gets auto-registered under /custom/<slug>/ and installed to your account immediately.",
    gradient: "from-cyan-500/30 via-sky-500/20 to-indigo-500/10",
  },
  {
    title: "Add avatar now or later",
    body: "Founders can pair right away. Everyone else can start with no avatar and upgrade when ready.",
    gradient: "from-emerald-500/30 via-teal-500/20 to-lime-500/10",
  },
] as const;

export default function CreateAtoOnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((previous) => (previous + 1) % ONBOARDING_SCREENS.length);
    }, AUTO_ADVANCE_MS);

    return () => clearInterval(timer);
  }, []);

  const isFounder = Boolean((session?.user as { foundersAccess?: boolean } | undefined)?.foundersAccess);


  const handleAvatarCta = async () => {
    if (isFounder) {
      router.push("/create-ato?avatar=1");
      return;
    }

    const response = await fetch("/api/stripe/avatar-addon-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || typeof data?.url !== "string") {
      router.push("/pricing?intent=ato-avatar");
      return;
    }

    window.location.href = data.url;
  };

  return (
    <main className="mx-auto flex h-full w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          ATO Onboarding
        </p>
        <h1 className="text-3xl font-semibold text-foreground">
          Let&apos;s launch your custom ATO
        </h1>
      </header>

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-background/80 p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.08),_transparent_45%)]" />

        <AnimatePresence mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={`relative min-h-[220px] rounded-2xl border border-white/10 bg-gradient-to-br p-6 ${ONBOARDING_SCREENS[activeIndex].gradient}`}
            exit={{ opacity: 0, y: -6 }}
            initial={{ opacity: 0, y: 6 }}
            key={activeIndex}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <p className="text-xs uppercase tracking-[0.25em] text-white/70">
              Screen {activeIndex + 1} / {ONBOARDING_SCREENS.length}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              {ONBOARDING_SCREENS[activeIndex].title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-white/80">
              {ONBOARDING_SCREENS[activeIndex].body}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {ONBOARDING_SCREENS.map((screen, index) => (
              <button
                aria-label={`Go to screen ${index + 1}: ${screen.title}`}
                className={`h-2.5 rounded-full transition-all ${
                  index === activeIndex ? "w-8 bg-foreground" : "w-2.5 bg-foreground/30"
                }`}
                key={screen.title}
                onClick={() => setActiveIndex(index)}
                type="button"
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() =>
                setActiveIndex((previous) =>
                  previous === 0 ? ONBOARDING_SCREENS.length - 1 : previous - 1
                )
              }
              size="icon"
              type="button"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={() =>
                setActiveIndex((previous) => (previous + 1) % ONBOARDING_SCREENS.length)
              }
              size="icon"
              type="button"
              variant="outline"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Button asChild className="h-12 text-sm font-semibold" size="lg">
          <Link href="/create-ato">Create ATO (No Avatar)</Link>
        </Button>
        <Button className="h-12 text-sm font-semibold" onClick={handleAvatarCta} size="lg" type="button" variant="secondary">
          Create ATO + Avatar Pair
        </Button>
      </section>

      <p className="text-xs text-muted-foreground">
        {isFounder
          ? "Founders can start with avatar pairing immediately."
          : "Avatar pairing for non-founders starts a one-time purchase checkout flow."}
      </p>
    </main>
  );
}
