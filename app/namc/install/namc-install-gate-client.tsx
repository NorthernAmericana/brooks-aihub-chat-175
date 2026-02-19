"use client";

import { useEffect } from "react";

const NAMC_PWA_URL = "https://www.northernamericana.media";

export function NamcInstallGateClient() {
  useEffect(() => {
    let isMounted = true;

    const markOpenedAndRedirect = async () => {
      try {
        await fetch("/api/namc/install-gate-state", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "opened" }),
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
