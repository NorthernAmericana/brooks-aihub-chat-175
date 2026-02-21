"use client";

import Link from "next/link";
import { useState } from "react";

type DmCampfireRecoveryPanelProps = {
  campfireName: string;
  dmId: string;
};

export function DmCampfireRecoveryPanel({
  campfireName,
  dmId,
}: DmCampfireRecoveryPanelProps) {
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);

  return (
    <main className="min-h-dvh bg-transparent px-4 py-6 text-[#0f2742] sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl space-y-4 border-4 border-[#0f2742] bg-[#f8f8ef] p-5 font-mono shadow-[0_8px_25px_rgba(15,39,66,0.25)] sm:p-7">
        <h1 className="text-2xl font-bold sm:text-3xl">This temporary DM campfire burned out.</h1>
        <p className="text-sm sm:text-base">
          <span className="font-bold">{campfireName}</span> has reached 00:00:00 and is no longer active.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex items-center justify-center border-2 border-[#0f2742] bg-[#123257] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSendingRequest}
            onClick={async () => {
              setIsSendingRequest(true);
              setRequestStatus(null);

              const response = await fetch("/api/notifications/dm-host-request", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ dmId }),
              }).catch(() => null);

              if (!response?.ok) {
                setRequestStatus("Unable to send host request right now.");
                setIsSendingRequest(false);
                return;
              }

              setRequestStatus("Request sent to host notifications.");
              setIsSendingRequest(false);
            }}
            type="button"
          >
            {isSendingRequest
              ? "Sending request..."
              : "Send host a request for new campfire"}
          </button>
          <Link
            className="inline-flex items-center justify-center border-2 border-[#0f2742] bg-[#1f5f2a] px-4 py-2 text-sm font-bold text-white"
            href="/commons/create?mode=dm"
          >
            Host your own campfire
          </Link>
        </div>

        {requestStatus ? <p className="text-xs text-[#123257]">{requestStatus}</p> : null}

        <Link className="text-sm text-[#123257] underline" href="/">
          Return to Brooks AI HUB homescreen
        </Link>
      </div>
    </main>
  );
}
