"use client";

import { useRouter } from "next/navigation";
import { memo } from "react";
import { useWindowSize } from "usehooks-ts";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "./icons";
import { PwaInstallButton } from "./pwa-install-button";
import { useSidebar } from "./ui/sidebar";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";

function PureChatHeader({
  chatId,
  newMemoriesCount = 0,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  newMemoriesCount?: number;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const router = useRouter();
  const { open } = useSidebar();

  const { width: windowWidth } = useWindowSize();
  const memoriesLabel =
    newMemoriesCount > 0 ? `${newMemoriesCount} new memories` : "Memories";

  return (
    <header className="sticky top-0 flex items-center gap-2 bg-background px-2 py-1.5 md:px-2">
      <SidebarToggle />

      <Button
        className="order-1 h-8 px-2 md:order-1 md:h-fit md:px-2"
        variant="outline"
      >
        {memoriesLabel}
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
    prevProps.newMemoriesCount === nextProps.newMemoriesCount &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly
  );
});
