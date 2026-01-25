"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AtoResponse = {
  ato?: {
    id: string;
    name: string;
    description: string | null;
    personalityName: string | null;
    instructions: string | null;
  };
  error?: string;
};

export default function EditAtoPage() {
  const params = useParams();
  const atoId = useMemo(() => {
    if (!params?.id) {
      return "";
    }
    return Array.isArray(params.id) ? params.id[0] : params.id;
  }, [params]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [atoName, setAtoName] = useState("");
  const [atoDescription, setAtoDescription] = useState("");
  const [personalityName, setPersonalityName] = useState("");
  const [instructionsText, setInstructionsText] = useState("");

  useEffect(() => {
    if (!atoId) {
      setErrorMessage("Missing ATO id.");
      setIsLoading(false);
      return;
    }

    let isActive = true;

    const loadAto = async () => {
      try {
        const response = await fetch(`/api/ato/${atoId}`);
        const data = (await response.json()) as AtoResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load ATO.");
        }

        if (!isActive || !data.ato) {
          return;
        }

        setAtoName(data.ato.name);
        setAtoDescription(data.ato.description ?? "");
        setPersonalityName(data.ato.personalityName ?? "");
        setInstructionsText(data.ato.instructions ?? "");
      } catch (error) {
        console.error(error);
        if (isActive) {
          setErrorMessage("Unable to load ATO details.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadAto();

    return () => {
      isActive = false;
    };
  }, [atoId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/ato/${atoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalityName: personalityName || null,
          instructions: instructionsText || null,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as AtoResponse;

      if (!response.ok) {
        setErrorMessage(
          typeof data?.error === "string"
            ? data.error
            : "Unable to save ATO updates."
        );
        return;
      }

      setSuccessMessage("ATO updates saved.");
    } catch (error) {
      console.error(error);
      setErrorMessage("Unable to save ATO updates.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="space-y-3">
        <Badge variant="outline">ATO Builder</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">Edit ATO</h1>
          <p className="text-sm text-muted-foreground">
            Update the personality name and instructions for your unofficial
            ATO. The plan-based instruction limits still apply.
          </p>
        </div>
      </header>

      <form className="grid gap-6" onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>ATO details</CardTitle>
            <CardDescription>
              Review the ATO name and description.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ato-name">ATO name</Label>
              <Input id="ato-name" readOnly type="text" value={atoName} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ato-description">Description</Label>
              <Input
                id="ato-description"
                readOnly
                type="text"
                value={atoDescription}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personality settings</CardTitle>
            <CardDescription>
              Adjust the personality name and saved instructions.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="personality-name">
                Personality name (optional)
              </Label>
              <Input
                id="personality-name"
                onChange={(event) => setPersonalityName(event.target.value)}
                placeholder="Example: Sage"
                type="text"
                value={personalityName}
              />
            </div>
            <div className="rounded-md border border-muted bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              This ATO is local-only (like a personal project or chat). Keep the
              settings simple, but feel free to customize the personality and
              instructions to suit your workflow.
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ato-instructions">Instructions</Label>
              <Textarea
                id="ato-instructions"
                onChange={(event) => setInstructionsText(event.target.value)}
                placeholder={
                  "Example:\nThis ATO /.../ is an Autonomous Technological Organism on Brooks AI HUB, using generative agentic AI to help me build my personal app and workspace.\nThis is a private, project-style ATO; guide the user like a personal workspace assistant. Use shared memory context when available.\nKeep responses scoped to this personal project/file and avoid public-facing framing."
                }
                rows={6}
                value={instructionsText}
              />
              <p className="text-xs text-muted-foreground">
                {instructionsText.length} characters. Free plans: ≤ 500;
                Founders: ≤ 999.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Changes apply immediately to your unofficial ATO.</p>
            <p>File uploads: Free plans allow up to 5 files per ATO; Founders up to 10.</p>
          </div>
          <Button disabled={isLoading || isSubmitting} type="submit">
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
        {(errorMessage || successMessage) && (
          <div
            aria-live="polite"
            className={`rounded-md border px-3 py-2 text-sm ${
              errorMessage
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
            }`}
          >
            {errorMessage ?? successMessage}
          </div>
        )}
      </form>
    </div>
  );
}
