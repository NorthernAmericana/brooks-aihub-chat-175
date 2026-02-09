import type { MyflowerDailyGoal, MyflowerLog } from "@/lib/db/schema";

const ISO_DAY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export type ParsedDayRange = {
  date: string;
  start: Date;
  end: Date;
};

export function parseDayRange(dateInput: unknown): ParsedDayRange | null {
  if (typeof dateInput !== "string" || !ISO_DAY_REGEX.test(dateInput)) {
    return null;
  }

  const [year, month, day] = dateInput
    .split("-")
    .map((value) => Number(value));
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  return { date: dateInput, start, end };
}

export function parseOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return Number.NaN;
  }

  return parsed;
}

export function buildGoalResponse(goal: MyflowerDailyGoal | null) {
  if (!goal) {
    return null;
  }

  return {
    target_g: Number(goal.targetG),
    target_mg_thc:
      goal.targetMgThc === null ? null : Number(goal.targetMgThc),
    updated_at: goal.updatedAt.toISOString(),
  };
}

export function buildLogResponse(log: MyflowerLog) {
  const amountG = log.amountG === null ? null : Number(log.amountG);
  const amountMgThc =
    log.amountMgThc === null ? null : Number(log.amountMgThc);
  const displayStrainName =
    log.strainName ?? log.strainSlug ?? "Unknown strain";
  const displayAmountParts = [
    amountG !== null && Number.isFinite(amountG) ? `${amountG}g` : null,
    amountMgThc !== null && Number.isFinite(amountMgThc)
      ? `${amountMgThc}mg THC`
      : null,
  ].filter(Boolean) as string[];

  const occurredDate = log.occurredAt.toISOString();
  const [datePart, timePart] = occurredDate.split("T");

  return {
    id: log.id,
    occurred_at: occurredDate,
    product_type: log.productType,
    strain_slug: log.strainSlug,
    strain_name: log.strainName,
    amount_g: Number.isFinite(amountG ?? Number.NaN) ? amountG : null,
    amount_mg_thc: Number.isFinite(amountMgThc ?? Number.NaN)
      ? amountMgThc
      : null,
    notes: log.notes,
    photo_asset_id: log.photoAssetId,
    created_at: log.createdAt.toISOString(),
    display: {
      date: datePart,
      time: timePart?.replace("Z", "") ?? null,
      strain_name: displayStrainName,
      amount: displayAmountParts.length > 0 ? displayAmountParts.join(" / ") : null,
    },
  };
}
