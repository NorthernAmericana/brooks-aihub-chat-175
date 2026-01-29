"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ALL_VOICES } from "@/lib/voice";

type AtoResponse = {
  ato?: {
    id: string;
    name: string;
    route: string | null;
    description: string | null;
    personalityName: string | null;
    instructions: string | null;
    defaultVoiceId: string | null;
    defaultVoiceLabel: string | null;
    webSearchEnabled: boolean;
    fileSearchEnabled: boolean;
  };
  error?: string;
};

type AtoFile = {
  id: string;
  filename: string;
  blobUrl: string;
  blobPathname: string;
  contentType: string;
  enabled: boolean;
  createdAt: string;
};

type AtoFilesResponse = {
  files?: AtoFile[];
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
  const [atoRoute, setAtoRoute] = useState("");
  const [atoDescription, setAtoDescription] = useState("");
  const [personalityName, setPersonalityName] = useState("");
  const [instructionsText, setInstructionsText] = useState("");
  const [defaultVoiceId, setDefaultVoiceId] = useState(
    ALL_VOICES[0]?.id ?? ""
  );
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [fileSearchEnabled, setFileSearchEnabled] = useState(false);
  const [atoFiles, setAtoFiles] = useState<AtoFile[]>([]);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [filesFeedback, setFilesFeedback] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const [isFilesLoading, setIsFilesLoading] = useState(false);
  const [updatingFiles, setUpdatingFiles] = useState<Record<string, boolean>>(
    {}
  );

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
        setAtoRoute(data.ato.route ?? "");
        setAtoDescription(data.ato.description ?? "");
        setPersonalityName(data.ato.personalityName ?? "");
        setInstructionsText(data.ato.instructions ?? "");
        setDefaultVoiceId(data.ato.defaultVoiceId ?? ALL_VOICES[0]?.id ?? "");
        setWebSearchEnabled(Boolean(data.ato.webSearchEnabled));
        setFileSearchEnabled(Boolean(data.ato.fileSearchEnabled));
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

  useEffect(() => {
    if (!atoId) {
      return;
    }

    let isActive = true;

    const loadFiles = async () => {
      setIsFilesLoading(true);
      setFilesError(null);

      try {
        const response = await fetch(`/api/ato/${atoId}/files`);
        const data = (await response.json()) as AtoFilesResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load file list.");
        }

        if (isActive) {
          setAtoFiles(data.files ?? []);
        }
      } catch (error) {
        console.error(error);
        if (isActive) {
          setFilesError("Unable to load ATO files.");
        }
      } finally {
        if (isActive) {
          setIsFilesLoading(false);
        }
      }
    };

    void loadFiles();

    return () => {
      isActive = false;
    };
  }, [atoId]);

  const handleFileToggle = async (file: AtoFile, enabled: boolean) => {
    if (!atoId) {
      return;
    }

    setFilesFeedback(null);
    setUpdatingFiles((previous) => ({ ...previous, [file.id]: true }));
    setAtoFiles((previous) =>
      previous.map((current) =>
        current.id === file.id ? { ...current, enabled } : current
      )
    );

    try {
      const response = await fetch(`/api/ato/${atoId}/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });

      const data = (await response.json()) as {
        file?: AtoFile;
        error?: string;
      };

      if (!response.ok || !data.file) {
        throw new Error(data.error ?? "Unable to update file setting.");
      }

      setAtoFiles((previous) =>
        previous.map((current) =>
          current.id === data.file?.id ? data.file : current
        )
      );
      setFilesFeedback({
        type: "success",
        message: "File access updated.",
      });
    } catch (error) {
      console.error(error);
      setAtoFiles((previous) =>
        previous.map((current) => (current.id === file.id ? file : current))
      );
      setFilesFeedback({
        type: "error",
        message: "Unable to update file access.",
      });
    } finally {
      setUpdatingFiles((previous) => ({ ...previous, [file.id]: false }));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const selectedVoice =
        ALL_VOICES.find((voice) => voice.id === defaultVoiceId) ?? ALL_VOICES[0];
      const response = await fetch(`/api/ato/${atoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: atoName.trim(),
          route: atoRoute.trim(),
          description: atoDescription || null,
          personalityName: personalityName || null,
          instructions: instructionsText || null,
          defaultVoiceId: selectedVoice?.id ?? null,
          defaultVoiceLabel: selectedVoice?.label ?? null,
          webSearchEnabled,
          fileSearchEnabled,
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
              Review the ATO name, route, and description.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ato-name">ATO name</Label>
              <Input
                id="ato-name"
                onChange={(event) => setAtoName(event.target.value)}
                required
                type="text"
                value={atoName}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ato-route">Slash route</Label>
              <Input
                id="ato-route"
                onChange={(event) => setAtoRoute(event.target.value)}
                required
                type="text"
                value={atoRoute}
              />
              <p className="text-xs text-muted-foreground">
                Keep this route unique to your personal ATOs.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ato-description">Description</Label>
              <Input
                id="ato-description"
                onChange={(event) => setAtoDescription(event.target.value)}
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
            <div className="grid gap-2">
              <Label htmlFor="ato-default-voice">Default voice</Label>
              <Select
                onValueChange={(value) => setDefaultVoiceId(value)}
                value={defaultVoiceId}
              >
                <SelectTrigger id="ato-default-voice">
                  <SelectValue placeholder="Select a default voice" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_VOICES.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This voice is the default starting point for this ATO.
              </p>
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

        <Card>
          <CardHeader>
            <CardTitle>Capabilities</CardTitle>
            <CardDescription>
              Control which tools this ATO can access.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <label className="flex items-start gap-2">
              <input
                checked={webSearchEnabled}
                className="mt-1 h-4 w-4 accent-foreground"
                onChange={(event) => setWebSearchEnabled(event.target.checked)}
                type="checkbox"
              />
              <span>
                Enable web search for this ATO.
                <span className="block text-xs text-muted-foreground">
                  Only available when supported by the model.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input
                checked={fileSearchEnabled}
                className="mt-1 h-4 w-4 accent-foreground"
                onChange={(event) => setFileSearchEnabled(event.target.checked)}
                type="checkbox"
              />
              <span>
                Enable file search uploads for this ATO.
                <span className="block text-xs text-muted-foreground">
                  Upload PDFs in the chat once enabled.
                </span>
              </span>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>File access settings</CardTitle>
            <CardDescription>
              Choose which uploaded files this ATO can use during file search.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {isFilesLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading uploaded files...
              </p>
            ) : filesError ? (
              <p className="text-sm text-destructive">{filesError}</p>
            ) : atoFiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No files uploaded yet.
              </p>
            ) : (
              <ul className="grid gap-3">
                {atoFiles.map((file) => (
                  <li
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                    key={file.id}
                  >
                    <div className="min-w-0">
                      <a
                        className="truncate text-sm font-medium text-foreground underline-offset-4 hover:underline"
                        href={file.blobUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {file.filename}
                      </a>
                      <p className="text-xs text-muted-foreground">
                        {file.contentType} · Uploaded{" "}
                        {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        checked={file.enabled}
                        className="h-4 w-4 accent-foreground"
                        disabled={Boolean(updatingFiles[file.id])}
                        onChange={(event) =>
                          handleFileToggle(file, event.target.checked)
                        }
                        type="checkbox"
                      />
                      Enabled
                    </label>
                  </li>
                ))}
              </ul>
            )}
            {filesFeedback && (
              <div
                aria-live="polite"
                className={`rounded-md border px-3 py-2 text-xs ${
                  filesFeedback.type === "error"
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
                }`}
              >
                {filesFeedback.message}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Changes apply immediately to your unofficial ATO.</p>
            <p>
              File uploads: Free plans allow up to 5 files per ATO; Founders up
              to 10.
            </p>
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
