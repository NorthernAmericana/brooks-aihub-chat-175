"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface StrainOption {
  id: string;
  name: string;
  type: string;
  brand?: string;
}

interface PersonaOption {
  persona_id: string;
  display_name: string;
}

interface VibeSettings {
  intensity: number;
  neon: number;
  nature: number;
  surreal: number;
  chaos: number;
}

export default function ImageGenPage() {
  const [strains, setStrains] = useState<StrainOption[]>([]);
  const [personas, setPersonas] = useState<PersonaOption[]>([]);
  const [selectedStrain, setSelectedStrain] = useState<string>("");
  const [selectedPersona, setSelectedPersona] = useState<string>("");
  const [userVibeText, setUserVibeText] = useState<string>("");
  const [vibeSettings, setVibeSettings] = useState<VibeSettings>({
    intensity: 5,
    neon: 0,
    nature: 5,
    surreal: 5,
    chaos: 5,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageTitle, setImageTitle] = useState<string | null>(null);

  // Load strains and personas on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingData(true);
        
        // Load strains
        const strainsRes = await fetch("/data/myflowerai/strains.json");
        if (strainsRes.ok) {
          const strainsData = await strainsRes.json();
          setStrains(strainsData);
        } else {
          // Fallback to static list if endpoint doesn't exist
          setStrains([
            {
              id: "trulieve-modern-flower-seed-junky-juicy-jane-3p5g",
              name: "Juicy Jane",
              type: "hybrid",
              brand: "Modern Flower x Seed Junky",
            },
            {
              id: "trulieve-sunshine-cannabis-white-sunshine-3p5g",
              name: "White Sunshine",
              type: "sativa",
              brand: "Sunshine Cannabis",
            },
            {
              id: "planet-13-margalope-tier-3-3p5g",
              name: "Margalope",
              type: "hybrid",
              brand: "Planet 13",
            },
          ]);
        }

        // Load personas
        const personasRes = await fetch("/data/myflowerai/personas.json");
        if (personasRes.ok) {
          const personasData = await personasRes.json();
          setPersonas(personasData);
        } else {
          // Fallback to static list
          setPersonas([
            { persona_id: "balanced-harmonizer", display_name: "Balanced Harmonizer" },
            { persona_id: "creative-fire", display_name: "Creative Fire" },
            { persona_id: "forest-wanderer", display_name: "Forest Wanderer" },
            { persona_id: "neon-arcade-brain", display_name: "Neon Arcade Brain" },
            { persona_id: "night-owl-dreamer", display_name: "Night Owl Dreamer" },
          ]);
        }
        
        setLoadingData(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load strain and persona data");
        setLoadingData(false);
      }
    }

    loadData();
  }, []);

  const handleSliderChange = (key: keyof VibeSettings, value: number) => {
    setVibeSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    if (!selectedStrain) {
      setError("Please select a strain");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedImage(null);
    setImageTitle(null);

    try {
      const response = await fetch("/api/myflowerai/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          strain_id: selectedStrain,
          persona_id: selectedPersona || undefined,
          vibe_settings: vibeSettings,
          user_vibe_text: userVibeText || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to generate image");
        return;
      }

      setGeneratedImage(data.image_url);
      setImageTitle(data.title);
    } catch (err) {
      console.error("Error generating image:", err);
      setError("Failed to generate image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">MyFlowerAI Image Generator</h1>
        <p className="text-muted-foreground">
          Generate abstract psychedelic art inspired by cannabis strains
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Choose Your Strain</CardTitle>
          <CardDescription>
            Select a strain to generate abstract art based on its terpene profile and effects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Strain Selector */}
          <div className="space-y-2">
            <Label htmlFor="strain">Strain</Label>
            <select
              id="strain"
              value={selectedStrain}
              onChange={(e) => setSelectedStrain(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Select a strain...</option>
              {strains.map((strain) => (
                <option key={strain.id} value={strain.id}>
                  {strain.name} ({strain.type}) {strain.brand ? `- ${strain.brand}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Persona Selector (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="persona">Persona Style (Optional)</Label>
            <select
              id="persona"
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">No persona (default style)</option>
              {personas.map((persona) => (
                <option key={persona.persona_id} value={persona.persona_id}>
                  {persona.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Vibe Sliders */}
          <div className="space-y-4">
            <h3 className="font-semibold">Vibe Settings</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Intensity</Label>
                <span className="text-sm text-muted-foreground">{vibeSettings.intensity}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={vibeSettings.intensity}
                onChange={(e) => handleSliderChange("intensity", Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtle</span>
                <span>Vivid</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Neon Glow</Label>
                <span className="text-sm text-muted-foreground">{vibeSettings.neon}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={vibeSettings.neon}
                onChange={(e) => handleSliderChange("neon", Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>None</span>
                <span>Maximum</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Nature</Label>
                <span className="text-sm text-muted-foreground">{vibeSettings.nature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={vibeSettings.nature}
                onChange={(e) => handleSliderChange("nature", Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Geometric</span>
                <span>Organic</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Surreal</Label>
                <span className="text-sm text-muted-foreground">{vibeSettings.surreal}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={vibeSettings.surreal}
                onChange={(e) => handleSliderChange("surreal", Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Structured</span>
                <span>Dreamlike</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Energy</Label>
                <span className="text-sm text-muted-foreground">{vibeSettings.chaos}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={vibeSettings.chaos}
                onChange={(e) => handleSliderChange("chaos", Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Calm</span>
                <span>Chaotic</span>
              </div>
            </div>
          </div>

          {/* User Vibe Text */}
          <div className="space-y-2">
            <Label htmlFor="vibe-text">Additional Vibe (Optional)</Label>
            <Input
              id="vibe-text"
              type="text"
              placeholder="e.g., cosmic space vibes, underwater dreams..."
              value={userVibeText}
              onChange={(e) => setUserVibeText(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              Add a short description to further customize the art style
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleGenerate}
            disabled={loading || !selectedStrain}
            className="w-full"
          >
            {loading ? "Generating..." : "Generate Image"}
          </Button>
        </CardFooter>
      </Card>

      {/* Generated Image Display */}
      {generatedImage && (
        <Card>
          <CardHeader>
            <CardTitle>{imageTitle}</CardTitle>
            <CardDescription>
              Abstract psychedelic art inspired by your selected strain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={generatedImage}
                alt={imageTitle || "Generated art"}
                className="w-full h-full object-contain"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(generatedImage, "_blank")}
            >
              Open in New Tab
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              This image was generated by AI and is for entertainment purposes only.
              No medical claims are made or implied.
            </p>
          </CardFooter>
        </Card>
      )}

      {/* Safety Notice */}
      <Card className="border-yellow-500/50">
        <CardHeader>
          <CardTitle className="text-sm">Important Notice</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>
            This tool generates abstract psychedelic art inspired by cannabis strain profiles.
            All generated images are purely artistic interpretations with no medical claims or advice.
          </p>
          <p>
            Images will not contain: people, faces, branding, product packaging, realistic plants,
            or any illegal content. User input is filtered for safety.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
