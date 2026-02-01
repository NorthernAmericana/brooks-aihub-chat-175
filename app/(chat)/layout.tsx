import { cookies } from "next/headers";
import Script from "next/script";
import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { SwipeGestureProvider } from "@/components/swipe-gesture-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "../(auth)/auth";

// Control page caching: disable for preview (fresh content), 1 hour for production (performance)
export const revalidate = process.env.VERCEL_ENV === "preview" ? 0 : 3600;

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>
        <SwipeGestureProvider>
          <Suspense fallback={<div className="flex h-dvh" />}>
            <SidebarWrapper>{children}</SidebarWrapper>
          </Suspense>
        </SwipeGestureProvider>
      </DataStreamProvider>
    </>
  );
}

async function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session?.user} />
      <SidebarInset className="h-dvh overflow-hidden overscroll-none">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
