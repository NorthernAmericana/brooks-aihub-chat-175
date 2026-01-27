"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/lib/myflowerai/quiz/types";
import { Label } from "@/components/ui/label";

interface SliderQuestionProps {
  question: QuizQuestion;
  value?: number;
  onChange: (value: number) => void;
}

export function SliderQuestion({
  question,
  value,
  onChange,
}: SliderQuestionProps) {
  const config = question.slider_config;
  if (!config) return null;

  const [sliderValue, setSliderValue] = useState(
    value ?? (config.min + config.max) / 2
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number.parseFloat(e.target.value);
    setSliderValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-lg font-semibold">{question.text}</Label>
        {question.description && (
          <p className="text-sm text-muted-foreground">{question.description}</p>
        )}
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{config.labels.min}</span>
          <span className="font-semibold text-lg text-foreground">
            {sliderValue}
          </span>
          <span>{config.labels.max}</span>
        </div>

        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step}
          value={sliderValue}
          onChange={handleChange}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-thumb"
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          {Array.from(
            { length: Math.floor((config.max - config.min) / config.step) + 1 },
            (_, i) => config.min + i * config.step
          ).map((tick) => (
            <span key={tick} className="w-px">
              {tick}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
