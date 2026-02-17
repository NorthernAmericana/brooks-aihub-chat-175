"use client";

import Image from "next/image";
import Link from "next/link";
import forestGreenUiWelcome from "@/public/ui/forest-green-ui-welcome.png";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { EarlyReleaseBanner } from "@/components/early-release-banner";
import { toast } from "@/components/toast";
import { FOUNDERS_STRIPE_PRICE_ID } from "@/lib/launch-config";

export default function IntroPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFoundersAccess = async () => {
    if (!session?.user) {
      toast({
        type: "error",
        description: "Please sign in to purchase Founders Access",
      });
      router.push("/login");
      return;
    }

    if (!FOUNDERS_STRIPE_PRICE_ID) {
      toast({
        type: "error",
        description: "Checkout is temporarily unavailable. Please try again later.",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: FOUNDERS_STRIPE_PRICE_ID,
        }),
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

  useEffect(() => {
    if (session?.user) {
      setIsSigningOut(false);
    }
  }, [session?.user]);

  // Removed auto-redirect to /welcome for unauthenticated users
  // This allows crawlers to index the landing page

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.muted = true;
    audio.volume = 0.35;

    const startMuted = async () => {
      try {
        await audio.play();
      } catch {
        // Ignore: autoplay policies may block background audio.
      }
    };

    const handleInteraction = async () => {
      audio.muted = false;
      try {
        await audio.play();
      } catch {
        // Ignore: user settings or browser policies may block playback.
      }
    };

    void startMuted();

    window.addEventListener("pointerdown", handleInteraction, { once: true });
    window.addEventListener("keydown", handleInteraction, { once: true });

    return () => {
      window.removeEventListener("pointerdown", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#0a1511] text-white">
      <audio
        ref={audioRef}
        src="/audio/forest-background-sounds.mp3"
        loop
        preload="auto"
        playsInline
      />
      <div className="intro-sky absolute inset-0" />
      <div className="intro-stars absolute inset-0" />
      <div className="intro-mist absolute inset-0" />

      <div className="absolute right-6 top-6 z-20">
        {session?.user && !isSigningOut ? (
          <button
            className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:border-white/40 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/50"
            onClick={async () => {
              setIsSigningOut(true);
              await signOut({ redirect: false });
            }}
            type="button"
          >
            Sign out
          </button>
        ) : (
          <Link
            className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:border-white/40 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/50"
            href="/login"
          >
            Sign in
          </Link>
        )}
      </div>

      <Image
        alt=""
        aria-hidden
        className="intro-float pointer-events-none absolute left-[3%] top-[16%] h-auto w-24 select-none opacity-95 sm:left-[8%] sm:top-[18%] sm:w-48"
        height={520}
        priority
        src={forestGreenUiWelcome}
        width={900}
      />
      <Image
        alt=""
        aria-hidden
        className="intro-float-slow pointer-events-none absolute right-[4%] top-[14%] h-auto w-28 select-none opacity-95 sm:right-[10%] sm:w-56"
        height={520}
        priority
        src={forestGreenUiWelcome}
        width={900}
      />
      <Image
        alt=""
        aria-hidden
        className="intro-float pointer-events-none absolute bottom-[18%] right-[18%] hidden h-auto w-44 select-none md:block"
        height={520}
        priority
        src={forestGreenUiWelcome}
        width={900}
      />

      <div className="intro-sparkle absolute right-[22%] top-[22%] h-3 w-3 rotate-45 rounded-sm bg-emerald-200/80 shadow-[0_0_12px_rgba(150,255,210,0.8)]" />
      <div className="intro-sparkle absolute left-[18%] bottom-[20%] h-2.5 w-2.5 rotate-45 rounded-sm bg-emerald-100/70 shadow-[0_0_10px_rgba(140,240,200,0.7)]" />

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-8 px-6 text-center">
        <EarlyReleaseBanner className="w-full max-w-2xl text-left" compact />

        <div className="intro-glass w-full rounded-[32px] px-6 py-10 sm:px-10 sm:py-12">
          <div className="text-xs uppercase tracking-[0.3em] text-white/70">
            Northern Americana Tech
          </div>
          <div className="relative mt-6 flex items-center justify-center">
            <div aria-hidden className="intro-rainbow-glow absolute inset-0" />
            <h1 className="relative whitespace-nowrap font-pixel text-[clamp(1.25rem,5vw,2.25rem)] text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.6)]">
              /Brooks AI HUB/
            </h1>
          </div>
          <p className="mt-4 text-xs text-white/70 sm:text-sm">
            your digital campfire 🔥 A mobile OS HUB for your ATO apps
          </p>
        </div>

        <Link
          className="intro-start-button rounded-full px-8 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-[#1b0f0f] transition hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          href="/brooks-ai-hub/tutorial"
        >
          Tap to Start
        </Link>

        <button
          className="rounded-full border border-white/30 bg-white/10 px-6 py-2.5 text-xs font-medium uppercase tracking-[0.3em] text-white/90 backdrop-blur-sm transition hover:scale-[1.02] hover:border-white/50 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/50"
          disabled={loading}
          onClick={handleFoundersAccess}
          type="button"
        >
          {loading ? "Loading..." : "Join Founder's Access for $4.99/mo"}
        </button>
      </div>
    </main>
  );
}
