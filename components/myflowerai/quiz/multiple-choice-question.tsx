"use client";

import { useState } from "react";
import type { QuizQuestion, QuizAnswerOption } from "@/lib/myflowerai/quiz/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface MultipleChoiceQuestionProps {
  question: QuizQuestion;
  value?: string;
  onChange: (value: string) => void;
}

export function MultipleChoiceQuestion({
  question,
  value,
  onChange,
}: MultipleChoiceQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string | undefined>(value);

  const handleSelect = (optionId: string) => {
    setSelectedOption(optionId);
    onChange(optionId);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-lg font-semibold">{question.text}</Label>
        {question.description && (
          <p className="text-sm text-muted-foreground">{question.description}</p>
        )}
      </div>

      <div className="space-y-2">
        {question.options?.map((option) => (
          <Button
            key={option.id}
            type="button"
            variant={selectedOption === option.id ? "default" : "outline"}
            className={cn(
              "w-full justify-start text-left h-auto py-4 px-4",
              selectedOption === option.id && "ring-2 ring-primary"
            )}
            onClick={() => handleSelect(option.id)}
          >
            <span className="flex-1">{option.text}</span>
            {selectedOption === option.id && (
              <span className="ml-2">✓</span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
