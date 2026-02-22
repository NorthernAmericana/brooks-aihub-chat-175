import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { StrainListItem } from "@/components/myflowerai/strain-library";

type StrainRecord = {
  id?: string;
  strain?: {
    name?: string;
    type?: string;
    brand?: string;
    aliases?: string[];
  };
  description?: {
    dispensary_bio?: string;
    product_positioning?: string;
  };
  stats?: {
    total_thc_percent?: number | null;
    total_cbd_percent?: number | null;
    top_terpenes?: Array<{
      name?: string | null;
    }>;
  };
  coa?: {
    status?: string;
    provenance_lab?: string | null;
    provenance_method?: string | null;
    provenance_batch?: string | null;
    provenance_test_date?: string | null;
    completed_at?: string | null;
  };
  meaning?: {
    effect_tags?: string[];
    dominant_terpenes?: string[];
  };
  tags?: string[];
  sources?: Array<{
    type?: string;
    where?: string;
    url?: string | null;
  }>;
};

const DESCRIPTION_FALLBACK = "Description coming soon.";

const safeReadFile = async (filePath: string) => {
  try {
    return await readFile(filePath, "utf-8");
  } catch {
    return null;
  }
};

const safeReadDir = async (directoryPath: string) => {
  try {
    return await readdir(directoryPath);
  } catch {
    return [];
  }
};

const parseStrainRecord = (raw: string): StrainRecord | null => {
  try {
    return JSON.parse(raw) as StrainRecord;
  } catch {
    return null;
  }
};

const isPlaceholderStrain = (record: StrainRecord): boolean => {
  const id = record.id?.toLowerCase() ?? "";
  const name = record.strain?.name?.toLowerCase() ?? "";

  return id.startsWith("example-") || name.startsWith("example ");
};

const formatPercent = (value?: number | null): string | null => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  const rounded = Math.round(value * 10) / 10;
  return `${rounded}%`;
};

const calculateThcCbdRatio = (
  thcPercent?: number | null,
  cbdPercent?: number | null
): string | null => {
  if (
    thcPercent === null ||
    thcPercent === undefined ||
    cbdPercent === null ||
    cbdPercent === undefined ||
    Number.isNaN(thcPercent) ||
    Number.isNaN(cbdPercent)
  ) {
    return null;
  }

  if (cbdPercent <= 0) {
    return `${Math.round(thcPercent * 10) / 10}:0`;
  }

  const ratio = thcPercent / cbdPercent;
  return `${Math.round(ratio * 10) / 10}:1`;
};

const buildCoaQualityLabel = (record: StrainRecord): string => {
  const coa = record.coa;
  if (!coa) {
    return "COA quality: unavailable";
  }

  const qualitySignals = [
    coa.provenance_lab,
    coa.provenance_method,
    coa.provenance_batch,
    coa.provenance_test_date,
    coa.completed_at,
  ].filter(
    (value) => typeof value === "string" && value.trim().length > 0
  ).length;

  if (qualitySignals >= 4) {
    return "COA quality: high (batch-linked)";
  }
  if (qualitySignals >= 2) {
    return "COA quality: moderate";
  }

  return coa.status?.trim()
    ? `COA quality: limited (${coa.status.trim()})`
    : "COA quality: limited";
};

const uniqueList = (values: Array<string | null | undefined>): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) {
      continue;
    }

    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(trimmed);
  }

  return result;
};

const toListItem = (record: StrainRecord): StrainListItem | null => {
  const id = record.id?.trim();
  const name = record.strain?.name?.trim();

  if (!id || !name || isPlaceholderStrain(record)) {
    return null;
  }

  const dispensaryBio = record.description?.dispensary_bio;
  const productPositioning = record.description?.product_positioning;
  const trimmedBio = dispensaryBio?.trim();
  const trimmedPositioning = productPositioning?.trim();

  let description = DESCRIPTION_FALLBACK;
  if (trimmedBio) {
    description = trimmedBio;
  } else if (trimmedPositioning) {
    description = trimmedPositioning;
  }

  return {
    id,
    name,
    type: record.strain?.type,
    brand: record.strain?.brand,
    aliases: record.strain?.aliases,
    description,
    thcRange: formatPercent(record.stats?.total_thc_percent),
    cbdRange: formatPercent(record.stats?.total_cbd_percent),
    thcPercent: record.stats?.total_thc_percent ?? null,
    cbdPercent: record.stats?.total_cbd_percent ?? null,
    thcCbdRatio: calculateThcCbdRatio(
      record.stats?.total_thc_percent,
      record.stats?.total_cbd_percent
    ),
    coaQuality: buildCoaQualityLabel(record),
    terpenes: uniqueList([
      ...(record.stats?.top_terpenes ?? []).map((terpene) => terpene.name),
      ...(record.meaning?.dominant_terpenes ?? []),
    ]),
    effects: uniqueList([
      ...(record.meaning?.effect_tags ?? []),
      ...(record.tags ?? []),
    ]),
    sources: record.sources ?? [],
  };
};

export async function loadStrains(): Promise<StrainListItem[]> {
  const dataRoot = path.join(process.cwd(), "data", "myflowerai");
  const strainMap = new Map<string, StrainListItem>();

  const ndjsonPath = path.join(dataRoot, "strains.ndjson");
  const ndjsonContent = await safeReadFile(ndjsonPath);

  if (ndjsonContent) {
    const lines = ndjsonContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    for (const line of lines) {
      const record = parseStrainRecord(line);
      if (!record) {
        continue;
      }

      const listItem = toListItem(record);
      if (!listItem || strainMap.has(listItem.id)) {
        continue;
      }

      strainMap.set(listItem.id, listItem);
    }
  }

  const strainsDir = path.join(dataRoot, "strains");
  const strainFiles = await safeReadDir(strainsDir);
  const jsonFiles = strainFiles.filter(
    (file) => file.endsWith(".json") && file !== "EXAMPLE-TEMPLATE.json"
  );
  const fileContents = await Promise.all(
    jsonFiles.map((file) => safeReadFile(path.join(strainsDir, file)))
  );

  for (const content of fileContents) {
    if (!content) {
      continue;
    }

    const record = parseStrainRecord(content);
    if (!record) {
      continue;
    }

    const listItem = toListItem(record);
    if (!listItem || strainMap.has(listItem.id)) {
      continue;
    }

    strainMap.set(listItem.id, listItem);
  }

  return Array.from(strainMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}
