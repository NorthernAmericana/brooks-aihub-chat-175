"use client";

import { useEffect } from "react";
import type { NamcInstallVerificationStatus } from "@/lib/store/namcInstallVerification";

const NAMC_PWA_URL = "https://www.northernamericana.media";

export function NamcInstallGateClient() {
  useEffect(() => {
    let isMounted = true;

    const markOpenedAndRedirect = async () => {
      try {
        const verificationPayload = await collectVerificationSnapshot();
        await fetch("/api/namc/install-gate-state", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "opened",
            ...verificationPayload,
          }),
          keepalive: true,
        });
      } catch (error) {
        console.error("Failed to update NAMC install gate state", error);
      } finally {
        if (isMounted) {
          window.location.replace(NAMC_PWA_URL);
        }
      }
    };

    void markOpenedAndRedirect();

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
}

async function collectVerificationSnapshot(): Promise<{
  verificationStatus: NamcInstallVerificationStatus;
  verificationMethod: string;
  verificationCheckedAt: string;
  verificationDetails: Record<string, unknown>;
}> {
  const details: Record<string, unknown> = {
    displayModeStandalone:
      window.matchMedia?.("(display-mode: standalone)")?.matches ?? false,
  };

  const legacyStandalone =
    typeof navigator === "object" &&
    "standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  details.legacyStandalone = legacyStandalone;

  const relatedAppsGetter = (navigator as Navigator & {
    getInstalledRelatedApps?: () => Promise<unknown[]>;
  }).getInstalledRelatedApps;

  if (typeof relatedAppsGetter === "function") {
    try {
      const relatedApps = await relatedAppsGetter.call(navigator);
      details.relatedAppsCount = relatedApps.length;

      const hasPositiveSignal =
        relatedApps.length > 0 ||
        details.displayModeStandalone === true ||
        legacyStandalone;

      return {
        verificationStatus: hasPositiveSignal ? "installed" : "needs-recheck",
        verificationMethod: "related-apps-api",
        verificationCheckedAt: new Date().toISOString(),
        verificationDetails: details,
      };
    } catch {
      return {
        verificationStatus: "unknown",
        verificationMethod: "related-apps-api-error",
        verificationCheckedAt: new Date().toISOString(),
        verificationDetails: details,
      };
    }
  }

  const hasStandaloneSignal = details.displayModeStandalone === true || legacyStandalone;

  return {
    verificationStatus: hasStandaloneSignal ? "installed" : "unknown",
    verificationMethod: hasStandaloneSignal
      ? "display-mode-standalone"
      : "unsupported-browser",
    verificationCheckedAt: new Date().toISOString(),
    verificationDetails: details,
  };
}
