const STORAGE_PREFIX = "kitakyushu-itclub:ar-stamps";

export function storageKey(eventId) {
  return `${STORAGE_PREFIX}:${eventId}`;
}

export function createEmptyProgress(eventId) {
  return { version: 1, eventId, stamps: {}, updatedAt: null };
}

export function normalizeProgress(value, eventId) {
  if (!value || value.version !== 1 || value.eventId !== eventId || typeof value.stamps !== "object") {
    return createEmptyProgress(eventId);
  }
  return value;
}

export function addStamp(progress, pointId, now = new Date().toISOString()) {
  return {
    ...progress,
    stamps: { ...progress.stamps, [pointId]: progress.stamps[pointId] || now },
    updatedAt: now
  };
}

export function countValidStamps(progress, pointIds) {
  return pointIds.filter((id) => Boolean(progress.stamps[id])).length;
}

export function createStampStore(eventId, storage = window.localStorage) {
  const key = storageKey(eventId);
  return {
    load() {
      try {
        return normalizeProgress(JSON.parse(storage.getItem(key)), eventId);
      } catch {
        return createEmptyProgress(eventId);
      }
    },
    save(progress) {
      storage.setItem(key, JSON.stringify(progress));
      return progress;
    },
    clear() {
      storage.removeItem(key);
    }
  };
}
