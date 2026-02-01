import { readFile } from "node:fs/promises";
import path from "node:path";

const CHALLENGES_FILE_PATH = path.join(
  process.cwd(),
  "data",
  "mycarmindato",
  "challenges.json"
);

type ChallengeRecord = {
  id: string;
  title: string;
  missionText: string;
  rotationCadenceDays: number;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

let cachedChallenges: ChallengeRecord[] | null = null;

const loadChallenges = async (): Promise<ChallengeRecord[]> => {
  if (cachedChallenges) {
    return cachedChallenges;
  }

  const contents = await readFile(CHALLENGES_FILE_PATH, "utf8");
  const parsed = JSON.parse(contents) as ChallengeRecord[];
  cachedChallenges = parsed.filter(
    (challenge) =>
      Boolean(challenge.id) &&
      Boolean(challenge.title) &&
      Boolean(challenge.missionText) &&
      Number.isFinite(challenge.rotationCadenceDays)
  );
  return cachedChallenges;
};

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const buildRotatingScore = (challenge: ChallengeRecord, now: Date) => {
  const cadenceDays = Math.max(1, Math.round(challenge.rotationCadenceDays));
  const dayIndex = Math.floor(now.getTime() / DAY_IN_MS);
  const cadenceBucket = Math.floor(dayIndex / cadenceDays);
  return hashString(`${challenge.id}-${cadenceBucket}`);
};

const shuffle = <T,>(values: T[]) => {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const excludeParam = searchParams.get("exclude") ?? "";
  const countParam = Number(searchParams.get("count") ?? "3");
  const useRandom = searchParams.get("random") === "1";

  const excludeIds = new Set(
    excludeParam
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );

  const challenges = await loadChallenges();
  const now = new Date();

  let available = challenges.filter((challenge) => !excludeIds.has(challenge.id));
  const excludedCount = challenges.length - available.length;

  if (available.length === 0) {
    available = challenges;
  }

  const ordered = useRandom
    ? shuffle(available)
    : [...available].sort(
        (a, b) => buildRotatingScore(a, now) - buildRotatingScore(b, now)
      );

  const count = Number.isFinite(countParam) && countParam > 0 ? countParam : 3;

  return Response.json({
    challenges: ordered.slice(0, count),
    generatedAt: now.toISOString(),
    excludedCount,
    totalAvailable: challenges.length,
  });
}
