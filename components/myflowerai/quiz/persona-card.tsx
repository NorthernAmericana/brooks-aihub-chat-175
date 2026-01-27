"use client";

import type { QuizResultProfile } from "@/lib/myflowerai/quiz/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PersonaCardProps {
  profile: QuizResultProfile;
}

export function PersonaCard({ profile }: PersonaCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">{profile.name}</CardTitle>
        <CardDescription className="text-base">
          {profile.vibe_text}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Trait Scores */}
        {Object.keys(profile.trait_scores).length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm uppercase text-muted-foreground">
              Your Trait Profile
            </h3>
            <div className="space-y-2">
              {Object.entries(profile.trait_scores)
                .sort((a, b) => b[1] - a[1])
                .map(([trait, score]) => (
                  <div key={trait} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{trait}</span>
                      <span className="text-muted-foreground">
                        {Math.round(score * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${score * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Recommended Tags */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm uppercase text-muted-foreground">
            Look for These Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.recommended_tags.map((tag) => (
              <Badge key={tag} variant="default">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Avoid Tags */}
        {profile.avoid_tags && profile.avoid_tags.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm uppercase text-muted-foreground">
              You Might Want to Avoid
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.avoid_tags.map((tag) => (
                <Badge key={tag} variant="outline" className="opacity-60">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
