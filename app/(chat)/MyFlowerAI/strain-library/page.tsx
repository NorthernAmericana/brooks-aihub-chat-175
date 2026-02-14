import path from "node:path";
import { readFile, readdir } from "node:fs/promises";
import { StrainLibrary } from "@/components/myflowerai/strain-library";
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

  if (!id || !name) {
    return null;
  }

  if (isPlaceholderStrain(record)) {
    return null;
  }

  const dispensaryBio = record.description?.dispensary_bio;
  const productPositioning = record.description?.product_positioning;
  let description = DESCRIPTION_FALLBACK;
  const trimmedBio = dispensaryBio?.trim();
  const trimmedPositioning = productPositioning?.trim();

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

const loadStrains = async (): Promise<StrainListItem[]> => {
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
};

export default async function StrainLibraryPage() {
  const strains = await loadStrains();

  return <StrainLibrary strains={strains} />;
}
