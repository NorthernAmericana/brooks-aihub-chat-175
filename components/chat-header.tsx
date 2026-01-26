"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useMemo, useState } from "react";
import { useWindowSize } from "usehooks-ts";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/toast";
import { getRouteKey } from "@/lib/voice";
import { PhoneIcon, PlusIcon } from "./icons";
import { PwaInstallButton } from "./pwa-install-button";
import { useSidebar } from "./ui/sidebar";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";

function PureChatHeader({
  chatId,
  newMemoriesCount = 0,
  selectedVisibilityType,
  isReadonly,
  routeKey,
  chatTitle,
}: {
  chatId: string;
  newMemoriesCount?: number;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  routeKey?: string | null;
  chatTitle?: string;
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const [showCallPrompt, setShowCallPrompt] = useState(false);
  const [callStep, setCallStep] = useState<"animal" | "version" | null>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);

  const { width: windowWidth } = useWindowSize();
  const memoriesLabel =
    newMemoriesCount > 0 ? `${newMemoriesCount} new memories` : "Memories";

  const resolvedRouteKey = useMemo(
    () => routeKey ?? (chatTitle ? getRouteKey(chatTitle) : null),
    [chatTitle, routeKey]
  );

  const isBrooksBearsRoute = useMemo(() => {
    const normalizedRoute = resolvedRouteKey?.toLowerCase();
    return (
      normalizedRoute === "brooks-bears" ||
      normalizedRoute === "brooksbears" ||
      normalizedRoute === "brooks-bears-benjamin"
    );
  }, [resolvedRouteKey]);

  const resetCallFlow = () => {
    setCallStep(null);
    setSelectedAnimal(null);
  };

  const handleCallSelection = (version: string) => {
    const base = selectedAnimal ?? "Brooks Bears";
    const messageByVersion: Record<string, string> = {
      "Brooks AI HUB texting": `Switching to ${base} — Benjamin Bear (Brooks AI HUB texting).`,
      "Brooks AI HUB calling": `Starting live-time interruptible call with ${base} — Benjamin Bear (Brooks AI HUB calling).`,
      "Hardware teddy bear": `Connecting to the hardware teddy bear for ${base}.`,
    };
    toast({
      type: "success",
      description: messageByVersion[version] ?? `Starting ${base} call.`,
    });
    resetCallFlow();
  };

  return (
    <>
      <header className="sticky top-0 flex items-center gap-2 bg-background px-2 py-1.5 md:px-2">
        <SidebarToggle />

        <Button
          asChild
          className="order-1 h-8 px-2 md:order-1 md:h-fit md:px-2"
          variant="outline"
        >
          <Link href="/memories">{memoriesLabel}</Link>
        </Button>

        {isBrooksBearsRoute && !isReadonly ? (
          <Button
            className="order-2 h-8 px-2 md:order-2 md:h-fit md:px-2"
            onClick={() => setShowCallPrompt(true)}
            variant="outline"
          >
            <PhoneIcon />
            <span className="ml-1 hidden text-xs sm:inline">Call</span>
          </Button>
        ) : null}

        {(!open || windowWidth < 768) && (
          <Button
            className="order-3 ml-auto h-8 px-2 md:order-3 md:ml-0 md:h-fit md:px-2"
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
            className="order-4 md:order-4"
            selectedVisibilityType={selectedVisibilityType}
          />
        )}

        <PwaInstallButton
          className="order-5 ml-auto h-8 px-2 md:order-5 md:ml-0 md:h-fit"
          label="Install"
          size="sm"
          variant="outline"
        />
      </header>

      <AlertDialog onOpenChange={setShowCallPrompt} open={showCallPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Call BrooksBears</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to call a BrooksBears? Yes or no.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowCallPrompt(false);
                setCallStep("animal");
              }}
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            resetCallFlow();
          }
        }}
        open={callStep !== null}
      >
        <DialogContent>
          {callStep === "animal" ? (
            <>
              <DialogHeader>
                <DialogTitle>Pick which animal</DialogTitle>
                <DialogDescription>
                  Choose who you want to call from BrooksBears.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    setSelectedAnimal("Brooks Bears");
                    setCallStep("version");
                  }}
                  variant="secondary"
                >
                  Brooks Bears
                </Button>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Choose Benjamin Bear version</DialogTitle>
                <DialogDescription>
                  There are three versions of Benjamin Bear: Brooks AI HUB
                  texting, Brooks AI HUB calling, or the hardware teddy bear
                  itself.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => handleCallSelection("Brooks AI HUB texting")}
                  variant="secondary"
                >
                  Brooks AI HUB texting
                </Button>
                <Button
                  onClick={() => handleCallSelection("Brooks AI HUB calling")}
                  variant="secondary"
                >
                  Brooks AI HUB calling
                </Button>
                <Button
                  onClick={() => handleCallSelection("Hardware teddy bear")}
                  variant="secondary"
                >
                  Hardware teddy bear
                </Button>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.newMemoriesCount === nextProps.newMemoriesCount &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly &&
    prevProps.routeKey === nextProps.routeKey
  );
});
