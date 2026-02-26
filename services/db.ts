const DB_NAME = 'techwizardry_crm';
const DB_VERSION = 1;

type StoreName =
  | 'staff'
  | 'candidates'
  | 'inventory'
  | 'invoices'
  | 'jobSheets'
  | 'attendance'
  | 'purchases'
  | 'vendors'
  | 'stores'
  | 'stockTransfers'
  | 'returnLogs';

const storeConfig: Record<StoreName, { keyPath: string; autoIncrement: boolean }> = {
  staff: { keyPath: 'id', autoIncrement: false },
  candidates: { keyPath: 'id', autoIncrement: false },
  inventory: { keyPath: 'id', autoIncrement: false },
  invoices: { keyPath: 'id', autoIncrement: false },
  jobSheets: { keyPath: 'id', autoIncrement: false },
  attendance: { keyPath: 'id', autoIncrement: true },
  purchases: { keyPath: 'id', autoIncrement: false },
  vendors: { keyPath: 'id', autoIncrement: false },
  stores: { keyPath: 'id', autoIncrement: false },
  stockTransfers: { keyPath: 'id', autoIncrement: false },
  returnLogs: { keyPath: 'id', autoIncrement: false }
};

let dbInstance: IDBDatabase | null = null;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      Object.entries(storeConfig).forEach(([name, cfg]) => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: cfg.keyPath, autoIncrement: cfg.autoIncrement });
        }
      });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await open();
  return dbInstance;
}

async function clearStore(store: StoreName): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    const req = os.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function putMany(store: StoreName, items: any[]): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    const cfg = storeConfig[store];
    const write = () => {
      let idx = 0;
      const step = () => {
        if (idx >= items.length) return;
        const item = items[idx++];
        const req = cfg.autoIncrement ? os.add(item) : os.put(item);
        req.onsuccess = step;
        req.onerror = () => reject(req.error);
      };
      step();
    };
    const clr = os.clear();
    clr.onsuccess = write;
    clr.onerror = () => reject(clr.error);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAll<T = any>(store: StoreName): Promise<T[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const os = tx.objectStore(store);
    const req = os.getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

export const dbService = {
  init: async () => {
    await getDB();
  },
  putMany,
  getAll,
  exportAll: async () => {
    const result: Record<string, any[]> = {};
    for (const store of Object.keys(storeConfig) as StoreName[]) {
      result[store] = await getAll(store);
    }
    return result;
  },
  importAll: async (payload: Record<string, any[]>) => {
    const stores = Object.keys(storeConfig) as StoreName[];
    for (const store of stores) {
      const items = (payload && payload[store]) ? payload[store] : [];
      await putMany(store, items);
    }
  }
};
