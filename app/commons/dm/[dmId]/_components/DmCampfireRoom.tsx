"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { DmRoomForViewer } from "@/lib/db/commons-queries";

type DmCampfireRoomProps = {
  campfire: DmRoomForViewer["campfire"];
  members: DmRoomForViewer["members"];
  host: DmRoomForViewer["host"];
  access: DmRoomForViewer["access"];
  messages: DmRoomForViewer["messages"];
  campfirePath: string;
};

function getInitials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

export function DmCampfireRoom({
  campfire,
  members,
  host,
  access,
  messages,
  campfirePath,
}: DmCampfireRoomProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const invitedLimit = host?.foundersAccess ? 12 : 4;
  const invitedCount = Math.max(members.length - 1, 0);
  const accessLabel = host?.foundersAccess ? "Founder\'s Access" : "Free Access";

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
      <div className="mx-auto w-full max-w-5xl space-y-5 border-4 border-[#0f2742] bg-[#f8f8ef] p-4 font-mono shadow-[0_8px_25px_rgba(15,39,66,0.25)] sm:p-6">
        <header className="space-y-4 border-b-2 border-[#0f2742] pb-4">
          <div className="inline-flex items-center border-4 border-[#0f2742] bg-[#102744] px-4 py-2 text-lg font-bold text-[#f5b24c] sm:text-2xl">
            /NAT: Commons/
          </div>

          <div className="flex items-center gap-3">
            <span className="text-4xl leading-none">🔥</span>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Campfire {campfire.name}</h1>
              <p className="text-base sm:text-lg">
                Members {invitedCount}/{invitedLimit} {accessLabel}
              </p>
            </div>
          </div>
        </header>

        <section className="space-y-3 border-2 border-[#0f2742] bg-[#f4f2e8] p-3">
          {messages.length > 0 ? (
            messages.map((message, index) => {
              const previousMessage = messages[index - 1];
              const isGrouped = previousMessage?.authorId === message.authorId;

              if (isGrouped) {
                return (
                  <div
                    className="border border-[#0f2742] bg-white px-3 py-2 text-sm sm:text-base"
                    key={message.id}
                  >
                    <span className="font-bold">{message.authorEmail}</span> -&gt; {message.body}
                  </div>
                );
              }

              return (
                <article className="flex gap-3" key={message.id}>
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center border-2 border-[#0f2742] bg-[#e5ebf2] text-lg font-bold">
                    {getInitials(message.authorEmail)}
                  </div>
                  <div className="flex-1 border-2 border-[#0f2742] bg-white px-3 py-2">
                    <p className="font-bold">{message.authorEmail}</p>
                    <p className="whitespace-pre-wrap">{message.body}</p>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="border border-dashed border-[#0f2742] bg-white px-3 py-5 text-sm">
              No messages yet. Start the campfire conversation.
            </p>
          )}
        </section>

        <section className="space-y-2 border-t-2 border-[#0f2742] pt-3">
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
          {!access.canWrite ? (
            <p className="text-xs">Read-only access: you can view messages but cannot write.</p>
          ) : null}
          {errorMessage ? <p className="text-xs text-red-700">{errorMessage}</p> : null}
        </section>
      </div>
    </main>
  );
}
