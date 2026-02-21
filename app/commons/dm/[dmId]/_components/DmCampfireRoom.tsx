"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DrawPad } from "@/components/commons/dm/DrawPad";
import {
  PRIVATE_MEMBER_LIMIT_DEFAULT,
  PRIVATE_MEMBER_LIMIT_FOUNDER_HOST,
} from "@/lib/commons/constants";
import { formatDmOccupancy } from "@/lib/commons/dm-occupancy";
import type { DmRoomForViewer } from "@/lib/db/commons-queries";
import { CampfireMembershipAction } from "@/app/commons/dm/_components/CampfireMembershipAction";

type DmCampfireRoomProps = {
  roomId: string;
  campfire: DmRoomForViewer["campfire"];
  members: DmRoomForViewer["members"];
  host: DmRoomForViewer["host"];
  access: DmRoomForViewer["access"];
  messages: DmRoomForViewer["messages"];
  campfirePath: string;
  viewerUserId: string;
  expiresAt: string | null;
};

type ParsedMessage =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image";
      imageUrl: string;
      text: string;
    };

function getInitials(label: string): string {
  const alphanumeric = label.replace(/[^a-zA-Z0-9]/g, "");
  return (alphanumeric.slice(0, 2) || "??").toUpperCase();
}

function getDisplayName(publicNickname: string | null, email: string): string {
  return publicNickname?.trim() || email;
}

function parseMessage(body: string): ParsedMessage {
  const trimmed = body.trim();
  const markdownImageMatch = trimmed.match(/^!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)\s*(.*)$/i);

  if (markdownImageMatch) {
    return {
      type: "image",
      imageUrl: markdownImageMatch[1],
      text: markdownImageMatch[2]?.trim() ?? "",
    };
  }

  const lines = trimmed.split("\n");
  const firstLine = lines[0] ?? "";
  if (/^https?:\/\/.+\.(png|jpe?g|gif|webp|avif)(\?.*)?$/i.test(firstLine)) {
    return {
      type: "image",
      imageUrl: firstLine,
      text: lines.slice(1).join("\n").trim(),
    };
  }

  return {
    type: "text",
    text: body,
  };
}

