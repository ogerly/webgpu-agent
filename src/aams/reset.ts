/**
 * AAMS(B) Session-Reset (idee.md §3A): Gedächtnis **komplett & sauber** zurücksetzen.
 *
 * WP-2026-10-16-SESS-RESET (Invarianten):
 *  - **Komplett:** tasks + auditLog + memory + knowledge + Session-Metadaten → neu.
 *  - **Nachvollziehbar:** neue Session startet mit genau einem `session.reset`-Eintrag
 *    (vorherige ID + Zählungen) → der Reset ist über die Grenze hinweg sichtbar.
 *  - **Fehler-sicher:** IndexedDB-Speichern schlägt fehl → In-Memory-Zustand wird
 *    zurückgerollt (kein halber Zustand), Fehler wird an den Aufrufer geworfen.
 *  - **In-Place:** das gleiche Dokument-Objekt wird mutiert (Pattern wie Import in
 *    `src/main.ts`) → keine hängenden Referenzen in Agent/KERN/UI.
 *
 * **Nicht** Teil des Resets: LLM-Engine/VRAM, WebLLM-Weights-Cache, Repo-Dateien.
 * (Safety-Export + KERN-Stop erfolgen in der Orchestrierung, s. `src/main.ts`.)
 */
import type { AAMSDocument, AAMSSession } from "./schema";
import { aamsStore } from "./store";

/** Ergebnis eines Resets (für UI-Meldungen + Beobachtung). */
export interface ResetReport {
  previousId: string;
  previousCounts: { tasks: number; auditLog: number; memory: number; knowledge: number };
  newId: string;
}

/** Feste Session-ID (gleiche Form wie bisher: `s_{epoch}_{suffix}`). */
export function newSessionId(): string {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Kompletter Reset der aktiven Session **in Place** (gleiche `doc`-Referenz).
 * Persistiert in IndexedDB; bei Fehler: Rollback des In-Memory-Zustands + Throw.
 */
export async function resetSession(doc: AAMSDocument): Promise<ResetReport> {
  const previousId = doc.session.id;
  const previousCounts = {
    tasks: doc.session.tasks.length,
    auditLog: doc.session.auditLog.length,
    memory: doc.session.memory.length,
    knowledge: doc.session.knowledge.length,
  };

  // Snapshot für den Rollback (falls das Speichern in IndexedDB fehlschlägt).
  const snapshot: AAMSSession = JSON.parse(JSON.stringify(doc.session));

  const now = Date.now();
  doc.session.id = newSessionId();
  doc.session.title = "Neue Session";
  doc.session.createdAt = now;
  doc.session.updatedAt = now;
  doc.session.status = "active";
  doc.session.tasks = [];
  doc.session.memory = [];
  doc.session.knowledge = [];
  doc.session.auditLog = [
    {
      id: `a_reset_${now}`,
      ts: now,
      actor: "user",
      action: "session.reset",
      note: `Gedächtnis zurückgesetzt. Vorherige Session ${previousId} (${previousCounts.tasks} Tasks, ${previousCounts.auditLog} Audit, ${previousCounts.memory} Memory, ${previousCounts.knowledge} Wissen) — Safety-Export ausgelöst.`,
    },
  ];

  try {
    await aamsStore.save(doc);
  } catch (err) {
    // Rollback: alter Zustand zurück — „sauber" heißt: kein halber Reset.
    doc.session = snapshot;
    throw new Error(
      `Reset fehlgeschlagen (Speicherfehler) — Zustand wiederhergestellt: ${(err as Error).message}`
    );
  }

  return { previousId, previousCounts, newId: doc.session.id };
}
