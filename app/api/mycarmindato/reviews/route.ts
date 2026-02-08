import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { review, reviewPhoto } from "@/lib/db/schema";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export const dynamic = "force-dynamic";

const isValidPhoto = (file: File) =>
  ALLOWED_PHOTO_TYPES.has(file.type.toLowerCase());

type ReviewPayload = {
  placeId?: string;
  placeName?: string;
  placeSource?: string | null;
  googleMapsUrl?: string | null;
  rating?: number;
  reviewText?: string;
};

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: ReviewPayload;

  try {
    payload = (await request.json()) as ReviewPayload;
  } catch (_error) {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const placeId =
    typeof payload.placeId === "string" ? payload.placeId.trim() : "";
  const placeName =
    typeof payload.placeName === "string" ? payload.placeName.trim() : "";
  const reviewText =
    typeof payload.reviewText === "string" ? payload.reviewText.trim() : "";
  const rating =
    typeof payload.rating === "number" ? Math.round(payload.rating) : null;

  if (!placeId || !placeName) {
    return NextResponse.json(
      { error: "placeId and placeName are required." },
      { status: 400 }
    );
  }

  if (!reviewText) {
    return NextResponse.json(
      { error: "reviewText is required." },
      { status: 400 }
    );
  }

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "rating must be between 1 and 5." },
      { status: 400 }
    );
  }

  const [record] = await db
    .insert(review)
    .values({
      userId: session.user.id,
      placeId,
      placeName,
      placeSource:
        typeof payload.placeSource === "string" ? payload.placeSource : null,
      googleMapsUrl:
        typeof payload.googleMapsUrl === "string"
          ? payload.googleMapsUrl
          : null,
      rating,
      reviewText,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return NextResponse.json({ review: record });
}

export async function PUT(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (request.body === null) {
    return NextResponse.json({ error: "Request body is empty." }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const placeId = formData.get("placeId");
  const placeName = formData.get("placeName");
  const reviewId = formData.get("reviewId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  if (file.size > MAX_PHOTO_SIZE) {
    return NextResponse.json(
      { error: "Photo size must be under 5MB." },
      { status: 400 }
    );
  }

  if (!isValidPhoto(file)) {
    return NextResponse.json(
      { error: "Only JPG, PNG, WEBP, or HEIC images are supported." },
      { status: 400 }
    );
  }

  if (typeof placeId !== "string" || typeof placeName !== "string") {
    return NextResponse.json(
      { error: "placeId and placeName are required." },
      { status: 400 }
    );
  }

  const trimmedPlaceId = placeId.trim();
  const trimmedPlaceName = placeName.trim();

  if (!trimmedPlaceId || !trimmedPlaceName) {
    return NextResponse.json(
      { error: "placeId and placeName are required." },
      { status: 400 }
    );
  }

  let validatedReviewId: string | null = null;

  if (typeof reviewId === "string" && reviewId.trim()) {
    const [existingReview] = await db
      .select()
      .from(review)
      .where(and(eq(review.id, reviewId.trim()), eq(review.userId, session.user.id)))
      .limit(1);

    if (!existingReview) {
      return NextResponse.json(
        { error: "Review not found." },
        { status: 404 }
      );
    }

    validatedReviewId = existingReview.id;
  }

  const filename = `mycarmindato/reviews/${session.user.id}/${trimmedPlaceId}/${Date.now()}-${file.name}`;
  const fileBuffer = await file.arrayBuffer();

  try {
    const blob = await put(filename, fileBuffer, { access: "public" });

    const [record] = await db
      .insert(reviewPhoto)
      .values({
        reviewId: validatedReviewId,
        userId: session.user.id,
        placeId: trimmedPlaceId,
        placeName: trimmedPlaceName,
        blobUrl: blob.url,
        blobPathname: blob.pathname,
        contentType: blob.contentType ?? file.type,
        size: file.size,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json({ photo: record });
  } catch (_error) {
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
