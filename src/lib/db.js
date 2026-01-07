import { openDB } from 'idb';

const DB_NAME = 'ZenTab_DB';
const STORE_NAME = 'wallpapers';

// Bumped version to 2 to force a schema refresh
export const initDB = async () => {
  return openDB(DB_NAME, 2, { 
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

export const saveWallpaper = async (file) => {
  try {
    const db = await initDB();
    // Using 'readwrite' transaction explicitly for safety
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.store.put(file, 'current');
    await tx.done;
    console.log("Wallpaper saved successfully to IDB");
    return true;
  } catch (err) {
    console.error("IDB Save Error:", err);
    throw err;
  }
};

export const getWallpaper = async () => {
  try {
    const db = await initDB();
    return await db.get(STORE_NAME, 'current');
  } catch (err) {
    console.error("IDB Get Error:", err);
    return null;
  }
};

export const clearWallpaper = async () => {
  const db = await initDB();
  await db.delete(STORE_NAME, 'current');
};