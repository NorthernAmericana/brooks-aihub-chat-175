"use client";

import { ChevronUp } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { useProfileIcon } from "@/hooks/use-profile-icon";
import { guestRegex } from "@/lib/constants";
import { PROFILE_ICON_OPTIONS } from "@/lib/profile-icon";
import { CodeRedemptionDialog } from "./code-redemption-dialog";
import { LoaderIcon } from "./icons";
import { toast } from "./toast";

export function SidebarUserNav({ user }: { user: User }) {
  const router = useRouter();
  const { data, status } = useSession();
  const { setTheme, resolvedTheme } = useTheme();
  const { hasInstallPrompt, isStandalone, promptInstall } = usePwaInstall();
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [showProfilePicker, setShowProfilePicker] = useState(false);
  const { profileIcon, setProfileIcon } = useProfileIcon();

  const isGuest = guestRegex.test(data?.user?.email ?? "");

  const handleInstallApp = async () => {
    const result = await promptInstall();
    if (!result.available) {
      toast({
        type: "error",
        description:
          "Install prompt isn't available yet. In Chrome, use the browser menu to install the app.",
      });
      return;
    }

    if (result.outcome === "accepted") {
      toast({
        type: "success",
        description: "Thanks for installing the app!",
      });
    }
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {status === "loading" ? (
                <SidebarMenuButton className="h-10 justify-between bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <div className="flex flex-row gap-2">
                    <div className="size-6 animate-pulse rounded-full bg-zinc-500/30" />
                    <span className="animate-pulse rounded-md bg-zinc-500/30 text-transparent">
                      Loading auth status
                    </span>
                  </div>
                  <div className="animate-spin text-zinc-500">
                    <LoaderIcon />
                  </div>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  className="h-10 bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  data-testid="user-nav-button"
                >
                  <Image
                    alt={user.email ?? "User Avatar"}
                    className="rounded-full"
                    height={24}
                    src={profileIcon ?? `https://avatar.vercel.sh/${user.email}`}
                    width={24}
                  />
                  <span className="truncate" data-testid="user-email">
                    {isGuest ? "Guest" : user?.email}
                  </span>
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-popper-anchor-width)"
              data-testid="user-nav-menu"
              side="top"
            >
              <DropdownMenuItem
                className="cursor-pointer"
                data-testid="user-nav-item-code"
                onSelect={() => setShowCodeDialog(true)}
              >
                Input code
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                data-testid="user-nav-item-theme"
                onSelect={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
              >
                {`Toggle ${resolvedTheme === "light" ? "dark" : "light"} mode`}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                data-testid="user-nav-item-profile-icon"
                onSelect={() => setShowProfilePicker(true)}
              >
                Change Profile Icon
              </DropdownMenuItem>
              {!isStandalone && hasInstallPrompt && (
                <DropdownMenuItem
                  className="cursor-pointer"
                  data-testid="user-nav-item-install"
                  onSelect={handleInstallApp}
                >
                  Install app
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild data-testid="user-nav-item-auth">
                <button
                  className="w-full cursor-pointer"
                  onClick={() => {
                    if (status === "loading") {
                      toast({
                        type: "error",
                        description:
                          "Checking authentication status, please try again!",
                      });

                      return;
                    }

                    if (isGuest) {
                      router.push("/login");
                    } else {
                      signOut({
                        redirectTo: "/",
                      });
                    }
                  }}
                  type="button"
                >
                  {isGuest ? "Login to your account" : "Sign out"}
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <CodeRedemptionDialog
        onOpenChange={setShowCodeDialog}
        open={showCodeDialog}
      />
      {showProfilePicker && (
        <div className="fixed inset-0 z-50 flex min-h-svh flex-col bg-background/95 px-6 py-8 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Profile Icon
              </p>
              <h2 className="text-2xl font-semibold">Choose your look</h2>
            </div>
            <button
              className="rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
              onClick={() => setShowProfilePicker(false)}
              type="button"
            >
              Close
            </button>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROFILE_ICON_OPTIONS.map((option) => {
              const isSelected = profileIcon === option.src;

              return (
                <button
                  className="group flex flex-col items-center gap-4 rounded-2xl border border-border bg-muted/30 px-4 py-6 text-left transition hover:border-primary hover:bg-muted/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  key={option.id}
                  onClick={() => {
                    setProfileIcon(option.src);
                    setShowProfilePicker(false);
                  }}
                  type="button"
                >
                  <div
                    className={`relative flex size-24 items-center justify-center overflow-hidden rounded-full border-2 ${
                      isSelected ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <Image
                      alt={option.label}
                      className="h-full w-full object-cover"
                      height={96}
                      src={option.src}
                      width={96}
                    />
                  </div>
                  <div className="text-sm font-semibold">{option.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {isSelected ? "Selected" : "Tap to select"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
