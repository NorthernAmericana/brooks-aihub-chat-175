"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MultipleChoiceQuestion } from "@/components/myflowerai/quiz/multiple-choice-question";
import { SliderQuestion } from "@/components/myflowerai/quiz/slider-question";
import { PersonaCard } from "@/components/myflowerai/quiz/persona-card";
import { StrainRecommendations } from "@/components/myflowerai/quiz/strain-recommendations";
import { QuizProgress } from "@/components/myflowerai/quiz/quiz-progress";
import { AgeGate } from "@/components/myflowerai/aura/age-gate";
import { AuraGeneratorPanel } from "@/components/myflowerai/aura/aura-generator-panel";
import {
  loadQuiz,
  processQuizResponses,
  generateStrainRecommendations,
} from "@/lib/myflowerai/quiz/engine";
import type { Quiz, QuizResult } from "@/lib/myflowerai/quiz/types";
import { Sparkles } from "lucide-react";

type QuizStrainRecord = {
  id: string;
  strain: {
    name: string;
    brand: string;
    type: string;
  };
  tags: string[];
};

export default function QuizPage() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string | number>>(
    {}
  );
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [strainDatabase, setStrainDatabase] = useState<QuizStrainRecord[]>([]);
  const [strainDataError, setStrainDataError] = useState<string | null>(null);
  const [ageVerified, setAgeVerified] = useState(false);
  const [showAuraGenerator, setShowAuraGenerator] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const loadedQuiz = await loadQuiz("strain-personality-v1");
        setQuiz(loadedQuiz);

        try {
          const strainResponse = await fetch("/api/myflowerai/strains", {
            cache: "no-store",
          });

          if (!strainResponse.ok) {
            throw new Error(
              "Unable to load strain dataset for recommendations"
            );
          }

          const payload = (await strainResponse.json()) as {
            strains?: Array<{
              id?: string;
              name?: string;
              brand?: string;
              type?: string;
              effects?: string[];
            }>;
          };

          const mappedStrains = (payload.strains ?? [])
            .map((strain) => {
              const id = strain.id?.trim();
              const name = strain.name?.trim();

              if (!id || !name) {
                return null;
              }

              return {
                id,
                strain: {
                  name,
                  brand: strain.brand?.trim() || "Unknown brand",
                  type: strain.type?.trim() || "Unknown type",
                },
                tags: (strain.effects ?? []).filter((tag): tag is string =>
                  Boolean(tag?.trim())
                ),
              };
            })
            .filter((strain): strain is QuizStrainRecord => strain !== null);

          if (mappedStrains.length === 0) {
            throw new Error("Strain dataset is empty");
          }

          setStrainDatabase(mappedStrains);
          setStrainDataError(null);
        } catch {
          setStrainDatabase([]);
          setStrainDataError(
            "Strain recommendations are currently unavailable."
          );
        }
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
        const resultWithStrains = strainDatabase.length
          ? generateStrainRecommendations(quizResult, strainDatabase)
          : { ...quizResult, suggested_strains: [] };
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
      <>
        <AgeGate onVerified={() => setAgeVerified(true)} />
        {ageVerified && (
          <div className="min-h-screen p-4 py-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Your Results</h1>
                <p className="text-muted-foreground">
                  Based on your answers, here's your cannabis personality
                  profile
                </p>
              </div>

              <PersonaCard profile={result.profile} />

              {!showAuraGenerator && (
                <Card>
                  <CardContent className="pt-6">
                    <Button
                      onClick={() => setShowAuraGenerator(true)}
                      size="lg"
                      className="w-full"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate My Strain Aura
                    </Button>
                  </CardContent>
                </Card>
              )}

              {showAuraGenerator && (
                <AuraGeneratorPanel
                  personaId={result.profile.id}
                  personaProfile={result.profile}
                />
              )}

              {strainDataError && (
                <Alert variant="destructive">
                  <AlertDescription>{strainDataError}</AlertDescription>
                </Alert>
              )}

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
        )}
      </>
    );
  }

  // Show quiz questions
  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <>
      <AgeGate onVerified={() => setAgeVerified(true)} />
      {ageVerified && (
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
                    onChange={(value) =>
                      handleResponse(currentQuestion.id, value)
                    }
                  />
                ) : (
                  <SliderQuestion
                    question={currentQuestion}
                    value={responses[currentQuestion.id] as number}
                    onChange={(value) =>
                      handleResponse(currentQuestion.id, value)
                    }
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
                This quiz provides general informational recommendations only
                and is NOT medical advice. Cannabis effects vary by individual.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}
    </>
  );
}
