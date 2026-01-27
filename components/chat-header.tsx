"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback, useState } from "react";
import { useWindowSize } from "usehooks-ts";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhoneIcon, PlusIcon } from "./icons";
import { PwaInstallButton } from "./pwa-install-button";
import { toast } from "./toast";
import { useSidebar } from "./ui/sidebar";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";

function PureChatHeader({
  chatId,
  newMemoriesCount = 0,
  routeKey,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  newMemoriesCount?: number;
  routeKey: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [callStep, setCallStep] = useState<"confirm" | "choose">("confirm");
  const [selectedAnimal, setSelectedAnimal] = useState("Brooks Bears");

  const { width: windowWidth } = useWindowSize();
  const memoriesLabel =
    newMemoriesCount > 0 ? `${newMemoriesCount} new memories` : "Memories";
  const normalizedRouteKey = routeKey.toLowerCase();
  const isBrooksBearsRoute =
    normalizedRouteKey.startsWith("brooksbears") ||
    normalizedRouteKey.startsWith("brooks-bears");

  const resetCallDialog = useCallback(() => {
    setCallStep("confirm");
    setSelectedAnimal("Brooks Bears");
  }, []);

  return (
    <header className="sticky top-0 flex items-center gap-2 bg-background px-2 py-1.5 md:px-2">
      <SidebarToggle />

      <Button
        asChild
        className="order-1 h-8 px-2 md:order-1 md:h-fit md:px-2"
        variant="outline"
      >
        <Link href="/memories">{memoriesLabel}</Link>
      </Button>

      {(!open || windowWidth < 768) && (
        <Button
          className="order-2 ml-auto h-8 px-2 md:order-2 md:ml-0 md:h-fit md:px-2"
          onClick={() => {
            router.push("/brooks-ai-hub/");
            router.refresh();
          }}
          variant="outline"
        >
          <PlusIcon />
          <span className="md:sr-only">New Chat</span>
        </Button>
      )}

      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          className="order-3 md:order-3"
          selectedVisibilityType={selectedVisibilityType}
        />
      )}

      {isBrooksBearsRoute && (
        <Button
          className="order-4 h-8 px-2 md:h-fit md:px-3"
          onClick={() => {
            setCallDialogOpen(true);
            resetCallDialog();
          }}
          title="Call BrooksBears"
          type="button"
          variant="outline"
        >
          <PhoneIcon />
          <span className="ml-1 text-xs sm:text-sm">Call</span>
        </Button>
      )}

      <PwaInstallButton
        className="order-5 ml-auto h-8 px-2 md:order-5 md:ml-0 md:h-fit"
        label="Install"
        size="sm"
        variant="outline"
      />

      <Dialog
        onOpenChange={(open) => {
          setCallDialogOpen(open);
          if (!open) {
            resetCallDialog();
          }
        }}
        open={callDialogOpen}
      >
        <DialogContent>
          {callStep === "confirm" ? (
            <>
              <DialogHeader>
                <DialogTitle>Call BrooksBears</DialogTitle>
                <DialogDescription>
                  Would you like to call a BrooksBears? Yes or no.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-2">
                <Button
                  onClick={() => setCallDialogOpen(false)}
                  variant="outline"
                >
                  No
                </Button>
                <Button onClick={() => setCallStep("choose")}>Yes</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Choose your BrooksBears call</DialogTitle>
                <DialogDescription>
                  Pick which animal you want to call. You can choose Brooks
                  Bears to reach Benjamin Bear.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <button
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 text-left text-sm transition hover:border-foreground/40 hover:bg-muted/50"
                  onClick={() => setSelectedAnimal("Brooks Bears")}
                  type="button"
                >
                  <span className="font-medium">Brooks Bears</span>
                  <span className="text-xs text-muted-foreground">
                    {selectedAnimal === "Brooks Bears" ? "Selected" : "Select"}
                  </span>
                </button>
                <div className="rounded-lg border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
                  Three versions of Benjamin Bear exist: Brooks AI HUB texting,
                  Brooks AI HUB calling, or the hardware teddy bear itself.
                </div>
              </div>
              <DialogFooter className="mt-2">
                <Button
                  onClick={() => setCallStep("confirm")}
                  variant="outline"
                >
                  Back
                </Button>
                <Button
                  onClick={() => {
                    toast({
                      type: "success",
                      description:
                        "Starting a live-time Brooks Bears call with Benjamin Bear.",
                    });
                    setCallDialogOpen(false);
                  }}
                >
                  Start call
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.newMemoriesCount === nextProps.newMemoriesCount &&
    prevProps.routeKey === nextProps.routeKey &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly
  );
});
