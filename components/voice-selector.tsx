"use client";

import { Check, ChevronsUpDown, Search } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { VoiceOption } from "@/lib/voice";
import { cn } from "@/lib/utils";

type VoiceSelectorProps = {
  voices: VoiceOption[];
  value: string;
  onValueChange: (value: string) => void;
  defaultVoiceId?: string;
  id?: string;
  maxVisibleWithoutSearch?: number;
};

export function VoiceSelector({
  voices,
  value,
  onValueChange,
  defaultVoiceId,
  id,
  maxVisibleWithoutSearch = 3,
}: VoiceSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const selectedVoice = voices.find((voice) => voice.id === value);

  // Filter voices based on search query
  const filteredVoices = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return voices;
    }
    return voices.filter((voice) =>
      voice.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [voices, searchQuery]);

  // Determine if we should show search
  const showSearch = voices.length > maxVisibleWithoutSearch;

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className="w-full justify-between"
          id={id}
          role="combobox"
          variant="outline"
        >
          {selectedVoice?.label ?? "Select a voice"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          {showSearch && (
            <CommandInput
              onValueChange={setSearchQuery}
              placeholder="Search voices..."
              value={searchQuery}
            />
          )}
          <CommandList>
            <CommandEmpty>No voice found.</CommandEmpty>
            <CommandGroup>
              {filteredVoices.map((voice) => (
                <CommandItem
                  key={voice.id}
                  onSelect={() => {
                    onValueChange(voice.id);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  value={voice.id}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === voice.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {voice.label}
                  {voice.id === defaultVoiceId && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      (Default)
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
