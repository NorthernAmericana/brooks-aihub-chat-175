import { BrooksBearsVoiceExperience } from "@/components/brooksbears/brooksbears-voice-experience";

export default function BrooksBearsHomePage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#140d12] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.10),transparent_55%)]" />

      <BrooksBearsVoiceExperience className="relative z-10 max-w-md px-6" />
    </main>
  );
}
