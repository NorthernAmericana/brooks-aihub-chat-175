import { cookies } from "next/headers";
import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/app/(auth)/auth";

export default function CreateAtoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataStreamProvider>
      <Suspense fallback={<div className="flex h-dvh" />}>
        <SidebarShell>{children}</SidebarShell>
      </Suspense>
    </DataStreamProvider>
  );
}

async function SidebarShell({ children }: { children: React.ReactNode }) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session?.user} />
      <SidebarInset
        className="min-h-0 overflow-y-auto overscroll-contain touch-pan-y"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
