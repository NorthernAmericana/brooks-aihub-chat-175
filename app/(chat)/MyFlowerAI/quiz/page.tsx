"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MultipleChoiceQuestion } from "@/components/myflowerai/quiz/multiple-choice-question";
import { SliderQuestion } from "@/components/myflowerai/quiz/slider-question";
import { PersonaCard } from "@/components/myflowerai/quiz/persona-card";
import { StrainRecommendations } from "@/components/myflowerai/quiz/strain-recommendations";
import { QuizProgress } from "@/components/myflowerai/quiz/quiz-progress";
import { loadQuiz, processQuizResponses, generateStrainRecommendations } from "@/lib/myflowerai/quiz/engine";
import type { Quiz, QuizResult } from "@/lib/myflowerai/quiz/types";

export default function QuizPage() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string | number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [strainDatabase, setStrainDatabase] = useState<any[]>([]);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const loadedQuiz = await loadQuiz("strain-personality-v1");
        setQuiz(loadedQuiz);

        // Load strain database
        // In a real implementation, this would load from the actual strain files
        // For now, we'll use a mock database
        const mockStrains = [
          {
            id: "example-1",
            strain: { name: "Blue Dream", brand: "Example Brand" },
            tags: ["uplifting", "creative", "daytime", "mood-enhancing"],
          },
          {
            id: "example-2",
            strain: { name: "Northern Lights", brand: "Example Brand" },
            tags: ["relaxing", "cozy", "night", "calming"],
          },
          {
            id: "example-3",
            strain: { name: "Sour Diesel", brand: "Example Brand" },
            tags: ["energizing", "uplifting", "focus", "daytime"],
          },
        ];
        setStrainDatabase(mockStrains);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  const handleResponse = (questionId: string, value: string | number) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    if (!quiz) return;

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const hasResponse = responses[currentQuestion.id] !== undefined;

    if (currentQuestion.required && !hasResponse) {
      setError("Please answer this question before continuing");
      return;
    }

    setError(null);

    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Process quiz results
      try {
        const quizResult = processQuizResponses(quiz, responses);
        const resultWithStrains = generateStrainRecommendations(
          quizResult,
          strainDatabase
        );
        setResult(resultWithStrains);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process quiz");
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setError(null);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setResponses({});
    setResult(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading quiz...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="py-8">
            <p className="text-center text-destructive">
              {error || "Failed to load quiz"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show results
  if (result) {
    return (
      <div className="min-h-screen p-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Your Results</h1>
            <p className="text-muted-foreground">
              Based on your answers, here's your cannabis personality profile
            </p>
          </div>

          <PersonaCard profile={result.profile} />

          <StrainRecommendations result={result} />

          {/* Disclaimers */}
          <Alert>
            <AlertDescription className="space-y-2">
              <p className="font-semibold">Important Disclaimers:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {quiz.disclaimers.map((disclaimer, index) => (
                  <li key={index}>{disclaimer}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex justify-center">
            <Button onClick={handleRestart} size="lg">
              Take Quiz Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show quiz questions
  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          <p className="text-muted-foreground">{quiz.description}</p>
        </div>

        <QuizProgress
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={quiz.questions.length}
        />

        <Card>
          <CardHeader>
            <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
          </CardHeader>

          <CardContent>
            {currentQuestion.type === "multiple-choice" ? (
              <MultipleChoiceQuestion
                question={currentQuestion}
                value={responses[currentQuestion.id] as string}
                onChange={(value) => handleResponse(currentQuestion.id, value)}
              />
            ) : (
              <SliderQuestion
                question={currentQuestion}
                value={responses[currentQuestion.id] as number}
                onChange={(value) => handleResponse(currentQuestion.id, value)}
              />
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            <Button onClick={handleNext}>
              {currentQuestionIndex === quiz.questions.length - 1
                ? "See Results"
                : "Next"}
            </Button>
          </CardFooter>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Quiz Disclaimers at Bottom */}
        <Alert>
          <AlertDescription className="text-xs text-muted-foreground">
            This quiz provides general informational recommendations only and is NOT
            medical advice. Cannabis effects vary by individual.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
