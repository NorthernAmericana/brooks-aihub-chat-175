"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

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

interface PresetOption {
  id: string;
  name: string;
  description: string;
  style_keywords: string[];
  vibe_settings: VibeSettings;
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
  const [presets, setPresets] = useState<PresetOption[]>([]);
  const [selectedStrain, setSelectedStrain] = useState<string>("");
  const [selectedPersona, setSelectedPersona] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<string>("");
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
  const [strainsError, setStrainsError] = useState<string | null>(null);
  const [personasError, setPersonasError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageTitle, setImageTitle] = useState<string | null>(null);
  
  // Reference image state
  const [useReferenceImage, setUseReferenceImage] = useState<boolean>(false);
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [referenceStorageKey, setReferenceStorageKey] = useState<string | null>(null);
  const [uploadingReference, setUploadingReference] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    try {
      setLoadingData(true);
      setStrainsError(null);
      setPersonasError(null);

      const [strainsRes, personasRes, presetsRes] = await Promise.all([
        fetch("/api/myflowerai/strains"),
        fetch("/api/myflowerai/personas"),
        fetch("/api/myflowerai/presets"),
      ]);

      if (strainsRes.ok) {
        const strainsData = await strainsRes.json();
        setStrains(Array.isArray(strainsData?.strains) ? strainsData.strains : []);
      } else {
        setStrains([]);
        setStrainsError("Could not load strain options.");
      }

      if (personasRes.ok) {
        const personasData = await personasRes.json();
        setPersonas(
          Array.isArray(personasData?.personas) ? personasData.personas : []
        );
      } else {
        setPersonas([]);
        setPersonasError("Could not load persona options.");
      }

      if (presetsRes.ok) {
        const presetsData = await presetsRes.json();
        if (presetsData?.presets && Array.isArray(presetsData.presets)) {
          setPresets(presetsData.presets);
        }
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setStrains([]);
      setPersonas([]);
      setStrainsError("Could not load strain options.");
      setPersonasError("Could not load persona options.");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSliderChange = (key: keyof VibeSettings, value: number) => {
    setVibeSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    if (presetId) {
      const preset = presets.find((p) => p.id === presetId);
      if (preset) {
        setVibeSettings(preset.vibe_settings);
      }
    }
  };

  const handleReferenceImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, WEBP)");
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Validate file size (4MB limit)
    if (file.size > 4 * 1024 * 1024) {
      setError("Image file must be less than 4MB");
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setReferenceImageFile(file);
    setError(null);

    // Upload to Vercel Blob first, then create preview
    setUploadingReference(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const uploadData = await uploadRes.json();
      // Store only the pathname (storage_key), not the full signed URL
      setReferenceStorageKey(uploadData.pathname);

      // Only create preview after successful upload
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error uploading reference image:", err);
      setError("Failed to upload reference image. Please try again.");
      setReferenceImageFile(null);
      setReferenceImagePreview(null);
      setReferenceStorageKey(null);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setUploadingReference(false);
    }
  };

  const handleClearReferenceImage = () => {
    setReferenceImageFile(null);
    setReferenceImagePreview(null);
    setReferenceStorageKey(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    const normalizedStrainId = strains.find((strain) => strain.id === selectedStrain)?.id;
    const normalizedPersonaId =
      personas.find((persona) => persona.persona_id === selectedPersona)
        ?.persona_id ?? "";

    if (!normalizedStrainId) {
      setError("Please select a strain");
      return;
    }

    if (useReferenceImage && !referenceStorageKey) {
      setError("Please upload a reference image or disable the option");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedImage(null);
    setImageTitle(null);

    try {
      const requestBody: {
        strain_id: string;
        persona_id?: string;
        preset_id?: string;
        vibe_settings: VibeSettings;
        user_vibe_text?: string;
        storage_key?: string;
      } = {
        strain_id: normalizedStrainId,
        vibe_settings: vibeSettings,
      };

      if (normalizedPersonaId) {
        requestBody.persona_id = normalizedPersonaId;
      }
      if (selectedPreset) {
        requestBody.preset_id = selectedPreset;
      }
      if (userVibeText) {
        requestBody.user_vibe_text = userVibeText;
      }
      if (useReferenceImage && referenceStorageKey) {
        requestBody.storage_key = referenceStorageKey;
      }

      const response = await fetch("/api/myflowerai/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
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
            Select a strain to generate abstract art based on its terpene
            profile and effects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Strain Selector */}
          <div className="space-y-2">
            <Label htmlFor="strain">Strain</Label>
            <select
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              disabled={!!strainsError || strains.length === 0}
              id="strain"
              onChange={(e) => setSelectedStrain(e.target.value)}
              value={selectedStrain}
            >
              <option value="">Select a strain...</option>
              {strains.map((strain) => (
                <option key={strain.id} value={strain.id}>
                  {strain.name} ({strain.type}){" "}
                  {strain.brand ? `- ${strain.brand}` : ""}
                </option>
              ))}
            </select>
            {strainsError ? (
              <p className="text-xs text-destructive">
                Strain data unavailable due to a loading failure. Please retry.
              </p>
            ) : null}
            {!strainsError && strains.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Strain data unavailable: no strains were returned by the backend.
              </p>
            ) : null}
          </div>

          {/* Trip Mode Preset Selector */}
          <div className="space-y-2">
            <Label htmlFor="preset">Trip Mode Preset</Label>
            <select
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              id="preset"
              onChange={(e) => handlePresetChange(e.target.value)}
              value={selectedPreset}
            >
              <option value="">No preset (custom settings)</option>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} - {preset.description}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Choose a preset to automatically set style and vibe settings, or
              customize manually below
            </p>
          </div>

          {/* Persona Selector (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="persona">Persona Style (Optional)</Label>
            <select
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              disabled={!!personasError || personas.length === 0}
              id="persona"
              onChange={(e) => setSelectedPersona(e.target.value)}
              value={selectedPersona}
            >
              <option value="">No persona (default style)</option>
              {personas.map((persona) => (
                <option key={persona.persona_id} value={persona.persona_id}>
                  {persona.display_name}
                </option>
              ))}
            </select>
            {personasError ? (
              <p className="text-xs text-destructive">
                Persona data unavailable due to a loading failure. Please retry.
              </p>
            ) : null}
            {!personasError && personas.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Persona data unavailable: no personas were returned by the backend.
              </p>
            ) : null}
          </div>

          {(strainsError || personasError) && (
            <Button onClick={loadData} type="button" variant="outline">
              Retry loading data
            </Button>
          )}

          {/* Vibe Sliders */}
          <div className="space-y-4">
            <h3 className="font-semibold">Vibe Settings</h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Intensity</Label>
                <span className="text-sm text-muted-foreground">
                  {vibeSettings.intensity}
                </span>
              </div>
              <input
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                max="10"
                min="0"
                onChange={(e) =>
                  handleSliderChange("intensity", Number(e.target.value))
                }
                step="1"
                type="range"
                value={vibeSettings.intensity}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtle</span>
                <span>Vivid</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Neon Glow</Label>
                <span className="text-sm text-muted-foreground">
                  {vibeSettings.neon}
                </span>
              </div>
              <input
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                max="10"
                min="0"
                onChange={(e) =>
                  handleSliderChange("neon", Number(e.target.value))
                }
                step="1"
                type="range"
                value={vibeSettings.neon}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>None</span>
                <span>Maximum</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Nature</Label>
                <span className="text-sm text-muted-foreground">
                  {vibeSettings.nature}
                </span>
              </div>
              <input
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                max="10"
                min="0"
                onChange={(e) =>
                  handleSliderChange("nature", Number(e.target.value))
                }
                step="1"
                type="range"
                value={vibeSettings.nature}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Geometric</span>
                <span>Organic</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Surreal</Label>
                <span className="text-sm text-muted-foreground">
                  {vibeSettings.surreal}
                </span>
              </div>
              <input
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                max="10"
                min="0"
                onChange={(e) =>
                  handleSliderChange("surreal", Number(e.target.value))
                }
                step="1"
                type="range"
                value={vibeSettings.surreal}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Structured</span>
                <span>Dreamlike</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Energy</Label>
                <span className="text-sm text-muted-foreground">
                  {vibeSettings.chaos}
                </span>
              </div>
              <input
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                max="10"
                min="0"
                onChange={(e) =>
                  handleSliderChange("chaos", Number(e.target.value))
                }
                step="1"
                type="range"
                value={vibeSettings.chaos}
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
              maxLength={200}
              onChange={(e) => setUserVibeText(e.target.value)}
              placeholder="e.g., cosmic space vibes, underwater dreams..."
              type="text"
              value={userVibeText}
            />
            <p className="text-xs text-muted-foreground">
              Add a short description to further customize the art style
            </p>
          </div>

          {/* Reference Image Section */}
          <div className="space-y-4 border-t pt-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                checked={useReferenceImage}
                className="h-4 w-4 accent-foreground"
                id="use-reference"
                onChange={(e) => {
                  setUseReferenceImage(e.target.checked);
                  if (!e.target.checked) {
                    handleClearReferenceImage();
                  }
                }}
                type="checkbox"
              />
              <span className="text-sm font-medium leading-none">
                Use my photo as inspiration
              </span>
            </label>

            {useReferenceImage && (
              <div className="space-y-3 pl-6">
                <p className="text-xs text-muted-foreground">
                  Upload a personal photo to inspire the abstract art. The AI
                  will use your image as conceptual inspiration through enhanced
                  text prompts, creating an abstract interpretation rather than
                  a direct reproduction.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="reference-image">Reference Image</Label>
                  <Input
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploadingReference}
                    id="reference-image"
                    onChange={handleReferenceImageChange}
                    ref={fileInputRef}
                    type="file"
                  />
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, or WEBP - Max 4MB
                  </p>
                </div>

                {uploadingReference && (
                  <Alert>
                    <AlertDescription>
                      Uploading image... Please wait.
                    </AlertDescription>
                  </Alert>
                )}

                {referenceImagePreview && !uploadingReference && (
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="relative aspect-video w-full max-w-xs overflow-hidden rounded-lg border">
                      <ImageWithFallback
                        alt="Reference image preview"
                        className="object-cover"
                        containerClassName="size-full"
                        fill
                        sizes="(max-width: 384px) 100vw, 384px"
                        src={referenceImagePreview}
                      />
                    </div>
                    <Button
                      onClick={handleClearReferenceImage}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Clear Image
                    </Button>
                    <p className="text-xs text-yellow-600 dark:text-yellow-500">
                      ⚠️ Note: The uploaded image serves as conceptual
                      inspiration. If it contains text or logos, the AI will
                      create abstract patterns instead.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            disabled={
              loading ||
              !selectedStrain ||
              uploadingReference ||
              (useReferenceImage && !referenceStorageKey)
            }
            onClick={handleGenerate}
          >
            {loading
              ? "Generating..."
              : uploadingReference
                ? "Uploading image..."
                : "Generate Image"}
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
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
              <ImageWithFallback
                alt={imageTitle || "Generated art"}
                className="size-full object-contain"
                containerClassName="size-full"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                src={generatedImage}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={() => window.open(generatedImage, "_blank")}
              variant="outline"
            >
              Open in New Tab
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              This image was generated by AI and is for entertainment purposes
              only. No medical claims are made or implied.
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
            This tool generates abstract psychedelic art inspired by cannabis
            strain profiles. All generated images are purely artistic
            interpretations with no medical claims or advice.
          </p>
          <p>
            Images will not contain: people, faces, branding, product packaging,
            realistic plants, or any illegal content. User input is filtered for
            safety.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
