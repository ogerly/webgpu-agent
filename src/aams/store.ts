/**
 * AAMS(B) Store — Persistenz in IndexedDB (WH-001 §2 Decision #3).
 *
 * IndexedDB statt localStorage: asynchron, großes Volumen, saubere Portabilität.
 * Eine DB hält die aktive Session-Instanz (AAMS-B).
 *
 * WH-001 §3: Getrennt von AAMS(A) in WORKING/ — gleiche Logik, andere Instanz.
 */
import type { AAMSDocument } from "./schema";

const DB_NAME = "aams-webgpu-agent";
const STORE = "documents";
const KEY = "current"; // aktive Session

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open fehlgeschlagen"));
  });
}

export const aamsStore = {
  /** Aktive Session laden (null, wenn noch keine). */
  async load(): Promise<AAMSDocument | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const g = tx.objectStore(STORE).get(KEY);
      g.onsuccess = () => resolve((g.result as AAMSDocument | undefined) ?? null);
      g.onerror = () => reject(g.error);
    });
  },

  /** Aktive Session speichern (Zwischenspeicherung, idee.md §3D). */
  async save(doc: AAMSDocument): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(doc, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  /** Session-Reset (idee.md §3A): leere Instanz, saubere Task-Queue. */
  async clear(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};
