"use client";

import { ArrowLeft, Camera, LineChart, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MyFlowerAIDashboardPreview } from "@/components/myflowerai/ato-dashboard-preview";

const CHAT_BASE_PATH = "/brooks-ai-hub?query=";

const summaryCards = [
  {
    id: "weekly-dose",
    label: "Weekly dose",
    value: "3.5g",
    detail: "tracked across 7 days",
  },
  {
    id: "sessions",
    label: "Sessions logged",
    value: "6",
    detail: "steady tracking cadence",
  },
  {
    id: "top-method",
    label: "Top method",
    value: "Joint",
    detail: "45% of recent logs",
  },
];

const quickActions = [
  {
    id: "check-in",
    title: "Open MyFlowerAI chat",
    description: "Start a harm-reduction check-in with the agentic AI.",
    prompt: "/MyFlowerAI/ I want to check in and log a session.",
    icon: Sparkles,
    accent: "text-rose-200",
  },
  {
    id: "session-log",
    title: "Start a session log",
    description: "Capture dose, method, mood, and intention for today.",
    prompt: "/MyFlowerAI/ Start a new session log for today.",
    icon: LineChart,
    accent: "text-pink-200",
  },
  {
    id: "photo-log",
    title: "Add a photo log",
    description: "Describe your flower, gear, and setup for visual tracking.",
    prompt: "/MyFlowerAI/ I am adding a photo log of my flower and setup.",
    icon: Camera,
    accent: "text-amber-200",
  },
];

const recentSessions = [
  {
    id: "session-1",
    strain: "Purple Haze",
    time: "Today 12:42 PM",
    method: "Joint",
    dose: "0.4g",
    mood: "Creative, relaxed",
  },
  {
    id: "session-2",
    strain: "OG Kush",
    time: "Yesterday 8:10 PM",
    method: "Dry herb vape",
    dose: "0.3g",
    mood: "Calm, sleepy",
  },
];

const buildChatUrl = (prompt: string) =>
  `${CHAT_BASE_PATH}${encodeURIComponent(prompt)}`;

export default function MyFlowerAIPage() {
  const router = useRouter();

  const openChat = (prompt: string) => {
    router.push(buildChatUrl(prompt));
  };

  return (
    <div className="app-page-overlay fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#2b1220] via-[#361325] to-[#1f0e19]">
      <div className="app-page-header sticky top-0 z-10 flex items-center gap-4 border-b border-white/10 bg-[#1f0e19]/90 px-4 py-3 backdrop-blur-sm">
        <button
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
          onClick={() => router.back()}
          type="button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white/10">
            <Image
              alt="MyFlowerAI icon"
              className="h-full w-full object-cover"
              height={36}
              src="/icons/myflowerai-appicon.png"
              width={36}
            />
          </div>
          <div>
            <h1 className="font-pixel text-lg text-white">MyFlowerAI</h1>
            <p className="text-xs text-white/70">Harm-reduction dashboard</p>
          </div>
        </div>
      </div>

      <div className="app-page-content flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                Daily tracking
              </p>
              <h2 className="text-xl font-semibold text-white">
                MyFlowerAI session hub
              </h2>
              <p className="text-sm text-white/60">
                Check in on dose, method, and mood. Route updates to the
                MyFlowerAI agent for warm, non-judgmental guidance.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                onClick={() =>
                  openChat("/MyFlowerAI/ Start a check-in for today.")
                }
                type="button"
              >
                Start check-in
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-rose-500/80 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-500"
                onClick={() =>
                  openChat(
                    "/MyFlowerAI/ Show my weekly dose, method, and mood trends."
                  )
                }
                type="button"
              >
                Ask MyFlowerAI
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {summaryCards.map((card) => (
              <div
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
                key={card.id}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-white/60">{card.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">Live preview</h3>
          <p className="mt-2 text-sm text-white/70">
            The MyFlowerAI ATO app mirrors your tracking dashboard. Use it to
            visualize sessions, add photo notes, and connect to{" "}
            <span className="font-mono">/MyFlowerAI/</span>.
          </p>
          <MyFlowerAIDashboardPreview />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">Quick actions</h3>
          <p className="mt-2 text-sm text-white/70">
            Send structured prompts straight into the MyFlowerAI chat context.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  className="flex w-full flex-col items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-white/20 hover:bg-white/10"
                  key={action.id}
                  onClick={() => openChat(action.prompt)}
                  type="button"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                    <Icon className={`h-5 w-5 ${action.accent}`} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {action.title}
                    </p>
                    <p className="mt-1 text-xs text-white/70">
                      {action.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">Recent sessions</h3>
          <p className="mt-2 text-sm text-white/70">
            Placeholder sessions that will sync once tracking is live.
          </p>
          <div className="mt-4 space-y-3">
            {recentSessions.map((session) => (
              <div
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
                key={session.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {session.strain}
                    </p>
                    <p className="text-xs text-white/60">{session.time}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] text-white/60">
                    {session.method}
                  </span>
                </div>
                <p className="mt-2 text-xs text-white/70">
                  Dose {session.dose} - {session.mood}
                </p>
                <button
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/20"
                  onClick={() =>
                    openChat(
                      `/MyFlowerAI/ Review my ${session.strain} session log.`
                    )
                  }
                  type="button"
                >
                  Ask about this session
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
