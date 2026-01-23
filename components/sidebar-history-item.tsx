import Link from "next/link";
import { memo, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import type { Chat } from "@/lib/db/schema";
import {
  getChatRouteKey,
  getDefaultVoice,
  getVoiceOptions,
  type VoiceOption,
} from "@/lib/voice";
import {
  CheckCircleFillIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  TrashIcon,
} from "./icons";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibilityType: chat.visibility,
  });
  const routeKey = useMemo(
    () => getChatRouteKey(chat),
    [chat.routeKey, chat.title]
  );
  const defaultVoice = useMemo(() => getDefaultVoice(routeKey), [routeKey]);
  const voiceOptions = useMemo(() => getVoiceOptions(routeKey), [routeKey]);
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(false);
  
  // Get saved voice from chat or use default
  const savedVoice = useMemo<VoiceOption>(() => {
    if (chat.ttsVoiceId && chat.ttsVoiceLabel) {
      return { id: chat.ttsVoiceId, label: chat.ttsVoiceLabel };
    }
    return defaultVoice;
  }, [chat.ttsVoiceId, chat.ttsVoiceLabel, defaultVoice]);

  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(savedVoice);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    setSelectedVoice(savedVoice);
  }, [savedVoice]);

  const handleApplyVoice = async () => {
    setIsApplying(true);
    try {
      const response = await fetch("/api/chat-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: chat.id,
          ttsEnabled: true,
          ttsVoiceId: selectedVoice.id,
          ttsVoiceLabel: selectedVoice.label,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update voice settings.");
      }

      toast.success("Voice settings applied successfully.");
      setVoiceSettingsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Unable to save voice settings.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)}>
          <span>{chat.title}</span>
        </Link>
      </SidebarMenuButton>

      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="mr-0.5 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" side="bottom">
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={(event) => {
              event.preventDefault();
              setVoiceSettingsOpen(true);
            }}
          >
            <span>Voice Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <ShareIcon />
              <span>Share</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType("private");
                  }}
                >
                  <div className="flex flex-row items-center gap-2">
                    <LockIcon size={12} />
                    <span>Private</span>
                  </div>
                  {visibilityType === "private" ? (
                    <CheckCircleFillIcon />
                  ) : null}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType("public");
                  }}
                >
                  <div className="flex flex-row items-center gap-2">
                    <GlobeIcon />
                    <span>Public</span>
                  </div>
                  {visibilityType === "public" ? <CheckCircleFillIcon /> : null}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
            onSelect={() => onDelete(chat.id)}
          >
            <TrashIcon />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog onOpenChange={setVoiceSettingsOpen} open={voiceSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Voice Settings</DialogTitle>
            <DialogDescription>
              Select the voice for this chat. {routeKey === "namc" 
                ? "NAMC chats use Bruce or Selena voices only." 
                : "This chat uses Daniel voice."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 text-sm">
            <div className="rounded-md border border-border bg-muted/40 p-3">
              <div className="text-xs uppercase text-muted-foreground">
                Route
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="font-medium">
                  {routeKey === "default" ? "General" : `/${routeKey.toUpperCase()}/`}
                </span>
                <span className="text-muted-foreground">
                  Default: {defaultVoice.label}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`voice-select-${chat.id}`}>
                Voice selection
              </Label>
              <Select 
                onValueChange={(value) => {
                  const selected = voiceOptions.find((v) => v.id === value);
                  if (selected) {
                    setSelectedVoice(selected);
                  }
                }} 
                value={selectedVoice.id}
              >
                <SelectTrigger id={`voice-select-${chat.id}`}>
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {voiceOptions.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.label}
                      {voice.id === defaultVoice.id ? " (Default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVoiceSettingsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyVoice}
              disabled={isApplying}
            >
              {isApplying ? "Applying..." : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) {
    return false;
  }
  return true;
});
