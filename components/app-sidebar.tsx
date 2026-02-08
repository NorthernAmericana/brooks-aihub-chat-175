"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { PlusIcon } from "@/components/icons";
import { getChatHistoryPaginationKey } from "@/components/chat-history-data";
import { SidebarHistory } from "@/components/sidebar-history";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { PwaInstallButton } from "./pwa-install-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { mutate } = useSWRConfig();
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const { hasInstallPrompt, isStandalone } = usePwaInstall();
  const { data: session } = useSession();
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  const handleDeleteAll = () => {
    const deletePromise = fetch("/api/history", {
      method: "DELETE",
    });

    toast.promise(deletePromise, {
      loading: "Deleting all chats...",
      success: () => {
        mutate(unstable_serialize(getChatHistoryPaginationKey));
        setShowDeleteAllDialog(false);
        router.replace("/brooks-ai-hub/");
        router.refresh();
        return "All chats deleted successfully";
      },
      error: "Failed to delete all chats",
    });
  };

  const handleFoundersAccess = async () => {
    if (!session?.user) {
      toast.error("Please sign in to purchase Founders Access");
      router.push("/login");
      return;
    }

    setLoadingCheckout(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: "price_1SpBht050iAre6ZtPyv42z6s",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout. Please try again.");
      setLoadingCheckout(false);
    }
  };

  return (
    <>
      <Sidebar className="group-data-[side=left]:border-r-0">
        <SidebarHeader>
          <SidebarMenu>
            <div className="flex flex-row items-center justify-between">
              <Link
                className="flex flex-row items-center gap-3"
                href="/brooks-ai-hub/"
                onClick={() => {
                  setOpenMobile(false);
                }}
              >
                <span className="sidebar-glitch group relative flex cursor-pointer items-center rounded-md px-2 py-1 font-semibold text-lg hover:bg-muted">
                  <span
                    aria-hidden
                    className="sidebar-rainbow-symbol absolute -left-4 top-1/2 h-6 w-6 -translate-y-1/2"
                  />
                  <span aria-hidden className="sidebar-glitch-base">
                    /Brooks AI HUB/
                  </span>
                  <span className="sr-only">/Brooks AI HUB/</span>
                </span>
              </Link>
              <div className="flex flex-row gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="h-8 p-1 md:h-fit md:p-2"
                      onClick={() => {
                        setOpenMobile(false);
                        router.push("/brooks-ai-hub/");
                        router.refresh();
                      }}
                      type="button"
                      variant="ghost"
                    >
                      <PlusIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent align="end" className="hidden md:block">
                    New Chat
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="h-px w-full bg-border" />
              <Button
                asChild
                className="justify-start px-2 text-sm"
                size="sm"
                variant="ghost"
              >
                <Link
                  href="/settings"
                  onClick={() => {
                    setOpenMobile(false);
                  }}
                >
                  Settings
                </Link>
              </Button>
              <Button
                asChild
                className="justify-start px-2 text-sm"
                size="sm"
                variant="ghost"
              >
                <Link
                  href="/memories"
                  onClick={() => {
                    setOpenMobile(false);
                  }}
                >
                  Memories
                </Link>
              </Button>
            </div>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarHistory user={user} />
        </SidebarContent>
        <SidebarFooter>
          <div className="flex flex-col gap-2 p-2">
            <Button
              asChild
              className="justify-start"
              size="sm"
              variant="outline"
            >
              <Link
                href="/create-ato/onboarding"
                onClick={() => {
                  setOpenMobile(false);
                }}
              >
                Make your own ATO /.../
              </Link>
            </Button>
            <Button
              className="justify-start"
              disabled={loadingCheckout}
              onClick={handleFoundersAccess}
              size="sm"
              variant="outline"
            >
              {loadingCheckout ? "Loading..." : "Founders Edition • $4.99"}
            </Button>
            {isStandalone ? (
              <div className="rounded-md border border-muted bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                Installed
              </div>
            ) : hasInstallPrompt ? (
              <PwaInstallButton className="justify-start" />
            ) : null}
            {user && <SidebarUserNav user={user} />}
          </div>
        </SidebarFooter>
      </Sidebar>

      <AlertDialog
        onOpenChange={setShowDeleteAllDialog}
        open={showDeleteAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all chats?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all
              your chats and remove them from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll}>
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
