"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Sparkles } from "lucide-react";
import type { QuizResultProfile } from "@/lib/myflowerai/quiz/types";

interface AuraGeneratorPanelProps {
  personaId: string;
  personaProfile: QuizResultProfile;
  onImageGenerated?: (result: { image_url: string; title: string }) => void;
}

/**
 * Aura Generator Panel Component
 * 
 * Allows users to generate personalized "Strain Aura" images from their quiz persona.
 * Supports two modes:
 * A) Persona-only mode (no specific strain)
 * B) Persona + strain mode (select from database)
 */
export function AuraGeneratorPanel({
  personaId,
  personaProfile,
  onImageGenerated,
}: AuraGeneratorPanelProps) {
  const [mode, setMode] = useState<"persona-only" | "persona-strain">("persona-only");
  const [selectedStrainId, setSelectedStrainId] = useState<string>("");
  const [vibeSettings, setVibeSettings] = useState({
    intensity: 5,
    neon: 0,
    nature: 5,
    surreal: 5,
    chaos: 5,
  });
  const [vibeText, setVibeText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ image_url: string; title: string } | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/myflowerai/image/aura", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          persona_id: personaId,
          strain_id: mode === "persona-strain" ? selectedStrainId : undefined,
          vibe_settings: vibeSettings,
          user_vibe_text: vibeText.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate image");
      }

      const data = await response.json();
      setResult({
        image_url: data.image_url,
        title: data.title,
      });

      if (onImageGenerated) {
        onImageGenerated(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate image");
    } finally {
      setGenerating(false);
    }
  };

  const updateVibeSetting = (key: keyof typeof vibeSettings, value: number[]) => {
    setVibeSettings((prev) => ({
      ...prev,
      [key]: value[0],
    }));
  };

  if (result) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Your Strain Aura</CardTitle>
          <CardDescription>{result.title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            <img
              src={result.image_url}
              alt={result.title}
              className="w-full h-full object-cover"
            />
          </div>
          <Button
            onClick={() => setResult(null)}
            variant="outline"
            className="w-full"
          >
            Generate Another
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Generate Your Strain Aura
        </CardTitle>
        <CardDescription>
          Create a personalized abstract psychedelic image based on your {personaProfile.name} persona
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Mode Selection */}
        <div className="space-y-3">
          <Label>Generation Mode</Label>
          <RadioGroup value={mode} onValueChange={(value) => setMode(value as typeof mode)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="persona-only" id="mode-persona" />
              <Label htmlFor="mode-persona" className="font-normal cursor-pointer">
                Use my quiz persona only (abstract vibe)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="persona-strain" id="mode-strain" />
              <Label htmlFor="mode-strain" className="font-normal cursor-pointer">
                Pick a specific strain (persona + strain blend)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Strain Selector (if persona-strain mode) */}
        {mode === "persona-strain" && (
          <div className="space-y-2">
            <Label htmlFor="strain-select">Select Strain</Label>
            <Alert>
              <AlertDescription className="text-sm">
                Strain picker coming soon! For now, persona-only mode is available.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Vibe Sliders */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Customize Your Vibe</h3>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label>Intensity</Label>
              <span className="text-muted-foreground">{vibeSettings.intensity}/10</span>
            </div>
            <Slider
              value={[vibeSettings.intensity]}
              onValueChange={(value) => updateVibeSetting("intensity", value)}
              min={0}
              max={10}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Subtle & gentle (0) → Bold & vivid (10)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label>Neon Glow</Label>
              <span className="text-muted-foreground">{vibeSettings.neon}/10</span>
            </div>
            <Slider
              value={[vibeSettings.neon]}
              onValueChange={(value) => updateVibeSetting("neon", value)}
              min={0}
              max={10}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              No glow (0) → Full neon (10)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label>Nature</Label>
              <span className="text-muted-foreground">{vibeSettings.nature}/10</span>
            </div>
            <Slider
              value={[vibeSettings.nature]}
              onValueChange={(value) => updateVibeSetting("nature", value)}
              min={0}
              max={10}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Geometric (0) → Organic forms (10)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label>Surreal</Label>
              <span className="text-muted-foreground">{vibeSettings.surreal}/10</span>
            </div>
            <Slider
              value={[vibeSettings.surreal]}
              onValueChange={(value) => updateVibeSetting("surreal", value)}
              min={0}
              max={10}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Structured (0) → Dreamlike (10)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label>Energy</Label>
              <span className="text-muted-foreground">{vibeSettings.chaos}/10</span>
            </div>
            <Slider
              value={[vibeSettings.chaos]}
              onValueChange={(value) => updateVibeSetting("chaos", value)}
              min={0}
              max={10}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Calm & peaceful (0) → Chaotic & energetic (10)
            </p>
          </div>
        </div>

        {/* Vibe Text Input */}
        <div className="space-y-2">
          <Label htmlFor="vibe-text">
            Add Your Vibe (Optional)
          </Label>
          <Textarea
            id="vibe-text"
            placeholder="e.g., electric sunset vibes, cosmic journey, forest mystic..."
            value={vibeText}
            onChange={(e) => setVibeText(e.target.value.substring(0, 200))}
            maxLength={200}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            {vibeText.length}/200 characters · Text is automatically filtered for safety
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={generating || (mode === "persona-strain" && !selectedStrainId)}
          className="w-full"
          size="lg"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Your Aura...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Strain Aura
            </>
          )}
        </Button>

        <Alert>
          <AlertDescription className="text-xs">
            Generated images are abstract art only. No faces, no packaging, no medical claims.
            Images are stored privately and only visible to you.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
