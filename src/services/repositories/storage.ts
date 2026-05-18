export const STORAGE_KEYS = {
  session: 'game02:session',
  teams: 'game02:teams',
  setResults: 'game02:set_results',
} as const;

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const browserStorage: StorageAdapter = {
  getItem(key: string) {
    return localStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    localStorage.setItem(key, value);
  },
  removeItem(key: string) {
    localStorage.removeItem(key);
  },
};

export function createMemoryStorage(): StorageAdapter & { clear: () => void } {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
    clear: () => {
      map.clear();
    },
  };
}

export function readJson<T>(storage: StorageAdapter, key: string): T | null {
  const raw = storage.getItem(key);
  if (!raw) {
    return null;
  }
  return JSON.parse(raw) as T;
}

export function writeJson<T>(storage: StorageAdapter, key: string, value: T): void {
  storage.setItem(key, JSON.stringify(value));
}
