"use client";

import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function RouteChangeModal({
  open,
  onOpenChange,
  currentRoute,
  newRoute,
  draftMessage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRoute: string;
  newRoute: string;
  draftMessage?: string;
}) {
  const router = useRouter();

  const handleConfirm = () => {
    // Create a new chat with the new route and optionally carry over the draft message
    const params = new URLSearchParams();
    if (draftMessage) {
      params.set("query", draftMessage);
    }
    const queryString = params.toString();
    router.push(`/${queryString ? `?${queryString}` : ""}`);
    onOpenChange(false);
  };

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Switch Route?</AlertDialogTitle>
          <AlertDialogDescription>
            You're currently in{" "}
            <span className="font-mono text-primary">/{currentRoute}/</span> but
            trying to use{" "}
            <span className="font-mono text-primary">/{newRoute}/</span>.
            <br />
            <br />
            Would you like to start a new conversation with{" "}
            <span className="font-mono text-primary">/{newRoute}/</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay in /{currentRoute}/</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Start New Chat with /{newRoute}/
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
