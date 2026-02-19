"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export type InstallMethod =
  | "prompt"
  | "manual-ios"
  | "manual-android"
  | "unavailable";

export function usePwaInstall() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const userAgent = window.navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(userAgent);
    const isSafariBrowser =
      /Safari/.test(userAgent) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(userAgent);
    setIsIosSafari(isIosDevice && isSafariBrowser);
    setIsAndroid(/Android/.test(userAgent));

    const updateStandalone = () => {
      const isStandaloneDisplay = window.matchMedia(
        "(display-mode: standalone)"
      ).matches;
      const isIosStandalone =
        "standalone" in window.navigator &&
        Boolean(
          (window.navigator as Navigator & { standalone?: boolean }).standalone
        );
      setIsStandalone(isStandaloneDisplay || isIosStandalone);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      updateStandalone();
    };

    updateStandalone();
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    const displayModeQuery = window.matchMedia("(display-mode: standalone)");
    displayModeQuery.addEventListener("change", updateStandalone);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      displayModeQuery.removeEventListener("change", updateStandalone);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) {
      return { available: false };
    }

    await installPrompt.prompt();
    const choiceResult = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choiceResult.outcome === "accepted") {
      setIsStandalone(true);
    }

    return { available: true, outcome: choiceResult.outcome };
  };

  const installMethod: InstallMethod = isStandalone
    ? "unavailable"
    : installPrompt
      ? "prompt"
      : isIosSafari
        ? "manual-ios"
        : isAndroid
          ? "manual-android"
          : "unavailable";

  return {
    isStandalone,
    hasInstallPrompt: Boolean(installPrompt),
    installMethod,
    promptInstall,
  };
}
