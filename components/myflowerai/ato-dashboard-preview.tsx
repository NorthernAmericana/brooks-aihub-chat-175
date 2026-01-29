import { Camera, Flame, LineChart, Sparkles } from "lucide-react";
import Image from "next/image";

const strainEntries = [
  { id: "purple-haze", name: "Purple Haze", amount: "+2g" },
  { id: "og-kush", name: "OG Kush", amount: "+1.5g" },
];

const moodTags = ["Calm", "Creative", "Focused", "Relaxed", "Sleepy", "Balanced"];

const featureTiles = [
  {
    id: "connect",
    title: "Connect to /MyFlowerAI/",
    description:
      "Route check-ins to the MyFlowerAI agentic AI for journaling and guidance.",
    icon: Sparkles,
    accent: "text-rose-200",
  },
  {
    id: "tracking",
    title: "Visualize tracking behavior",
    description:
      "Review dose, method, and mood trends across sessions for harm reduction.",
    icon: LineChart,
    accent: "text-pink-200",
  },
  {
    id: "capture",
    title: "Capture strain + method",
    description:
      "Take photos of flower, gear, and setup to compare effects over time.",
    icon: Camera,
    accent: "text-amber-200",
  },
];

export function MyFlowerAIDashboardPreview() {
  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="flex justify-center">
        <div className="w-full max-w-sm">
          <div className="relative aspect-[9/16] overflow-hidden rounded-[36px] border border-white/15 bg-white/5 p-4 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-xl bg-white/10">
                  <Image
                    alt="MyFlowerAI icon"
                    height={28}
                    src="/icons/myflowerai-appicon.png"
                    width={28}
                  />
                </div>
                <span className="text-sm font-semibold text-white">
                  MyFlowerAI
                </span>
              </div>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] text-white/70">
                1 Strain
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Used today</span>
                    <Flame className="h-3 w-3 text-rose-200" />
                  </div>
                  <div className="mt-1 text-lg font-semibold text-white">
                    3.5g / 5.0g
                  </div>
                  <div className="mt-3 flex items-center justify-center">
                    <div className="relative h-12 w-12 rounded-full border-4 border-rose-400/50">
                      <div className="absolute inset-2 rounded-full border-2 border-rose-200/50" />
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-white/60">Strains used</div>
                  <div className="mt-2 space-y-1 text-xs text-white/70">
                    {strainEntries.map((entry) => (
                      <div
                        className="flex items-center justify-between"
                        key={entry.id}
                      >
                        <span>{entry.name}</span>
                        <span className="text-white/60">{entry.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-white/60">Mood & effects</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {moodTags.map((tag) => (
                    <span
                      className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] text-white/70"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Recently logged</span>
                  <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
                    12:42 PM
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 text-[10px] text-white/50">
                    Photo
                  </div>
                  <div>
                    <div className="text-sm text-white">Sativa joint</div>
                    <div className="text-xs text-white/60">
                      Method: joint - Dose 0.4g
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <Sparkles className="h-3 w-3 text-rose-200" />
                  AI insights & feedback
                </div>
                <p className="mt-2 text-xs text-white/70">
                  Balance daytime creativity with smaller evening doses for
                  gentler sleep and recovery.
                </p>
              </div>

              <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-3">
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <Camera className="h-3 w-3 text-white/70" />
                  Add a strain or gear photo
                </div>
                <p className="mt-2 text-xs text-white/60">
                  Tag flower, carts, or tools with your session notes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {featureTiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <div
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
              key={tile.id}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                  <Icon className={`h-5 w-5 ${tile.accent}`} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {tile.title}
                  </h4>
                  <p className="mt-1 text-xs text-white/70">
                    {tile.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
