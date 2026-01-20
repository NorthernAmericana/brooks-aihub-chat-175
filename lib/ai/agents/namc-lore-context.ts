import fs from "node:fs/promises";
import path from "node:path";

export type CanonLevel = "Canon" | "Soft-canon" | "Draft" | "Unknown";

export type LoreFileEntry = {
  path: string;
  canonLevel: CanonLevel;
  snippet: string;
};

export type LoreCanonMap = Record<string, { files: LoreFileEntry[] }>;

const LORE_DICTIONARY_PATH = path.join(
  process.cwd(),
  "namc",
  "lore_dictionary.md"
);
const LORE_DIR = path.join(process.cwd(), "namc", "lore");

type DictionaryEntry = {
  project: string;
  relativePath: string;
};

const CANON_LEVELS: CanonLevel[] = ["Canon", "Soft-canon", "Draft", "Unknown"];

function normalizePath(relativePath: string): string {
  return relativePath.split(path.sep).join(path.posix.sep);
}

function titleCaseFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}

function normalizeCanonLevel(value?: string | null): CanonLevel {
  if (!value) return "Unknown";
  const lowered = value.toLowerCase();
  if (lowered.includes("soft")) return "Soft-canon";
  if (lowered.includes("draft") || lowered.includes("devlog")) return "Draft";
  if (lowered.includes("canon")) return "Canon";
  return "Unknown";
}

function parseLoreDictionary(content: string): DictionaryEntry[] {
  const entries: DictionaryEntry[] = [];
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const linkMatch = line.match(/\(([^)]+\.lore\.md)\)/i);
    if (!linkMatch) continue;
    const nameMatch = line.match(/\*\*([^*]+)\*\*/);
    const project =
      nameMatch?.[1]?.trim() ||
      titleCaseFromSlug(path.basename(linkMatch[1], ".lore.md"));
    const relativePath = linkMatch[1].startsWith("namc/")
      ? linkMatch[1]
      : path.posix.join("namc", linkMatch[1]);
    entries.push({ project, relativePath });
  }
  return entries;
}

function parseCanonLevel(content: string): CanonLevel {
  const statusMatch =
    content.match(/^\s*-\s*\*\*Status:\*\*\s*([^\n]+)/im) ??
    content.match(/^\s*Status:\s*([^\n]+)/im);
  return normalizeCanonLevel(statusMatch?.[1]);
}

function buildSnippet(content: string, maxLines = 14): string {
  const trimmed = content.replace(/^---[\s\S]*?---\s*/, "");
  const lines = trimmed.split(/\r?\n/);
  const snippetLines: string[] = [];
  for (const line of lines) {
    if (!line.trim() && snippetLines.length === 0) {
      continue;
    }
    snippetLines.push(line);
    if (snippetLines.length >= maxLines) {
      break;
    }
  }
  return snippetLines.join("\n").trim();
}

async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

async function loadLoreFiles(): Promise<LoreFileEntry[]> {
  const entries = await fs.readdir(LORE_DIR, { withFileTypes: true });
  const loreFiles = entries.filter(
    (entry) => entry.isFile() && entry.name.endsWith(".lore.md")
  );
  const results: LoreFileEntry[] = [];
  for (const file of loreFiles) {
    const filePath = path.join(LORE_DIR, file.name);
    const content = await readFileSafe(filePath);
    if (!content) continue;
    const canonLevel = parseCanonLevel(content);
    results.push({
      path: normalizePath(path.relative(process.cwd(), filePath)),
      canonLevel,
      snippet: buildSnippet(content),
    });
  }
  return results;
}

export async function buildNamcLoreCanonMap(): Promise<LoreCanonMap> {
  const dictionaryContent = await readFileSafe(LORE_DICTIONARY_PATH);
  const dictionaryEntries = dictionaryContent
    ? parseLoreDictionary(dictionaryContent)
    : [];
  const loreFiles = await loadLoreFiles();
  const loreByPath = new Map<string, LoreFileEntry>();
  for (const lore of loreFiles) {
    loreByPath.set(lore.path, lore);
  }

  const map: LoreCanonMap = {};
  for (const entry of dictionaryEntries) {
    const normalizedPath = normalizePath(entry.relativePath);
    const loreEntry = loreByPath.get(normalizedPath);
    if (!map[entry.project]) {
      map[entry.project] = { files: [] };
    }
    map[entry.project].files.push(
      loreEntry ?? {
        path: normalizedPath,
        canonLevel: "Unknown",
        snippet: "",
      }
    );
  }

  for (const loreEntry of loreFiles) {
    const alreadyMapped = Object.values(map).some((project) =>
      project.files.some((file) => file.path === loreEntry.path)
    );
    if (alreadyMapped) continue;
    const projectName = titleCaseFromSlug(
      path.basename(loreEntry.path, ".lore.md")
    );
    map[projectName] = { files: [loreEntry] };
  }

  return map;
}

export async function buildNamcLoreContext(): Promise<{
  canonMap: LoreCanonMap;
  contextText: string;
}> {
  const canonMap = await buildNamcLoreCanonMap();
  const snippetBlocks: string[] = [];

  for (const [project, { files }] of Object.entries(canonMap)) {
    for (const file of files) {
      const canonLevel = CANON_LEVELS.includes(file.canonLevel)
        ? file.canonLevel
        : "Unknown";
      snippetBlocks.push(
        [
          `project: ${project}`,
          `source_file: ${file.path}`,
          `canon_level: ${canonLevel}`,
          "snippet:",
          file.snippet || "(no snippet available)",
        ].join("\n")
      );
    }
  }

  const contextText = [
    "NAMC Lore Canon Map (project -> files -> canon_level):",
    JSON.stringify(canonMap, null, 2),
    "",
    "Lore Snippets (each includes canon_level metadata):",
    snippetBlocks.join("\n\n"),
    "",
    'If a user request cannot be grounded in these sources, label it as "Speculation" and ask the user to confirm before asserting canon.',
  ].join("\n");

  return { canonMap, contextText };
}