function formatCountdown(millisecondsRemaining: number): string {
  if (millisecondsRemaining <= 0) {
    return "00:00:00";
  }

  const totalSeconds = Math.floor(millisecondsRemaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  if (days > 0) {
    return `${days}d ${hh}:${mm}:${ss}`;
  }

  return `${hh}:${mm}:${ss}`;
}

export function DmCampfireRoom({
  roomId,
  campfire,
  members,
  host,
  access,
  messages,
  campfirePath,
  viewerUserId,
  expiresAt,
}: DmCampfireRoomProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSwitched, setIsSwitched] = useState(false);
  const [isDrawPadCollapsed, setIsDrawPadCollapsed] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!expiresAt) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [expiresAt]);

  const memberLimit = host?.foundersAccess
    ? PRIVATE_MEMBER_LIMIT_FOUNDER_HOST
    : PRIVATE_MEMBER_LIMIT_DEFAULT;
  const memberCount = members.length;
  const accessLabel = host?.foundersAccess ? "Founder\'s Access" : "Free Access";
  const viewerRole =
    members.find((member) => member.userId === viewerUserId)?.role === "host"
      ? "host"
      : "member";

  const parsedMessages = useMemo(
    () => messages.map((message) => ({ ...message, parsed: parseMessage(message.body) })),
    [messages]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!access.canWrite || isSending) {
      return;
    }

    const trimmedBody = body.trim();

    if (!trimmedBody) {
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/commons/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campfirePath,
          title: "Message",
          body: trimmedBody,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to send message.");
      }

      setBody("");
      router.refresh();
    } catch (_error) {
      setErrorMessage("Could not send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="min-h-dvh bg-transparent px-4 py-6 text-[#0f2742] sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl space-y-5 border-4 border-[#0f2742] bg-[#f8f8ef] p-4 font-mono shadow-[0_8px_25px_rgba(15,39,66,0.25)] sm:p-6">
        <header className="space-y-4 border-b-2 border-[#0f2742] pb-4">
          <div className="inline-flex items-center border-4 border-[#0f2742] bg-[#102744] px-4 py-2 text-lg font-bold text-[#f5b24c] sm:text-2xl">
            /NAT: Commons/
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl leading-none">🔥</span>
              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">{campfire.name}</h1>
                <p className="text-base sm:text-lg">
                  {formatDmOccupancy(memberCount, memberLimit)} {accessLabel}
                </p>
                {expiresAt ? (
                  <p className="mt-1 text-sm font-bold text-[#7a1313] sm:text-base">
                    Temporary campfire ends in {formatCountdown(new Date(expiresAt).getTime() - now)}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CampfireMembershipAction
                campfirePath={campfirePath}
                className="border-2 border-[#7a1313] bg-[#a31f1f] px-4 py-2 text-xs font-bold tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-60"
                viewerRole={viewerRole}
              />
              <button
                className="border-2 border-[#0f2742] bg-[#123257] px-4 py-2 text-sm font-bold tracking-wide text-white"
                onClick={() => setIsSwitched((value) => !value)}
                type="button"
              >
                SWITCH
              </button>
            </div>
          </div>
        </header>

        <section className="flex min-h-[32rem] flex-col gap-3 md:flex-row">
          <div
            className={`flex min-h-[20rem] flex-col border-2 border-[#0f2742] bg-[#f4f2e8] p-3 ${
              isDrawPadCollapsed ? "basis-full" : "md:basis-1/2"
            } ${isSwitched ? "order-2" : "order-1"}`}
          >
            <div className="space-y-3 overflow-y-auto pr-1">
              {parsedMessages.length > 0 ? (
                parsedMessages.map((message) => {
                  const parsed = message.parsed;

                  return (
                    <article className="flex gap-3" key={message.id}>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-[#0f2742] bg-[#e5ebf2] text-sm font-bold sm:h-14 sm:w-14 sm:text-lg">
                        {getInitials(getDisplayName(message.authorPublicNickname, message.authorEmail))}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-bold uppercase tracking-wide">
                          {getDisplayName(message.authorPublicNickname, message.authorEmail)}
                        </p>
                        {message.authorPublicNickname && message.authorId === viewerUserId ? (
                          <p className="text-[10px] text-slate-600">{message.authorEmail}</p>
                        ) : null}
                        <div className="space-y-2 border-2 border-[#0f2742] bg-white px-3 py-2">
                          {parsed.type === "image" ? (
                            <>
                              <button
                                className="block w-full overflow-hidden border border-[#0f2742]"
                                onClick={() => setLightboxImage(parsed.imageUrl)}
                                type="button"
                              >
                                <Image
                                  alt="Draw pad attachment"
                                  className="h-auto w-full object-cover"
                                  height={320}
                                  src={parsed.imageUrl}
                                  unoptimized
                                  width={320}
                                />
                              </button>
                              {parsed.text ? (
                                <p className="whitespace-pre-wrap text-sm">{parsed.text}</p>
                              ) : null}
                            </>
                          ) : (
                            <p className="whitespace-pre-wrap text-sm">{parsed.text}</p>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <p className="border border-dashed border-[#0f2742] bg-white px-3 py-5 text-sm">
                  No messages yet. Start the campfire conversation.
                </p>
              )}
            </div>

            <section className="mt-3 space-y-2 border-t-2 border-[#0f2742] pt-3">
              <form className="flex gap-2" onSubmit={handleSubmit}>
                <input
                  className="min-w-0 flex-1 border-2 border-[#0f2742] bg-white px-3 py-2 text-base outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:bg-slate-200"
                  disabled={!access.canWrite || isSending}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="type message..."
                  value={body}
                />
                <button
                  className="border-2 border-[#0f2742] bg-[#123257] px-4 py-2 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!access.canWrite || isSending || body.trim().length === 0}
                  type="submit"
                >
                  Send
                </button>
              </form>
              <p className="text-xs">
                Tip: paste an image URL on the first line (or use markdown image syntax) for a draw pad
                attachment bubble.
              </p>
              {!access.canWrite ? (
                <p className="text-xs">Read-only access: you can view messages but cannot write.</p>
              ) : null}
              {errorMessage ? <p className="text-xs text-red-700">{errorMessage}</p> : null}
            </section>
          </div>

          <div
            className={`border-2 border-[#0f2742] bg-[#e8edf4] ${isSwitched ? "order-1" : "order-2"} ${
              isDrawPadCollapsed
                ? "flex items-center justify-center bg-[#123257] px-2 py-3 text-center text-white md:basis-auto"
                : "flex min-h-[20rem] flex-col p-4 md:basis-1/2"
            }`}
          >
            {isDrawPadCollapsed ? (
              <button
                className="w-full border-2 border-[#f5b24c] bg-[#102744] px-3 py-2 text-sm font-bold tracking-wide"
                onClick={() => setIsDrawPadCollapsed(false)}
                type="button"
              >
                Show Draw Pad
              </button>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between border-b-2 border-[#0f2742] pb-2">
                  <h2 className="text-lg font-bold">Draw Pad</h2>
                  <button
                    className="border-2 border-[#0f2742] bg-white px-3 py-1 text-xs font-bold"
                    onClick={() => setIsDrawPadCollapsed(true)}
                    type="button"
                  >
                    Collapse
                  </button>
                </div>
                <DrawPad canWrite={access.canWrite} onSent={() => router.refresh()} roomId={roomId} />
              </>
            )}
          </div>
        </section>
      </div>

      {lightboxImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2742]/80 p-4"
          onClick={() => setLightboxImage(null)}
          role="button"
          tabIndex={0}
        >
          <div className="max-h-full max-w-4xl overflow-hidden border-4 border-[#f5b24c] bg-black">
            <Image
              alt="Expanded draw pad attachment"
              className="h-auto max-h-[85vh] w-auto max-w-full"
              height={900}
              src={lightboxImage}
              unoptimized
              width={900}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
