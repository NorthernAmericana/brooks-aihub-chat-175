import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { withUserDbContext } from "@/lib/db/request-context";

const profileSchema = z.object({
  nickname: z.string().trim().max(80).nullable().optional(),
  home_city: z.string().trim().max(120).nullable().optional(),
  home_state: z.string().trim().max(120).nullable().optional(),
  car_make: z.string().trim().max(80).nullable().optional(),
  car_model: z.string().trim().max(80).nullable().optional(),
  car_year: z.coerce.number().int().min(1886).max(3000).nullable().optional(),
  subtitle: z.string().trim().max(160).nullable().optional(),
  show_subtitle: z.boolean().optional(),
  hands_free_mode: z.boolean().optional(),
});

type ExistingProfile = {
  nickname: string | null;
  home_city: string | null;
  home_state: string | null;
  car_make: string | null;
  car_model: string | null;
  car_year: number | null;
  subtitle: string | null;
  show_subtitle: boolean | null;
  hands_free_mode: boolean | null;
};

function normalizeNullableString(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function normalizeLegacyValue(
  incoming: string | number | null | undefined,
  existing: string | number | null | undefined
) {
  if (incoming === undefined) {
    return existing ?? null;
  }

  return incoming;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await withUserDbContext(session.user.id, (tx) =>
    tx.execute(sql`
      SELECT
        user_id,
        nickname,
        home_city,
        home_state,
        car_make,
        car_model,
        car_year,
        subtitle,
        COALESCE(show_subtitle, false) AS show_subtitle,
        COALESCE(hands_free_mode, false) AS hands_free_mode,
        created_at,
        updated_at
      FROM mycarmind_user_profiles
      WHERE user_id = ${session.user.id}
      LIMIT 1;
    `)
  );

  return NextResponse.json({
    profile: rows[0] ?? {
      user_id: session.user.id,
      nickname: null,
      home_city: null,
      home_state: null,
      car_make: null,
      car_model: null,
      car_year: null,
      subtitle: null,
      show_subtitle: false,
      hands_free_mode: false,
      created_at: null,
      updated_at: null,
    },
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = profileSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const data = parsed.data;
  const nickname = normalizeNullableString(data.nickname);
  const homeCity = normalizeNullableString(data.home_city);
  const homeState = normalizeNullableString(data.home_state);
  const carMake = normalizeNullableString(data.car_make);
  const carModel = normalizeNullableString(data.car_model);
  const subtitle = normalizeNullableString(data.subtitle);

  const rows = await withUserDbContext(session.user.id, async (tx) => {
    const existingRows = await tx.execute<ExistingProfile>(sql`
      SELECT
        nickname,
        home_city,
        home_state,
        car_make,
        car_model,
        car_year,
        subtitle,
        show_subtitle,
        hands_free_mode
      FROM mycarmind_user_profiles
      WHERE user_id = ${session.user.id}
      LIMIT 1;
    `);

    const existing = existingRows[0];

    return tx.execute(sql`
      INSERT INTO mycarmind_user_profiles (
        user_id,
        nickname,
        home_city,
        home_state,
        car_make,
        car_model,
        car_year,
        subtitle,
        show_subtitle,
        hands_free_mode,
        created_at,
        updated_at
      )
      VALUES (
        ${session.user.id},
        ${normalizeLegacyValue(nickname, existing?.nickname)},
        ${normalizeLegacyValue(homeCity, existing?.home_city)},
        ${normalizeLegacyValue(homeState, existing?.home_state)},
        ${normalizeLegacyValue(carMake, existing?.car_make)},
        ${normalizeLegacyValue(carModel, existing?.car_model)},
        ${normalizeLegacyValue(data.car_year, existing?.car_year)},
        ${subtitle === undefined ? (existing?.subtitle ?? null) : subtitle},
        ${data.show_subtitle ?? existing?.show_subtitle ?? false},
        ${data.hands_free_mode ?? existing?.hands_free_mode ?? false},
        now(),
        now()
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        nickname = EXCLUDED.nickname,
        home_city = EXCLUDED.home_city,
        home_state = EXCLUDED.home_state,
        car_make = EXCLUDED.car_make,
        car_model = EXCLUDED.car_model,
        car_year = EXCLUDED.car_year,
        subtitle = EXCLUDED.subtitle,
        show_subtitle = EXCLUDED.show_subtitle,
        hands_free_mode = EXCLUDED.hands_free_mode,
        updated_at = now()
      RETURNING
        user_id,
        nickname,
        home_city,
        home_state,
        car_make,
        car_model,
        car_year,
        subtitle,
        show_subtitle,
        hands_free_mode,
        created_at,
        updated_at;
    `);
  });

  return NextResponse.json({ profile: rows[0] });
}
