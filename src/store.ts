import fs from "node:fs/promises";
import path from "node:path";
import type { QuestionData } from "./formatter.js";

const DB_DIR = ".db";
const QUESTIONS_FILE = path.join(DB_DIR, "questions.json");
const FIRST_ANSWERERS_FILE = path.join(DB_DIR, "firstAnswerers.json");
const ANSWERED_USERS_FILE = path.join(DB_DIR, "answeredUsers.json");

type StoreData = {
  questionDataMap: Map<string, QuestionData>;
  firstCorrectAnswererMap: Map<string, string>;
  answeredUsersMap: Map<string, Set<string>>;
};

async function ensureDir() {
  await fs.mkdir(DB_DIR, { recursive: true });
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function loadStore(): Promise<StoreData> {
  await ensureDir();

  const questionsRaw = await readJson<Record<string, QuestionData>>(QUESTIONS_FILE, {});
  const firstAnswerersRaw = await readJson<Record<string, string>>(FIRST_ANSWERERS_FILE, {});
  const answeredUsersRaw = await readJson<Record<string, string[]>>(ANSWERED_USERS_FILE, {});

  const questionDataMap = new Map(Object.entries(questionsRaw));
  const firstCorrectAnswererMap = new Map(Object.entries(firstAnswerersRaw));
  const answeredUsersMap = new Map(
    Object.entries(answeredUsersRaw).map(([k, v]) => [k, new Set(v)])
  );

  return { questionDataMap, firstCorrectAnswererMap, answeredUsersMap };
}

async function writeJson(filePath: string, data: unknown) {
  await ensureDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function saveQuestions(map: Map<string, QuestionData>) {
  await writeJson(QUESTIONS_FILE, Object.fromEntries(map));
}

export async function saveFirstAnswerers(map: Map<string, string>) {
  await writeJson(FIRST_ANSWERERS_FILE, Object.fromEntries(map));
}

export async function saveAnsweredUsers(map: Map<string, Set<string>>) {
  const plain: Record<string, string[]> = {};
  for (const [k, v] of map) {
    plain[k] = [...v];
  }
  await writeJson(ANSWERED_USERS_FILE, plain);
}
