import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { myfloweraiQuizResults } from "@/lib/db/schema";
import {
  loadQuiz,
  processQuizResponses,
} from "@/lib/myflowerai/quiz/engine";

/**
 * API route for submitting quiz responses and storing results privately
 *
 * POST /api/myflowerai/quiz/submit
 * Body: {
 *   quiz_id: string,
 *   responses: Record<string, string | number>
 * }
 *
 * Returns: {
 *   success: true,
 *   result: {
 *     persona_id: string,
 *     persona_name: string,
 *     vibe_summary: string,
 *     recommended_tags: string[]
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { quiz_id, responses } = body;

    // Validate required fields
    if (!quiz_id) {
      return NextResponse.json(
        { error: "quiz_id is required" },
        { status: 400 }
      );
    }

    if (!responses || typeof responses !== "object") {
      return NextResponse.json(
        { error: "responses must be an object" },
        { status: 400 }
      );
    }

    // Load quiz
    const quiz = await loadQuiz(quiz_id);

    // Process quiz responses
    const quizResult = processQuizResponses(quiz, responses);

    // Store quiz completion privately
    const currentDate = new Date();
    const createdMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;

    await db.insert(myfloweraiQuizResults).values({
      userId: session.user.id,
      quizId: quiz.id,
      personaId: quizResult.profile.id,
      createdMonth,
    });

    // Return result (without storing raw responses)
    return NextResponse.json({
      success: true,
      result: {
        persona_id: quizResult.profile.id,
        persona_name: quizResult.profile.name,
        vibe_summary: quizResult.profile.description,
        recommended_tags: quizResult.profile.recommended_tags,
        trait_scores: quizResult.normalized_trait_scores,
      },
    });
  } catch (error) {
    console.error("Quiz submission error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process quiz submission" },
      { status: 500 }
    );
  }
}
