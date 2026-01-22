import Link from "next/link";
import { memo, useMemo, useState } from "react";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import type { Chat } from "@/lib/db/schema";
import { useChatVoiceSettings } from "@/hooks/use-voice-settings";
import {
  getDefaultVoiceId,
  getOfficialVoice,
  getRouteKey,
  getRouteVoiceOptions,
} from "@/lib/voice";
import {
  CheckCircleFillIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  TrashIcon,
} from "./icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  const routeKey = useMemo(() => getRouteKey(chat.title), [chat.title]);
  const officialVoice = useMemo(() => getOfficialVoice(routeKey), [routeKey]);
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const voiceOptions = getRouteVoiceOptions(routeKey);
  const defaultVoiceId = getDefaultVoiceId(routeKey);
  const { selectedVoiceId, setVoiceId } = useChatVoiceSettings(
    chat.id,
    defaultVoiceId
  );

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

      <Dialog open={voiceSettingsOpen} onOpenChange={setVoiceSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Voice Settings</DialogTitle>
            <DialogDescription>
              Voice controls are placeholders for now. Each route keeps its own
              official voice, and you can preview custom AI voices here.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 text-sm">
            <div className="rounded-md border border-border bg-muted/40 p-3">
              <div className="text-xs uppercase text-muted-foreground">
                Route Voice
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="font-medium">
                  {routeKey === "default" ? "General" : `/${routeKey}/`}
                </span>
                <span className="text-muted-foreground">
                  Official voice: {officialVoice}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="font-medium">Speaker (read aloud)</p>
                <p className="text-xs text-muted-foreground">
                  Will read chats using the route voice and adaptive personality.
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  checked={speakerEnabled}
                  className="h-4 w-4 accent-foreground"
                  onChange={(event) => setSpeakerEnabled(event.target.checked)}
                  type="checkbox"
                />
                Enabled
              </label>
            </div>

            <div className="flex flex-col gap-2">
              {voiceOptions.length > 0 ? (
                <>
                  <Label htmlFor={`voice-select-${chat.id}`}>
                    NAMC voice selection
                  </Label>
                  <Select
                    onValueChange={setVoiceId}
                    value={selectedVoiceId}
                  >
                    <SelectTrigger id={`voice-select-${chat.id}`}>
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {voiceOptions.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          {voice.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Used for ElevenLabs playback on /NAMC/ chats.
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Voice selection is only available for /NAMC/ chats right now.
                </p>
              )}
            </div>
          </div>
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
