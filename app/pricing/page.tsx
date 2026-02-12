"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "@/components/toast";
import { FOUNDERS_ACCESS_PERKS } from "@/lib/entitlements/products";

const FOUNDERS_PRICE_ID = "price_1SpBht050iAre6ZtPyv42z6s";

export default function PricingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const handlePaidAccess = async () => {
    if (!session?.user) {
      toast({
        type: "error",
        description: "Please sign in to purchase Paid Access",
      });
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId: FOUNDERS_PRICE_ID }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        type: "error",
        description: "Failed to start checkout. Please try again.",
      });
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-[#0e0a12] text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-col gap-4">
          <div className="text-xs uppercase tracking-[0.3em] text-white/60">
            Brooks AI HUB
          </div>
          <h1 className="font-pixel text-3xl text-white">Pricing</h1>
          <p className="max-w-2xl text-sm text-white/70">
            Unlock Paid Access to get premium ATO routes, higher usage limits,
            and early access to new experiences.
          </p>
          <p className="max-w-2xl text-xs text-white/60">
            Want a transparent breakdown of what is live today vs in progress?{" "}
            <Link
              className="underline underline-offset-4 transition hover:text-white"
              href="https://github.com/NorthernAmericana/brooks-aihub-chat-175/blob/main/docs/launch/readiness-matrix.md"
              rel="noreferrer"
              target="_blank"
            >
              View the launch readiness matrix
            </Link>
            .
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-white">Paid</h2>
            <p className="mt-2 text-sm text-white/70">
              For early adopters who want the full Brooks AI HUB experience.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-white/70">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Unlock paid-only ATO routes and premium agent experiences.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Higher monthly quotas for unofficial ATO creation and file
                uploads.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Priority access to NAMC lore drops and experimental apps.
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
            <div className="text-sm uppercase tracking-[0.3em] text-white/60">
              Paid Access
            </div>
            <div className="mt-4 text-4xl font-semibold text-white">
              $4.99
            </div>
            <div className="mt-1 text-xs text-white/60">per month</div>
            <button
              className="mt-6 w-full rounded-full bg-pink-500 py-3 text-sm font-semibold text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
              onClick={handlePaidAccess}
              type="button"
            >
              {loading ? "Loading..." : "Upgrade to Paid"}
            </button>
            <Link
              className="mt-4 block text-xs text-white/50 transition hover:text-white"
              href="/store"
            >
              Back to store
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-white/60">
                Founders perks
              </div>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Everything unlocked with Founders Access
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-white/70">
                Founders members get the premium ATO routes plus higher limits
                across creation, uploads, and customization.
              </p>
            </div>
            <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/70">
              Included
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {FOUNDERS_ACCESS_PERKS.map((perk) => (
              <div
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
                key={perk.id}
              >
                <div className="text-sm font-semibold text-white">
                  {perk.title}
                </div>
                <p className="mt-2 text-xs text-white/70">
                  {perk.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
