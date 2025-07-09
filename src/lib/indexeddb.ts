// --- IndexedDB Utility ---
const DB_NAME = "streakTrackerDB";
const DB_VERSION = 1;
const STREAKS_STORE = "streaks";
const GOAL_STORE = "goal";

let db: IDBDatabase | null = null;

interface StreakData {
  id: string;
  date: Date;
  isCompleted: boolean;
}

interface GoalData {
  id: string;
  targetDays: number;
  currentStreakDays: number;
  lastStreakUpdate: Date | null;
}

export const openIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STREAKS_STORE)) {
        dbInstance.createObjectStore(STREAKS_STORE, { keyPath: "date" }); // Date as key
      }
      if (!dbInstance.objectStoreNames.contains(GOAL_STORE)) {
        dbInstance.createObjectStore(GOAL_STORE, { keyPath: "id" }); // 'userGoal' as key
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      console.error(
        "IndexedDB error:",
        (event.target as IDBOpenDBRequest).error
      );
      reject("Failed to open IndexedDB");
    };
  });
};

const getObjectStore = (
  storeName: string,
  mode: IDBTransactionMode
): IDBObjectStore => {
  if (!db) throw new Error("IndexedDB not open.");
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
};

export const getStreaksFromIDB = async (): Promise<StreakData[]> => {
  const dbInstance = await openIndexedDB();
  const store = getObjectStore(STREAKS_STORE, "readonly");
  const request = store.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () =>
      resolve(
        request.result.map((item) => ({ ...item, date: new Date(item.date) }))
      );
    request.onerror = () => reject(request.error);
  });
};

export const getGoalFromIDB = async (): Promise<GoalData | null> => {
  const dbInstance = await openIndexedDB();
  const store = getObjectStore(GOAL_STORE, "readonly");
  const request = store.get("userGoal");
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const result = request.result;
      if (result) {
        resolve({
          ...result,
          lastStreakUpdate: result.lastStreakUpdate
            ? new Date(result.lastStreakUpdate)
            : null,
        });
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

export const putStreakInIDB = async (streak: StreakData): Promise<void> => {
  const dbInstance = await openIndexedDB();
  const store = getObjectStore(STREAKS_STORE, "readwrite");
  const dataToStore = { ...streak, date: streak.date.toISOString() }; // Store date as ISO string
  return new Promise((resolve, reject) => {
    const request = store.put(dataToStore);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const putGoalInIDB = async (goal: GoalData): Promise<void> => {
  const dbInstance = await openIndexedDB();
  const store = getObjectStore(GOAL_STORE, "readwrite");
  const dataToStore = {
    ...goal,
    lastStreakUpdate: goal.lastStreakUpdate
      ? goal.lastStreakUpdate.toISOString()
      : null,
  };
  return new Promise((resolve, reject) => {
    const request = store.put(dataToStore);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
