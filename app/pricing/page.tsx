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
            See exactly what you get this month, what changes by plan, and what
            is still in progress before you upgrade.
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

        <section className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">
            Live this month
          </div>
          <h2 className="mt-2 text-xl font-semibold text-white">
            What you can use immediately after upgrade
          </h2>
          <div className="mt-4 grid gap-3 text-sm text-white/80">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Access Founders-only slash routes and premium ATO app routes in
              the HUB.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Raise creator limits right now: up to 10 unofficial ATOs each
              month, instruction length up to 999 characters, and avatar pairing
              at setup.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Get higher upload capacity right now: up to 10 files per ATO and
              up to 10 images per chat message.
            </div>
          </div>
        </section>

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
            <div className="mt-4 text-4xl font-semibold text-white">$4.99</div>
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
          <div className="text-xs uppercase tracking-[0.3em] text-white/60">
            Plan comparison
          </div>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Limits and perks by plan
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[38rem] border-separate border-spacing-y-2 text-left text-sm">
              <thead>
                <tr className="text-white/60">
                  <th className="px-3 py-2 font-medium" scope="col">
                    Feature
                  </th>
                  <th className="px-3 py-2 font-medium" scope="col">
                    Free
                  </th>
                  <th className="px-3 py-2 font-medium" scope="col">
                    Paid (Founders)
                  </th>
                </tr>
              </thead>
              <tbody className="text-white/80">
                <tr>
                  <td className="rounded-l-2xl border border-r-0 border-white/10 bg-white/5 px-3 py-2">
                    Unofficial ATO creation
                  </td>
                  <td className="border border-r-0 border-white/10 bg-white/5 px-3 py-2">
                    Up to 3 total
                  </td>
                  <td className="rounded-r-2xl border border-white/10 bg-white/5 px-3 py-2">
                    Up to 10 per month
                  </td>
                </tr>
                <tr>
                  <td className="rounded-l-2xl border border-r-0 border-white/10 bg-white/5 px-3 py-2">
                    Instructions length
                  </td>
                  <td className="border border-r-0 border-white/10 bg-white/5 px-3 py-2">
                    Up to 500 characters
                  </td>
                  <td className="rounded-r-2xl border border-white/10 bg-white/5 px-3 py-2">
                    Up to 999 characters
                  </td>
                </tr>
                <tr>
                  <td className="rounded-l-2xl border border-r-0 border-white/10 bg-white/5 px-3 py-2">
                    Avatar pairing during setup
                  </td>
                  <td className="border border-r-0 border-white/10 bg-white/5 px-3 py-2">
                    Not included
                  </td>
                  <td className="rounded-r-2xl border border-white/10 bg-white/5 px-3 py-2">
                    Included
                  </td>
                </tr>
                <tr>
                  <td className="rounded-l-2xl border border-r-0 border-white/10 bg-white/5 px-3 py-2">
                    Files per ATO
                  </td>
                  <td className="border border-r-0 border-white/10 bg-white/5 px-3 py-2">
                    Up to 5
                  </td>
                  <td className="rounded-r-2xl border border-white/10 bg-white/5 px-3 py-2">
                    Up to 10
                  </td>
                </tr>
                <tr>
                  <td className="rounded-l-2xl border border-r-0 border-white/10 bg-white/5 px-3 py-2">
                    Images per chat message
                  </td>
                  <td className="border border-r-0 border-white/10 bg-white/5 px-3 py-2">
                    Up to 5
                  </td>
                  <td className="rounded-r-2xl border border-white/10 bg-white/5 px-3 py-2">
                    Up to 10
                  </td>
                </tr>
                <tr>
                  <td className="rounded-l-2xl border border-r-0 border-white/10 bg-white/5 px-3 py-2">
                    NAMC/HUB premium routes
                  </td>
                  <td className="border border-r-0 border-white/10 bg-white/5 px-3 py-2">
                    Selected free routes only
                  </td>
                  <td className="rounded-r-2xl border border-white/10 bg-white/5 px-3 py-2">
                    Includes Founders-only routes
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-white/60">
            NAMC/HUB ecosystem access means practical in-product access: paid
            members can enter Founders-marked routes in NAMC apps and ATO store
            experiences that are locked for Free users.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-white/60">
            FAQ
          </div>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Clarifications before you subscribe
          </h2>
          <div className="mt-5 space-y-4 text-sm text-white/80">
            <div>
              <h3 className="font-semibold text-white">
                What do I get immediately this month?
              </h3>
              <p className="mt-1 text-white/70">
                Immediate unlocks include Founders routes, higher ATO and upload
                limits, longer instructions, and avatar pairing. There is no
                delayed unlock queue for these perks.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">
                What exactly is NAMC/HUB ecosystem access?
              </h3>
              <p className="mt-1 text-white/70">
                It means certain routes inside NAMC and HUB-linked apps are
                labeled Founders-only. Paid members can open and use those
                routes; Free accounts will see lock/upgrade messaging.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">
                What is not included yet?
              </h3>
              <p className="mt-1 text-white/70">
                Community-only spaces, admin code-generation UI, and some
                roadmap features are still in progress. Founders today is about
                current route access and operational limit increases.
              </p>
            </div>
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
                <p className="mt-2 text-xs text-white/70">{perk.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
