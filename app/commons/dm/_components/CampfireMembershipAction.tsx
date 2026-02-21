"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CampfireMembershipActionProps = {
  campfirePath: string;
  viewerRole: "host" | "member";
  className?: string;
};

export function CampfireMembershipAction({
  campfirePath,
  viewerRole,
  className,
}: CampfireMembershipActionProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actionLabel = viewerRole === "host" ? "Delete campfire" : "Leave campfire";

  async function handleAction() {
    if (isSubmitting) {
      return;
    }

    const confirmed = window.confirm(
      viewerRole === "host"
        ? "Delete this campfire for every member? This action cannot be undone."
        : "Leave this campfire? You will lose access until invited again."
    );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const endpoint =
        viewerRole === "host"
          ? `/api/commons/campfires/${campfirePath}`
          : `/api/commons/campfires/leave/${campfirePath}`;
      const method = viewerRole === "host" ? "DELETE" : "POST";
      const response = await fetch(endpoint, { method });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(payload?.error ?? `Unable to ${actionLabel.toLowerCase()}.`);
        return;
      }

      router.push("/commons/dm");
      router.refresh();
    } catch (_error) {
      setError(`Unable to ${actionLabel.toLowerCase()}.`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        className={className}
        disabled={isSubmitting}
        onClick={handleAction}
        type="button"
      >
        {isSubmitting ? "Working..." : actionLabel}
      </button>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
