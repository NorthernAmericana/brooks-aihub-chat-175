"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BirthdayResponse = {
  birthday: string | null;
};

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const BirthdaySettingsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [birthdayInput, setBirthdayInput] = useState("");
  const [savedBirthday, setSavedBirthday] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadBirthday = async () => {
      try {
        const response = await fetch("/api/user-birthday");
        if (!response.ok) {
          throw new Error("Failed to load birthday.");
        }
        const data = (await response.json()) as BirthdayResponse;
        setSavedBirthday(data.birthday ?? null);
        if (data.birthday && ISO_DATE_REGEX.test(data.birthday)) {
          setBirthdayInput(data.birthday);
        }
      } catch (error) {
        console.error(error);
        toast.error("Unable to load birthday.");
      }
    };

    void loadBirthday();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const response = await fetch("/api/user-birthday", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthday: birthdayInput ? birthdayInput : null,
        }),
      });

      const data = (await response.json()) as BirthdayResponse;

      if (!response.ok) {
        throw new Error("Unable to save birthday.");
      }

      setSavedBirthday(data.birthday ?? null);
      setStatusMessage("Birthday saved.");
      toast.success("Birthday saved.");
    } catch (error) {
      console.error(error);
      setStatusMessage("Unable to save birthday. Please try again.");
      toast.error("Unable to save birthday.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">Birthday</p>
          <p className="text-xs text-muted-foreground">
            Add your birthday to personalize your celebrations.
          </p>
        </div>
        <Button
          onClick={() => setIsOpen((previous) => !previous)}
          size="sm"
          variant="outline"
        >
          add your birthday 🎂
        </Button>
      </div>

      {savedBirthday ? (
        <p className="text-xs text-muted-foreground">
          Saved birthday: <span className="font-medium">{savedBirthday}</span>
        </p>
      ) : null}

      {isOpen ? (
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="birthday-input">Birthday</Label>
            <Input
              id="birthday-input"
              onChange={(event) => setBirthdayInput(event.target.value)}
              type="date"
              value={birthdayInput}
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll store your birthday in YYYY-MM-DD format.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button disabled={isSaving} size="sm" type="submit">
              {isSaving ? "Saving..." : "Save birthday"}
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              size="sm"
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            {statusMessage ? (
              <span className="text-xs text-muted-foreground">
                {statusMessage}
              </span>
            ) : null}
          </div>
        </form>
      ) : null}
    </div>
  );
};
