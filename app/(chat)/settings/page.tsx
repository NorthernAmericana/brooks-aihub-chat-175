import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { BirthdaySettingsPanel } from "@/components/birthday-settings-panel";
import { ChatHistorySettingsPanel } from "@/components/chat-history-settings-panel";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/guest");
  }

  const isValidUserId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    session.user.id
  );

  if (!isValidUserId) {
    redirect("/api/auth/guest");
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="font-semibold text-2xl">Chat Settings</h1>
        <p className="text-sm text-muted-foreground">
          Keep your birthday on file for personalized celebrations.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-semibold text-lg">Birthday</h2>
          <p className="text-sm text-muted-foreground">
            Keep your birthday on file for personalized celebrations.
          </p>
        </div>

        <BirthdaySettingsPanel />
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-semibold text-lg">Chat History</h2>
          <p className="text-sm text-muted-foreground">
            Delete chat threads only. This will not delete Memories.
          </p>
        </div>

        <ChatHistorySettingsPanel />
      </section>
    </div>
  );
}
