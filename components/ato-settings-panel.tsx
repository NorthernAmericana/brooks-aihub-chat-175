"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { UnofficialAto } from "@/lib/db/schema";

type AtoSettingsPanelProps = {
  atos: UnofficialAto[];
  maxFileCount: number;
};

type AtoToolSettings = {
  webSearchEnabled: boolean;
  fileSearchEnabled: boolean;
};

export const AtoSettingsPanel = ({
  atos,
  maxFileCount,
}: AtoSettingsPanelProps) => {
  const defaultSettings = useMemo(
    () =>
      atos.reduce<Record<string, AtoToolSettings>>((accumulator, ato) => {
        accumulator[ato.id] = {
          webSearchEnabled: ato.webSearchEnabled ?? false,
          fileSearchEnabled: ato.fileSearchEnabled ?? false,
        };
        return accumulator;
      }, {}),
    [atos]
  );

  const [settingsById, setSettingsById] =
    useState<Record<string, AtoToolSettings>>(defaultSettings);

  useEffect(() => {
    setSettingsById(defaultSettings);
  }, [defaultSettings]);

  const persistSettings = async (
    atoId: string,
    nextSettings: AtoToolSettings
  ) => {
    try {
      const response = await fetch(`/api/ato/${atoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextSettings),
      });

      if (!response.ok) {
        throw new Error("Failed to update ATO settings.");
      }

      toast.success("ATO settings updated.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to save ATO settings.");
    }
  };

  if (atos.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        No unofficial ATOs yet. Create one to customize its tool access.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {atos.map((ato) => {
        const settings = settingsById[ato.id] ?? {
          webSearchEnabled: false,
          fileSearchEnabled: false,
        };

        return (
          <div
            className="flex flex-col gap-3 rounded-lg border border-border p-4"
            key={ato.id}
          >
            <div>
              <p className="font-medium">{ato.name}</p>
              <p className="text-xs text-muted-foreground">
                {ato.description || "No description provided."}
              </p>
              <Button asChild className="mt-3" size="sm" variant="outline">
                <Link href={`/create-ato/${ato.id}`}>Edit ATO</Link>
              </Button>
            </div>

            <div className="flex flex-col gap-3 text-sm">
              <label className="flex items-start justify-between gap-3">
                <span>
                  Web search
                  <span className="block text-xs text-muted-foreground">
                    Allow this ATO to use web search when needed.
                  </span>
                </span>
                <input
                  checked={settings.webSearchEnabled}
                  className="mt-1 h-4 w-4 accent-foreground"
                  onChange={(event) => {
                    const nextSettings = {
                      ...settings,
                      webSearchEnabled: event.target.checked,
                    };
                    setSettingsById((previous) => ({
                      ...previous,
                      [ato.id]: nextSettings,
                    }));
                    void persistSettings(ato.id, nextSettings);
                  }}
                  type="checkbox"
                />
              </label>
              <label className="flex items-start justify-between gap-3">
                <span>
                  File search uploads
                  <span className="block text-xs text-muted-foreground">
                    Enable file uploads (max {maxFileCount} files per ATO).
                  </span>
                </span>
                <input
                  checked={settings.fileSearchEnabled}
                  className="mt-1 h-4 w-4 accent-foreground"
                  onChange={(event) => {
                    const nextSettings = {
                      ...settings,
                      fileSearchEnabled: event.target.checked,
                    };
                    setSettingsById((previous) => ({
                      ...previous,
                      [ato.id]: nextSettings,
                    }));
                    void persistSettings(ato.id, nextSettings);
                  }}
                  type="checkbox"
                />
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
};
