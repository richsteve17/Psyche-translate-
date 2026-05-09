import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PROGRESS = 'psyche/progress/v1';

export type Progress = {
  /** moduleId -> set of completed item ids (phrases, drills, scenarios). */
  completed: Record<string, string[]>;
};

const empty: Progress = { completed: {} };

let cache: Progress | null = null;

async function load(): Promise<Progress> {
  if (cache) return cache;
  const raw = await AsyncStorage.getItem(KEY_PROGRESS);
  cache = raw ? (JSON.parse(raw) as Progress) : empty;
  return cache;
}

async function save(p: Progress): Promise<void> {
  cache = p;
  await AsyncStorage.setItem(KEY_PROGRESS, JSON.stringify(p));
}

export async function getProgress(): Promise<Progress> {
  return load();
}

export async function markComplete(moduleId: string, itemId: string): Promise<Progress> {
  const p = await load();
  const list = new Set(p.completed[moduleId] ?? []);
  list.add(itemId);
  const next: Progress = {
    completed: { ...p.completed, [moduleId]: Array.from(list) },
  };
  await save(next);
  return next;
}

export async function moduleCompletionCount(moduleId: string): Promise<number> {
  const p = await load();
  return p.completed[moduleId]?.length ?? 0;
}

export async function resetAll(): Promise<void> {
  await save(empty);
}
