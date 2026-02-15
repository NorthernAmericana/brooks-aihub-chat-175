"use client";

import { useFormStatus } from "react-dom";

import { LoaderIcon } from "@/components/icons";

import { Button } from "./ui/button";

export function SubmitButton({
  children,
  isRedirecting = false,
}: {
  children: React.ReactNode;
  isRedirecting?: boolean;
}) {
  const { pending } = useFormStatus();
  const isLoading = pending || isRedirecting;

  return (
    <Button
      aria-disabled={isLoading}
      className="relative"
      disabled={isLoading}
      type={pending ? "button" : "submit"}
    >
      {children}

      {isLoading && (
        <span className="absolute right-4 animate-spin">
          <LoaderIcon />
        </span>
      )}

      <output aria-live="polite" className="sr-only">
        {isLoading ? "Loading" : "Submit form"}
      </output>
    </Button>
  );
}
