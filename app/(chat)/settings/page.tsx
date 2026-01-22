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
        <h1 className="font-semibold text-2xl">Voice Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure voice playback for your NAMC chats.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-semibold text-lg">NAMC Voice Options</h2>
          <p className="text-sm text-muted-foreground">
            Bruce NAMC is the default voice for NAMC chats. You can switch to Selena NAMC using the settings below or the three-dot menu in any NAMC chat.
          </p>
        </div>

        <VoiceSettingsPanel chats={chats} />
      </section>
    </div>
  );
}
