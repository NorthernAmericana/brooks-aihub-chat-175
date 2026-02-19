"use client";

import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const { installMethod, isStandalone, promptInstall } = usePwaInstall();

  if (isStandalone || installMethod === "unavailable") {
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

  if (installMethod !== "prompt") {
    const isIosInstructions = installMethod === "manual-ios";

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button className={className} size={size} variant={variant}>
            {buttonLabel}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install this app</DialogTitle>
            <DialogDescription>
              {isIosInstructions
                ? "Use Safari's Share menu to add this app to your Home Screen."
                : "Use your browser menu to install this app manually."}
            </DialogDescription>
          </DialogHeader>
          <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
            {isIosInstructions ? (
              <>
                <li>Tap the Share button in Safari.</li>
                <li>Select "Add to Home Screen".</li>
                <li>Tap "Add" to finish installation.</li>
              </>
            ) : (
              <>
                <li>Open your browser menu (⋮).</li>
                <li>Select "Install app" or "Add to Home screen".</li>
                <li>Confirm the install prompt.</li>
              </>
            )}
          </ol>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Button
      className={className}
      disabled={isStandalone || installMethod !== "prompt"}
      onClick={handleInstall}
      size={size}
      variant={variant}
    >
      {buttonLabel}
    </Button>
  );
}
