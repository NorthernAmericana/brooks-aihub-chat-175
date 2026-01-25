"use client";

import { useState } from "react";
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

export default function CreateAtoPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState(
    ALL_VOICES[0]?.id ?? ""
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("ato-name") ?? "").trim();
    const route = String(formData.get("ato-route") ?? "").trim();
    const description = String(formData.get("ato-tagline") ?? "").trim();
    const tone = String(formData.get("ato-tone") ?? "").trim();
    const boundaries = String(formData.get("ato-boundaries") ?? "").trim();
    const intro = String(formData.get("ato-intro") ?? "").trim();
    const tools = String(formData.get("ato-tools") ?? "").trim();
    const memory = String(formData.get("ato-memory") ?? "").trim();
    const audience = String(formData.get("ato-audience") ?? "").trim();
    const webSearchEnabled = formData.get("ato-web-search") === "on";
    const fileSearchEnabled = formData.get("ato-file-search") === "on";
    const selectedVoice =
      ALL_VOICES.find((voice) => voice.id === selectedVoiceId) ??
      ALL_VOICES[0];

    const instructionsParts = [
      route ? `Slash route: ${route}` : null,
      tone ? `Tone & voice: ${tone}` : null,
      boundaries ? `Safety boundaries: ${boundaries}` : null,
      intro ? `Welcome message: ${intro}` : null,
      tools ? `Preferred tools: ${tools}` : null,
      memory ? `Memory preference: ${memory}` : null,
      audience ? `Target audience: ${audience}` : null,
    ].filter((part): part is string => Boolean(part));

    const instructions =
      instructionsParts.length > 0 ? instructionsParts.join("\n") : null;

    try {
      const response = await fetch("/api/ato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          personalityName: tone || null,
          instructions,
          defaultVoiceId: selectedVoice?.id ?? null,
          defaultVoiceLabel: selectedVoice?.label ?? null,
          webSearchEnabled,
          fileSearchEnabled,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(
          typeof data?.error === "string"
            ? data.error
            : "Something went wrong while submitting your ATO."
        );
        return;
      }

      setSuccessMessage("ATO request submitted successfully.");
      event.currentTarget.reset();
      setSelectedVoiceId(ALL_VOICES[0]?.id ?? "");
    } catch (_error) {
      setErrorMessage("Unable to submit your ATO request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="space-y-3">
        <Badge variant="outline">ATO Builder</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">
            Make your own ATO /.../
          </h1>
          <p className="text-sm text-muted-foreground">
            Create your own ATO by defining the slash route, personality, and
            capabilities you want to launch inside Brooks AI HUB.
          </p>
          <div className="rounded-lg border border-muted bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Submission limits</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              <li>Free: up to 3 total unofficial ATOs, instructions ≤ 500.</li>
              <li>
                Founders: up to 10 unofficial ATOs per month, instructions ≤
                999.
              </li>
            </ul>
          </div>
        </div>
      </header>

      <form className="grid gap-6" onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>ATO basics</CardTitle>
            <CardDescription>
              Share the name and slash route users will type to reach your ATO.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ato-name">ATO name</Label>
              <Input
                id="ato-name"
                name="ato-name"
                placeholder="Example: My Wellness ATO"
                type="text"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ato-route">Slash route</Label>
              <Input
                id="ato-route"
                name="ato-route"
                placeholder="/MyWellnessATO/"
                type="text"
              />
              <p className="text-xs text-muted-foreground">
                Use PascalCase or camelCase so it matches existing ATO routes.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ato-tagline">One-line purpose</Label>
              <Input
                id="ato-tagline"
                name="ato-tagline"
                placeholder="A mindful daily companion for routines and habits."
                type="text"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personality + behavior</CardTitle>
            <CardDescription>
              Describe the tone, boundaries, and how the ATO should communicate.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ato-tone">Tone & voice</Label>
              <Input
                id="ato-tone"
                name="ato-tone"
                placeholder="Supportive, energetic, and concise."
                type="text"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ato-voice">Default voice</Label>
              <Select
                onValueChange={(value) => setSelectedVoiceId(value)}
                value={selectedVoiceId}
              >
                <SelectTrigger id="ato-voice">
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
                This voice will be the starting default for your unofficial ATO.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ato-boundaries">Safety boundaries</Label>
              <Textarea
                id="ato-boundaries"
                name="ato-boundaries"
                placeholder="List topics to avoid, escalation rules, or compliance needs."
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ato-intro">Welcome message</Label>
              <Textarea
                id="ato-intro"
                name="ato-intro"
                placeholder="Hey there! I'm your wellness ATO — tell me what you want to improve today."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capabilities</CardTitle>
            <CardDescription>
              Select what your ATO can access and how it handles memory.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ato-tools">Preferred tools</Label>
              <Textarea
                id="ato-tools"
                name="ato-tools"
                placeholder="Example: Calendar reminders, travel routing, weather summaries."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ato-memory">Memory preference</Label>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <label className="flex items-start gap-2">
                  <input
                    className="mt-1 h-4 w-4 accent-foreground"
                    name="ato-memory"
                    type="radio"
                    value="opt-in"
                  />
                  <span>Opt-in memory only (ask before saving).</span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    className="mt-1 h-4 w-4 accent-foreground"
                    name="ato-memory"
                    type="radio"
                    value="always"
                  />
                  <span>Always save memory when useful.</span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    className="mt-1 h-4 w-4 accent-foreground"
                    name="ato-memory"
                    type="radio"
                    value="never"
                  />
                  <span>Never store memory.</span>
                </label>
              </div>
            </div>
            <div className="grid gap-3">
              <p className="text-sm font-medium text-foreground">
                Tool access toggles
              </p>
              <label className="flex items-start gap-2 text-sm text-muted-foreground">
                <input
                  className="mt-1 h-4 w-4 accent-foreground"
                  name="ato-web-search"
                  type="checkbox"
                />
                <span>Enable web search for this ATO.</span>
              </label>
              <label className="flex items-start gap-2 text-sm text-muted-foreground">
                <input
                  className="mt-1 h-4 w-4 accent-foreground"
                  name="ato-file-search"
                  type="checkbox"
                />
                <span>Enable file search uploads for this ATO.</span>
              </label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ato-audience">Target audience</Label>
              <Input
                id="ato-audience"
                name="ato-audience"
                placeholder="Example: Teens and adults looking for routine coaching."
                type="text"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Launch checklist</CardTitle>
            <CardDescription>
              Double-check the details so the team can build your ATO fast.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <label className="flex items-start gap-2">
              <input
                className="mt-1 h-4 w-4 accent-foreground"
                name="ato-review"
                type="checkbox"
              />
              <span>I verified the slash route is unique.</span>
            </label>
            <label className="flex items-start gap-2">
              <input
                className="mt-1 h-4 w-4 accent-foreground"
                name="ato-review"
                type="checkbox"
              />
              <span>I listed tools or integrations needed.</span>
            </label>
            <label className="flex items-start gap-2">
              <input
                className="mt-1 h-4 w-4 accent-foreground"
                name="ato-review"
                type="checkbox"
              />
              <span>I defined how memory should be handled.</span>
            </label>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              Submissions are reviewed by the Brooks AI HUB team before launch.
            </p>
            <p>
              Need more capacity? Founders access raises your monthly quota and
              instruction limits.
            </p>
          </div>
          <Button disabled={isSubmitting} type="submit" variant="outline">
            {isSubmitting ? "Submitting..." : "Submit ATO request"}
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
