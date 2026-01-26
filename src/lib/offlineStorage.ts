import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define the database schema
interface YearlyTrackDB extends DBSchema {
  daily_entries: {
    key: string;
    value: {
      id: string;
      user_id: string;
      date: string;
      data: Record<string, unknown>;
      synced: boolean;
      updated_at: string;
    };
    indexes: { 'by-date': string; 'by-synced': number };
  };
  user_scores: {
    key: string;
    value: {
      id: string;
      user_id: string;
      date: string;
      data: Record<string, unknown>;
      synced: boolean;
    };
    indexes: { 'by-date': string };
  };
  challenges: {
    key: string;
    value: {
      id: string;
      data: Record<string, unknown>;
      cached_at: string;
    };
  };
  reflections: {
    key: string;
    value: {
      id: string;
      user_id: string;
      data: Record<string, unknown>;
      synced: boolean;
      created_at: string;
    };
    indexes: { 'by-synced': number };
  };
  pending_sync: {
    key: string;
    value: {
      id: string;
      table: string;
      operation: 'insert' | 'update' | 'delete';
      data: Record<string, unknown>;
      created_at: string;
      retries: number;
    };
    indexes: { 'by-table': string };
  };
  auth_cache: {
    key: string;
    value: {
      key: string;
      session: Record<string, unknown> | null;
      user: Record<string, unknown> | null;
      cached_at: string;
    };
  };
  app_state: {
    key: string;
    value: {
      key: string;
      value: unknown;
      updated_at: string;
    };
  };
}

const DB_NAME = 'yearly-track-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<YearlyTrackDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<YearlyTrackDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<YearlyTrackDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Daily entries store
      if (!db.objectStoreNames.contains('daily_entries')) {
        const dailyStore = db.createObjectStore('daily_entries', { keyPath: 'id' });
        dailyStore.createIndex('by-date', 'date');
        dailyStore.createIndex('by-synced', 'synced');
      }

      // User scores store
      if (!db.objectStoreNames.contains('user_scores')) {
        const scoresStore = db.createObjectStore('user_scores', { keyPath: 'id' });
        scoresStore.createIndex('by-date', 'date');
      }

      // Challenges store
      if (!db.objectStoreNames.contains('challenges')) {
        db.createObjectStore('challenges', { keyPath: 'id' });
      }

      // Reflections store
      if (!db.objectStoreNames.contains('reflections')) {
        const reflectionsStore = db.createObjectStore('reflections', { keyPath: 'id' });
        reflectionsStore.createIndex('by-synced', 'synced');
      }

      // Pending sync queue
      if (!db.objectStoreNames.contains('pending_sync')) {
        const syncStore = db.createObjectStore('pending_sync', { keyPath: 'id' });
        syncStore.createIndex('by-table', 'table');
      }

      // Auth cache
      if (!db.objectStoreNames.contains('auth_cache')) {
        db.createObjectStore('auth_cache', { keyPath: 'key' });
      }

      // App state
      if (!db.objectStoreNames.contains('app_state')) {
        db.createObjectStore('app_state', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

// Daily Entries Operations
export async function saveDailyEntry(entry: YearlyTrackDB['daily_entries']['value']) {
  const db = await getDB();
  await db.put('daily_entries', entry);
}

export async function getDailyEntry(id: string) {
  const db = await getDB();
  return db.get('daily_entries', id);
}

export async function getDailyEntriesByDate(date: string) {
  const db = await getDB();
  return db.getAllFromIndex('daily_entries', 'by-date', date);
}

export async function getUnsyncedDailyEntries() {
  const db = await getDB();
  return db.getAllFromIndex('daily_entries', 'by-synced', 0);
}

export async function markDailyEntrySynced(id: string) {
  const db = await getDB();
  const entry = await db.get('daily_entries', id);
  if (entry) {
    entry.synced = true;
    await db.put('daily_entries', entry);
  }
}

// Pending Sync Queue Operations
export async function addToPendingSync(
  table: string,
  operation: 'insert' | 'update' | 'delete',
  data: Record<string, unknown>
) {
  const db = await getDB();
  const id = `${table}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await db.put('pending_sync', {
    id,
    table,
    operation,
    data,
    created_at: new Date().toISOString(),
    retries: 0,
  });
  return id;
}

export async function getPendingSync() {
  const db = await getDB();
  return db.getAll('pending_sync');
}

export async function removePendingSync(id: string) {
  const db = await getDB();
  await db.delete('pending_sync', id);
}

export async function incrementPendingSyncRetry(id: string) {
  const db = await getDB();
  const item = await db.get('pending_sync', id);
  if (item) {
    item.retries += 1;
    await db.put('pending_sync', item);
  }
}

// Auth Cache Operations
export async function cacheAuthSession(session: Record<string, unknown> | null, user: Record<string, unknown> | null) {
  const db = await getDB();
  await db.put('auth_cache', {
    key: 'current_session',
    session,
    user,
    cached_at: new Date().toISOString(),
  });
}

export async function getCachedAuthSession() {
  const db = await getDB();
  return db.get('auth_cache', 'current_session');
}

export async function clearAuthCache() {
  const db = await getDB();
  await db.delete('auth_cache', 'current_session');
}

// Challenges Cache Operations
export async function cacheChallenge(challenge: Record<string, unknown>) {
  const db = await getDB();
  await db.put('challenges', {
    id: challenge.id as string,
    data: challenge,
    cached_at: new Date().toISOString(),
  });
}

export async function cacheChallenges(challenges: Record<string, unknown>[]) {
  const db = await getDB();
  const tx = db.transaction('challenges', 'readwrite');
  await Promise.all([
    ...challenges.map((c) => tx.store.put({
      id: c.id as string,
      data: c,
      cached_at: new Date().toISOString(),
    })),
    tx.done,
  ]);
}

export async function getCachedChallenges() {
  const db = await getDB();
  const items = await db.getAll('challenges');
  return items.map((item) => item.data);
}

// Reflections Operations
export async function saveReflection(reflection: YearlyTrackDB['reflections']['value']) {
  const db = await getDB();
  await db.put('reflections', reflection);
}

export async function getUnsyncedReflections() {
  const db = await getDB();
  return db.getAllFromIndex('reflections', 'by-synced', 0);
}

// App State Operations
export async function setAppState(key: string, value: unknown) {
  const db = await getDB();
  await db.put('app_state', {
    key,
    value,
    updated_at: new Date().toISOString(),
  });
}

export async function getAppState<T>(key: string): Promise<T | null> {
  const db = await getDB();
  const item = await db.get('app_state', key);
  return item ? (item.value as T) : null;
}

// Clear all data
export async function clearAllData() {
  const db = await getDB();
  await Promise.all([
    db.clear('daily_entries'),
    db.clear('user_scores'),
    db.clear('challenges'),
    db.clear('reflections'),
    db.clear('pending_sync'),
    db.clear('auth_cache'),
    db.clear('app_state'),
  ]);
}

// Get pending sync count
export async function getPendingSyncCount() {
  const db = await getDB();
  return db.count('pending_sync');
}
