"use client";

import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { useProfileIcon } from "@/hooks/use-profile-icon";
import { PROFILE_ICON_OPTIONS } from "@/lib/profile-icon";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export function ChatProfilePanel() {
  const { data: session } = useSession();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const { profileIcon, setProfileIcon } = useProfileIcon();

  const fallbackEmail = session?.user?.email ?? "user";
  const avatarSrc =
    profileIcon ?? session?.user?.image ?? `https://avatar.vercel.sh/${fallbackEmail}`;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/70 p-3">
      <div className="flex items-center gap-3">
        <Image
          alt={session?.user?.email ?? "Profile"}
          className="size-10 rounded-full"
          height={40}
          src={avatarSrc}
          width={40}
        />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Profile settings</span>
          <span className="text-xs text-muted-foreground">
            {session?.user?.email ?? "Manage your profile"}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          className="w-full sm:w-auto"
          onClick={() => setIsPickerOpen(true)}
          type="button"
          variant="outline"
        >
          Change Profile Icon
        </Button>
        <Button
          className="w-full sm:w-auto"
          onClick={() => signOut({ redirectTo: "/" })}
          type="button"
          variant="destructive"
        >
          Sign out
        </Button>
      </div>

      <Dialog onOpenChange={setIsPickerOpen} open={isPickerOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Choose a profile icon</DialogTitle>
            <DialogDescription>
              Pick an icon to represent you in the app.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {PROFILE_ICON_OPTIONS.map((option) => {
              const isSelected = profileIcon === option.src;
              return (
                <button
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-border/60 bg-background p-3 text-left transition hover:border-border",
                    isSelected && "border-primary/70 bg-primary/5"
                  )}
                  key={option.id}
                  onClick={() => {
                    setProfileIcon(option.src);
                    setIsPickerOpen(false);
                  }}
                  type="button"
                >
                  <div
                    className={cn(
                      "relative size-12 overflow-hidden rounded-full border",
                      isSelected ? "border-primary" : "border-transparent"
                    )}
                  >
                    <Image
                      alt={option.label}
                      className="h-full w-full object-cover"
                      height={48}
                      src={option.src}
                      width={48}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">
                      {option.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isSelected ? "Selected" : "Tap to select"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
