"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function PwaInstallButton() {
  const { isStandalone, promptInstall } = usePwaInstall();

  if (isStandalone) {
    return null;
  }

  const handleInstall = async () => {
    const result = await promptInstall();

    if (!result.available) {
      toast({
        type: "error",
        description:
          "Install prompt isn't available yet. In Chrome, use the browser menu to install the app.",
      });
      return;
    }

    if (result.outcome === "accepted") {
      toast({
        type: "success",
        description: "Thanks for installing the app!",
      });
    }
  };

  return (
    <Button className="justify-start" onClick={handleInstall} size="sm">
      Install app
    </Button>
  );
}
