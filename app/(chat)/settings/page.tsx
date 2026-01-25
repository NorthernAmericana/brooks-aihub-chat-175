import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { AtoSettingsPanel } from "@/components/ato-settings-panel";
import { VoiceSettingsPanel } from "@/components/voice-settings-panel";
import {
  getChatsByUserId,
  getUnofficialAtosByOwner,
  getUserById,
} from "@/lib/db/queries";

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

  const [atos, user] = await Promise.all([
    getUnofficialAtosByOwner({ ownerUserId: session.user.id }),
    getUserById({ id: session.user.id }),
  ]);
  const maxFileCount = user?.foundersAccess ? 10 : 5;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="font-semibold text-2xl">Chat Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure voice playback and tool access for your chats.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-semibold text-lg">NAMC Voice Options</h2>
          <p className="text-sm text-muted-foreground">
            Bruce NAMC is the default voice for NAMC chats. You can switch to
            Selena NAMC using the settings below or the three-dot menu in any
            NAMC chat.
          </p>
        </div>

        <VoiceSettingsPanel chats={chats} />
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-semibold text-lg">Unofficial ATO Tool Access</h2>
          <p className="text-sm text-muted-foreground">
            Manage web and file search availability for your unofficial ATO
            chats.
          </p>
        </div>

        <AtoSettingsPanel atos={atos} maxFileCount={maxFileCount} />
      </section>
    </div>
  );
}
