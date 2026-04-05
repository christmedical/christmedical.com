import type { PatientDto } from "@/lib/patientTypes";

const DB_NAME = "christmedical-clinical";
const DB_VERSION = 1;
const STORE = "patients";

type StoredChunk = {
  tenantId: number;
  updatedAt: number;
  patients: PatientDto[];
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("indexedDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "tenantId" });
      }
    };
  });
}

export async function savePatientsOffline(
  tenantId: number,
  patients: PatientDto[],
): Promise<void> {
  const db = await openDb();
  const chunk: StoredChunk = {
    tenantId,
    updatedAt: Date.now(),
    patients,
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("indexedDB write failed"));
    tx.objectStore(STORE).put(chunk);
  });
}

export async function loadPatientsOffline(
  tenantId: number,
): Promise<PatientDto[] | null> {
  try {
    const db = await openDb();
    const chunk = await new Promise<StoredChunk | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(tenantId);
      req.onsuccess = () => resolve(req.result as StoredChunk | undefined);
      req.onerror = () => reject(req.error ?? new Error("indexedDB read failed"));
    });
    return chunk?.patients ?? null;
  } catch {
    return null;
  }
}
