/**
 * AAMS(B) — das native Gedächtnis-Schema des WebGPU-Agenten (Endprodukt).
 *
 * WH-001 §3: AAMS ist **doppelt** verankert.
 *   (A) Arbeitsgrundlage in diesem Repo (WORKING/)
 *   (B) die native Agenten-Architektur im Browser des Endnutzers (diese Dateien)
 *
 * Gleiche Logik, **getrennte Instanz**. Die Struktur hier spiegelt bewusst die
 * AAMS(A)-Ordnerstruktur — das ist die Doppelrolle in Code:
 *
 *   AAMS(A)  WORKING/…                →   AAMS(B)  src/aams/…
 *   WORKPAPER (Aufgaben)              →   tasks        (Task-Tree)
 *   DIARY     (Zeitindex)             →   auditLog     (Audit-Log)
 *   MEMORY    (LTM / Gedächtnis)      →   memory       (Langzeit-Kontext)
 *   WHITEPAPER (stabile Wahrheit)     →   knowledge    (stabile Regeln/Wissen)
 *
 * WH-001 §2: IndexedDB + JSON-Export als Persistenz (Decision #3).
 * WH-001 §5: AAMS-Schema = session_id + task_tree + audit_logs.
 */

export type TaskStatus = "pending" | "in_progress" | "done";

/** Sub-Task (idee.md §3B: Teilaufgaben-Tree). parentId = null → Wurzel-Aufgabe. */
export interface AAMSTask {
  id: string;
  parentId: string | null;
  title: string;
  detail?: string;
  status: TaskStatus;
  result?: string; // Ergebnis/Output nach Abschluss
  createdAt: number; // epoch ms
  updatedAt: number;
}

/** Audit-Log (spiegelt AAMS(A) DIARY — Zeitindex, was geschah wann). */
export interface AuditEntry {
  id: string;
  ts: number;
  actor: "agent" | "user";
  action: string; // z.B. "task.created", "task.done", "llm.call", "session.reset"
  target?: string;
  note?: string;
}

/** Langzeit-Kontext / Gedächtnis (spiegelt AAMS(A) MEMORY / LTM). */
export interface MemoryEntry {
  id: string;
  ts: number;
  kind: "decision" | "fact" | "note" | "skill";
  content: string;
  tags: string[];
}

/** Stabiles Wissen / Regeln (spiegelt AAMS(A) WHITEPAPER — Wahrheit-in-Zeit). */
export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

/** Eine Session = eine isolierte AAMS(B)-Instanz (WH-001 §2 Decision #4). */
export interface AAMSSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  status: "active" | "archived";
  tasks: AAMSTask[];
  auditLog: AuditEntry[];
  memory: MemoryEntry[];
  knowledge: KnowledgeEntry[];
}

/** Komplettes AAMS(B)-Dokument (eine Instanz; exportierbar/importierbar als JSON). */
export interface AAMSDocument {
  version: string; // Schema-Version
  session: AAMSSession;
}
