"use client";

import type { QuizResult } from "@/lib/myflowerai/quiz/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StrainRecommendationsProps {
  result: QuizResult;
}

export function StrainRecommendations({ result }: StrainRecommendationsProps) {
  if (!result.suggested_strains || result.suggested_strains.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Strain Recommendations</CardTitle>
          <CardDescription>
            No matching strains found in the database. Try adjusting your preferences.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Recommended Strains</CardTitle>
        <CardDescription>
          Based on your personality profile, here are strains that might be a good fit
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {result.suggested_strains.map((strain) => (
            <div
              key={strain.id}
              className="flex items-start justify-between border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-2 flex-1">
                <div className="space-y-1">
                  <h4 className="font-semibold">{strain.name}</h4>
                  <p className="text-sm text-muted-foreground">{strain.brand}</p>
                </div>

                {strain.matching_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {strain.matching_tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="ml-4 text-right">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(strain.match_score * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">match</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
