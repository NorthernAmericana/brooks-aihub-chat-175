import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

export type NamcLoreDocument = {
  filePath: string;
  content: string;
};

export type NamcLoreSnippet = NamcLoreDocument & {
  score: number;
};

const MAX_CONTEXT_CHARS = 6000;
const DEFAULT_MAX_SNIPPETS = 4;
const namcRoot = path.join(process.cwd(), "namc");
const loreDirectories = ["lore", "projects"];
const topLevelFiles = ["lore_dictionary.md", "timeline_master.md"];

let cachedDocuments: NamcLoreDocument[] | null = null;

const normalizeFilePath = (filePath: string) =>
  path.relative(process.cwd(), filePath).replace(/\\/g, "/");

const collectMarkdownFiles = async (directory: string): Promise<string[]> => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
};

const loadNamcLoreDocuments = async (): Promise<NamcLoreDocument[]> => {
  const filePaths = new Set<string>();

  for (const directory of loreDirectories) {
    const fullDirectory = path.join(namcRoot, directory);
    const markdownFiles = await collectMarkdownFiles(fullDirectory);
    markdownFiles.forEach((filePath) => filePaths.add(filePath));
  }

  for (const fileName of topLevelFiles) {
    filePaths.add(path.join(namcRoot, fileName));
  }

  const documents = await Promise.all(
    [...filePaths].map(async (filePath) => {
      const content = await fs.readFile(filePath, "utf8");
      return {
        filePath: normalizeFilePath(filePath),
        content: content.trim(),
      } satisfies NamcLoreDocument;
    })
  );

  return documents;
};

export const getNamcLoreDocuments = async (): Promise<NamcLoreDocument[]> => {
  if (!cachedDocuments) {
    cachedDocuments = await loadNamcLoreDocuments();
  }

  return cachedDocuments;
};

const extractQueryTerms = (message: string): string[] => {
  const matches = message.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
  return [...new Set(matches)];
};

const countOccurrences = (text: string, term: string): number => {
  let count = 0;
  let currentIndex = 0;

  while (true) {
    const nextIndex = text.indexOf(term, currentIndex);
    if (nextIndex === -1) {
      break;
    }

    count += 1;
    currentIndex = nextIndex + term.length;
  }

  return count;
};

const scoreDocument = (document: NamcLoreDocument, terms: string[]): number => {
  const content = document.content.toLowerCase();
  const filePath = document.filePath.toLowerCase();

  return terms.reduce((total, term) => {
    const contentScore = countOccurrences(content, term);
    const fileScore = filePath.includes(term) ? 2 : 0;
    return total + contentScore + fileScore;
  }, 0);
};

export const getRelevantNamcLoreSnippets = async (
  message: string,
  options: { maxSnippets?: number } = {}
): Promise<NamcLoreSnippet[]> => {
  const terms = extractQueryTerms(message);
  if (terms.length === 0) {
    return [];
  }

  const documents = await getNamcLoreDocuments();
  const scoredDocuments = documents
    .map((document) => ({
      ...document,
      score: scoreDocument(document, terms),
    }))
    .filter((document) => document.score > 0)
    .sort((a, b) => b.score - a.score);

  return scoredDocuments.slice(0, options.maxSnippets ?? DEFAULT_MAX_SNIPPETS);
};

export const buildNamcLoreContext = async (
  message: string,
  options: { maxSnippets?: number; maxChars?: number } = {}
): Promise<string | null> => {
  const snippets = await getRelevantNamcLoreSnippets(message, options);
  if (snippets.length === 0) {
    return null;
  }

  const maxChars = options.maxChars ?? MAX_CONTEXT_CHARS;
  let context = "NAMC LORE CONTEXT\n";
  let remaining = maxChars - context.length;

  for (const [index, snippet] of snippets.entries()) {
    if (remaining <= 0) {
      break;
    }

    const header = `\n[${index + 1}] ${snippet.filePath}\n`;
    if (header.length > remaining) {
      break;
    }

    context += header;
    remaining -= header.length;

    const content = snippet.content.trim();
    if (content.length > remaining) {
      const truncated = content.slice(0, Math.max(0, remaining - 1));
      context += `${truncated.trimEnd()}…`;
      remaining = 0;
      break;
    }

    context += content;
    remaining -= content.length;
  }

  return context.trim();
};
