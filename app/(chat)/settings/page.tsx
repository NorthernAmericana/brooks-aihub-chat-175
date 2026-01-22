import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { VoiceSettingsPanel } from "@/components/voice-settings-panel";
import { getChatsByUserId } from "@/lib/db/queries";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/guest");
  }

  const { chats } = await getChatsByUserId({
    id: session.user.id,
    limit: 50,
    startingAfter: null,
    endingBefore: null,
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="font-semibold text-2xl">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure voice playback per chat route and assistant.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-semibold text-lg">Voice Options</h2>
          <p className="text-sm text-muted-foreground">
            Each chat keeps its own official route voice, and you can switch to
            any custom AI voice as needed.
          </p>
        </div>
        <VoiceSettingsPanel chats={chats} />
      </section>
    </div>
  );
}
