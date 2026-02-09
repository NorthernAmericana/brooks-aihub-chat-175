import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { myflowerLogs } from "@/lib/db/schema";
import { buildLogResponse, parseOptionalNumber } from "../utils";

const PRODUCT_TYPES = new Set([
  "flower",
  "vape",
  "edible",
  "tincture",
  "concentrate",
  "topical",
  "other",
]);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      console.warn("Failed to parse myflower log payload", error);
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const occurredAtRaw =
      typeof body === "object" && body !== null && "occurred_at" in body
        ? (body as { occurred_at?: unknown }).occurred_at
        : undefined;
    const occurredAt = new Date(occurredAtRaw);

    if (!occurredAtRaw || Number.isNaN(occurredAt.getTime())) {
      return NextResponse.json(
        { error: "occurred_at must be a valid ISO date string" },
        { status: 400 }
      );
    }

    const productType =
      typeof body === "object" && body !== null && "product_type" in body
        ? typeof (body as { product_type?: unknown }).product_type === "string"
          ? (body as { product_type?: string }).product_type
          : null
        : null;

    if (!productType || !PRODUCT_TYPES.has(productType)) {
      return NextResponse.json(
        { error: "product_type must be a valid product type" },
        { status: 400 }
      );
    }

    const strainSlug =
      typeof body === "object" && body !== null && "strain_slug" in body
        ? typeof (body as { strain_slug?: unknown }).strain_slug === "string" &&
          (body as { strain_slug?: string }).strain_slug?.trim()
          ? (body as { strain_slug?: string }).strain_slug?.trim() ?? null
          : null
        : null;
    const strainName =
      typeof body === "object" && body !== null && "strain_name" in body
        ? typeof (body as { strain_name?: unknown }).strain_name === "string" &&
          (body as { strain_name?: string }).strain_name?.trim()
          ? (body as { strain_name?: string }).strain_name?.trim() ?? null
          : null
        : null;
    const notes =
      typeof body === "object" && body !== null && "notes" in body
        ? typeof (body as { notes?: unknown }).notes === "string" &&
          (body as { notes?: string }).notes?.trim()
          ? (body as { notes?: string }).notes?.trim() ?? null
          : null
        : null;
    const photoAssetId =
      typeof body === "object" && body !== null && "photo_asset_id" in body
        ? typeof (body as { photo_asset_id?: unknown }).photo_asset_id ===
            "string" &&
          (body as { photo_asset_id?: string }).photo_asset_id?.trim()
          ? (body as { photo_asset_id?: string }).photo_asset_id?.trim() ?? null
          : null
        : null;

    const amountG =
      typeof body === "object" && body !== null && "amount_g" in body
        ? parseOptionalNumber((body as { amount_g?: unknown }).amount_g)
        : null;
    if (Number.isNaN(amountG)) {
      return NextResponse.json(
        { error: "amount_g must be a number" },
        { status: 400 }
      );
    }
    if (amountG !== null && amountG < 0) {
      return NextResponse.json(
        { error: "amount_g must be greater than or equal to 0" },
        { status: 400 }
      );
    }

    const amountMgThc =
      typeof body === "object" && body !== null && "amount_mg_thc" in body
        ? parseOptionalNumber((body as { amount_mg_thc?: unknown }).amount_mg_thc)
        : null;
    if (Number.isNaN(amountMgThc)) {
      return NextResponse.json(
        { error: "amount_mg_thc must be a number" },
        { status: 400 }
      );
    }
    if (amountMgThc !== null && amountMgThc < 0) {
      return NextResponse.json(
        { error: "amount_mg_thc must be greater than or equal to 0" },
        { status: 400 }
      );
    }

    const [log] = await db
      .insert(myflowerLogs)
      .values({
        userId: session.user.id,
        occurredAt,
        productType,
        strainSlug,
        strainName,
        amountG: amountG === null ? null : String(amountG),
        amountMgThc: amountMgThc === null ? null : String(amountMgThc),
        notes,
        photoAssetId,
      })
      .returning();

    if (!log) {
      return NextResponse.json(
        { error: "Failed to create log" },
        { status: 500 }
      );
    }

    return NextResponse.json({ log: buildLogResponse(log) }, { status: 201 });
  } catch (error) {
    console.error("Failed to create myflower log", error);
    return NextResponse.json(
      { error: "Failed to create log" },
      { status: 500 }
    );
  }
}
