"use client";

import { Progress } from "@/components/ui/progress";

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
}

export function QuizProgress({ currentQuestion, totalQuestions }: QuizProgressProps) {
  const progress = (currentQuestion / totalQuestions) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          Question {currentQuestion} of {totalQuestions}
        </span>
        <span>{Math.round(progress)}% complete</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
