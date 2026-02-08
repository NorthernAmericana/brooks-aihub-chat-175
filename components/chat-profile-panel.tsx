"use client";

import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { useProfileIcon } from "@/hooks/use-profile-icon";
import { PROFILE_ICON_OPTIONS } from "@/lib/profile-icon";
import { DEFAULT_AVATAR_SRC } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ImageWithFallback } from "./ui/image-with-fallback";
import { Button } from "./ui/button";
import { ProfileIconAiModal } from "./profile-icon-ai-modal";
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
  const [isAiOpen, setIsAiOpen] = useState(false);
  const { profileIcon, setProfileIcon } = useProfileIcon();

  const avatarSrc = profileIcon ?? session?.user?.image ?? DEFAULT_AVATAR_SRC;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/70 p-3">
      <div className="flex items-center gap-3">
        <ImageWithFallback
          alt={session?.user?.email ?? "Profile"}
          className="size-full object-cover"
          containerClassName="size-10 overflow-hidden rounded-full"
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <Button
              className="w-full sm:w-auto"
              onClick={() => setIsAiOpen(true)}
              type="button"
            >
              Generate Profile Icon (AI)
            </Button>
            <span className="text-xs text-muted-foreground">
              Describe your icon vibe (optional).
            </span>
          </div>
          <Button
            className="w-full sm:w-auto"
            onClick={() => setIsPickerOpen(true)}
            type="button"
            variant="outline"
          >
            Change Profile Icon
          </Button>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => signOut({ redirectTo: "/" })}
          type="button"
          variant="destructive"
        >
          Sign out
        </Button>
      </div>

      <ProfileIconAiModal
        onOpenChange={setIsAiOpen}
        onUseIcon={(iconSrc) => setProfileIcon(iconSrc)}
        open={isAiOpen}
      />
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
                    <ImageWithFallback
                      alt={option.label}
                      className="h-full w-full object-cover"
                      containerClassName="size-full"
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
