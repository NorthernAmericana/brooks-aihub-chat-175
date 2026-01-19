"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast";
import { usePwaInstall } from "@/hooks/use-pwa-install";

type PwaInstallButtonProps = {
  className?: string;
  label?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
};

export function PwaInstallButton({
  className,
  label,
  size = "sm",
  variant = "default",
}: PwaInstallButtonProps) {
  const { isStandalone, promptInstall } = usePwaInstall();

  if (isStandalone) {
    return null;
  }

  const buttonLabel = label ?? "Install app";

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
    <Button
      className={className}
      disabled={isStandalone}
      onClick={handleInstall}
      size={size}
      variant={variant}
    >
      {buttonLabel}
    </Button>
  );
}
