export const metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">You&apos;re offline</h1>
      <p className="text-muted-foreground">
        It looks like your connection dropped. Please check your network and try again.
      </p>
    </main>
  );
}
