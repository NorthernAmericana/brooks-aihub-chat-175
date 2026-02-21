import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { NotificationsFeed } from "./_components/notifications-feed";

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?next=/notifications");
  }

  return (
    <main className="min-h-dvh bg-transparent px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-900/20 bg-sky-50/80 p-4 shadow-[0_15px_45px_rgba(10,36,64,0.2)] sm:p-6">
        <header className="mb-4 border-b border-slate-900/15 pb-3">
          <h1 className="text-2xl font-semibold sm:text-3xl">Notifications</h1>
          <p className="text-sm text-slate-600">
            DM requests, reminders, and early AI event nudges appear here.
          </p>
        </header>

        <NotificationsFeed />
      </div>
    </main>
  );
}
