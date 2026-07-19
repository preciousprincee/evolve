import Dexie from 'dexie';

// IndexedDB mirror of recent server data, purely for offline READ access in
// the PWA (viewing recent messages/memories with no connection). This is
// never written back to the server and never trusted as an auth boundary —
// it's a cache, refreshed from the backend whenever online.
export const db = new Dexie('evolveLocalCache');

db.version(1).stores({
  messages: 'id, createdAt',
  memories: 'id, category, createdAt',
  profile: 'id',
});

export async function cacheMessages(messages) {
  await db.messages.bulkPut(messages);
}

export async function cacheMemories(memories) {
  await db.memories.bulkPut(memories);
}

export async function getCachedMessages(limit = 50) {
  return db.messages.orderBy('createdAt').reverse().limit(limit).toArray();
}

export async function getCachedMemories() {
  return db.memories.toArray();
}
