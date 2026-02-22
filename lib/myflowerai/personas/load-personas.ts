import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export interface PersonaListItem {
  persona_id: string;
  display_name: string;
}

type PersonaRecord = {
  persona_id?: string;
  display_name?: string;
};

const safeReadDir = async (directoryPath: string) => {
  try {
    return await readdir(directoryPath);
  } catch {
    return [];
  }
};

const safeReadFile = async (filePath: string) => {
  try {
    return await readFile(filePath, "utf-8");
  } catch {
    return null;
  }
};

const parsePersonaRecord = (raw: string): PersonaRecord | null => {
  try {
    return JSON.parse(raw) as PersonaRecord;
  } catch {
    return null;
  }
};

export async function loadPersonas(): Promise<PersonaListItem[]> {
  const personasDir = path.join(process.cwd(), "data", "myflowerai", "personas");
  const personaFiles = await safeReadDir(personasDir);
  const jsonFiles = personaFiles.filter((file) => file.endsWith(".json"));

  const fileContents = await Promise.all(
    jsonFiles.map((file) => safeReadFile(path.join(personasDir, file)))
  );

  const personas: PersonaListItem[] = [];

  for (const content of fileContents) {
    if (!content) {
      continue;
    }

    const record = parsePersonaRecord(content);
    const personaId = record?.persona_id?.trim();
    const displayName = record?.display_name?.trim();

    if (!personaId || !displayName) {
      continue;
    }

    personas.push({
      persona_id: personaId,
      display_name: displayName,
    });
  }

  return personas.sort((a, b) => a.display_name.localeCompare(b.display_name));
}
