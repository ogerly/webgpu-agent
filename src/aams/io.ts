/**
 * AAMS(B) JSON-Export/Import (WH-001 §4 Export, §5 Schnittstellen).
 *
 * Manueller Download zur Sicherung des Projektstands (idee.md §3A/§3D).
 * **Keine Cloud** — Portabilität per Datei (WH-001 Invariant).
 */
import type { AAMSDocument } from "./schema";

/** Serialisiert das AAMS(B)-Dokument als gelesbares JSON. */
export function exportJSON(doc: AAMSDocument): string {
  return JSON.stringify(doc, null, 2);
}

/** Löst einen Download des AAMS(B)-Dokuments im Browser aus. */
export function downloadJSON(
  doc: AAMSDocument,
  filename = `aams-session-${doc.session.id}.json`
): void {
  const blob = new Blob([exportJSON(doc)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Parst + validiert ein importiertes AAMS(B)-Dokument. */
export function parseJSON(text: string): AAMSDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error("Ungültiges JSON: " + (e as Error).message);
  }
  const doc = parsed as AAMSDocument;
  if (!doc || typeof doc !== "object" || !doc.session) {
    throw new Error("Ungültiges AAMS-Dokument: fehlendes Feld 'session'.");
  }
  doc.session.tasks ??= [];
  doc.session.auditLog ??= [];
  doc.session.memory ??= [];
  doc.session.knowledge ??= [];
  return doc;
}
