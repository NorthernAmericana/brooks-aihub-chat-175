import type { NextRequest } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getUserBirthday, updateUserBirthday } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

type BirthdayValidationResult =
  | { valid: true; normalized: string | null }
  | { valid: false; message: string };

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MM_DD_REGEX = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/;

function isValidDateParts(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function validateBirthdayInput(input: unknown): BirthdayValidationResult {
  if (input === null || input === undefined || input === "") {
    return { valid: true, normalized: null };
  }

  if (typeof input !== "string") {
    return {
      valid: false,
      message: "Birthday must be a string in MM/DD or YYYY-MM-DD format.",
    };
  }

  if (MM_DD_REGEX.test(input)) {
    const [month, day] = input.split("/").map((value) => Number(value));
    if (!isValidDateParts(2000, month, day)) {
      return { valid: false, message: "Birthday must be a valid MM/DD date." };
    }
    return { valid: true, normalized: input };
  }

  if (ISO_DATE_REGEX.test(input)) {
    const [year, month, day] = input.split("-").map((value) => Number(value));
    if (!isValidDateParts(year, month, day)) {
      return { valid: false, message: "Birthday must be a valid YYYY-MM-DD date." };
    }
    return { valid: true, normalized: input };
  }

  return {
    valid: false,
    message: "Birthday must be in MM/DD or YYYY-MM-DD format.",
  };
}

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const birthday = await getUserBirthday({ userId: session.user.id });

  return Response.json({ birthday }, { status: 200 });
}

export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    console.warn("Failed to parse birthday payload", error);
    return new ChatSDKError("bad_request:api", "Invalid JSON body.").toResponse();
  }

  const birthdayInput =
    typeof body === "object" && body !== null && "birthday" in body
      ? (body as { birthday?: unknown }).birthday
      : undefined;

  const validation = validateBirthdayInput(birthdayInput);

  if (!validation.valid) {
    return new ChatSDKError("bad_request:api", validation.message).toResponse();
  }

  const birthday = await updateUserBirthday({
    userId: session.user.id,
    birthday: validation.normalized,
  });

  return Response.json({ birthday }, { status: 200 });
}
