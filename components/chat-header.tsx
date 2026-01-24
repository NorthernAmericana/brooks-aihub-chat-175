"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo } from "react";
import { useWindowSize } from "usehooks-ts";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { AtoListPanel } from "./ato-list-panel";
import { CustomAtoSettingsDialog } from "./custom-ato-settings-dialog";
import { PlusIcon } from "./icons";
import { PwaInstallButton } from "./pwa-install-button";
import { useSidebar } from "./ui/sidebar";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";

function PureChatHeader({
  chatId,
  chatRouteKey,
  newMemoriesCount = 0,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  chatRouteKey?: string | null;
  newMemoriesCount?: number;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const router = useRouter();
  const { open } = useSidebar();

  const { width: windowWidth } = useWindowSize();
  const memoriesLabel =
    newMemoriesCount > 0 ? `${newMemoriesCount} new memories` : "Memories";

  // Check if this is a custom ATO by checking if routeKey starts with "custom-"
  const isCustomAto = chatRouteKey?.startsWith("custom-");
  const customAtoId = isCustomAto
    ? chatRouteKey?.replace("custom-", "")
    : undefined;

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

      <AtoListPanel
        onSelectAto={(slash) => {
          router.push(`/brooks-ai-hub/?slash=${slash}`);
        }}
      />

      {isCustomAto && customAtoId && (
        <CustomAtoSettingsDialog
          atoId={customAtoId}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}

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

      <PwaInstallButton
        className="order-4 ml-auto h-8 px-2 md:order-4 md:ml-0 md:h-fit"
        label="Install"
        size="sm"
        variant="outline"
      />
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.chatRouteKey === nextProps.chatRouteKey &&
    prevProps.newMemoriesCount === nextProps.newMemoriesCount &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly
  );
});
