/**
 * V4 Schritt 1 (WP-…-PROPOSAL §V4, Entscheidung: angepasst übernommen) —
 * **artifact.create: HTML**.
 *
 * **Deriviertes Artefakt, nicht gespeichert** (L4: keine Schema-Änderung):
 * Das HTML-Artefakt wird **deterministisch aus `task.result`** extrahiert
 * (Quelle der Wahrheit = AAMS-B-Session). Kein neuer Zustand, keine
 * Speicher-Last, überlebt den Session-Reset (dazu gehört das Resultat).
 *
 * Regeln (deterministisch, kein LLM):
 * 1. Fenced-Code-Block (```html … ``` / ``` … ```): der **größte** Block mit
 *    `<html>` gewinnt (z. B. wenn HTML- und CSS-Blöcke nebeneinander stehen).
 * 2. Sonst: der Rohtext ist selbst ein HTML-Dokument (ab erster
 *    `<!DOCTYPE`/`<html` bis letztes `</html>`; auch ungeschlossenes
 *    Dokument — kleine Modelle dürfen abschneiden, Browser verzeihen).
 * 3. Sonst (z. B. reines CSS/JS): **kein** Artefakt → null
 *    (mehrdateiige Ergebnisse = Schritt 2, eigener WP: ZIP).
 */

export interface HTMLArtifact {
  /** Komplettes HTML-Dokument (exakt der Dateiinhalt). */
  html: string;
  /** Dateiname-Vorschlag (User kann beim Download umbenennen). */
  filename: string;
  /** Dateigröße in Bytes (für Audit/Anzeige). */
  bytes: number;
}

const FENCED = /```[a-zA-Z0-9]*\n([\s\S]*?)```/g;
const HAS_HTML = /<html[\s>]/i;

/** Extrahiert ein HTML-Dokument aus einem Task-Ergebnis (null, wenn keines). */
export function extractHTMLArtifact(result?: string | null): HTMLArtifact | null {
  if (!result) return null;
  const text = result;
  if (!HAS_HTML.test(text)) return null;

  // 1) Fenced-Blöcke: der größte mit <html> gewinnt.
  const blocks: string[] = [];
  FENCED.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = FENCED.exec(text)) !== null) blocks.push(m[1]);
  let best: string | null = null;
  for (const b of blocks) {
    if (HAS_HTML.test(b) && (best === null || b.length > best.length)) best = b;
  }
  if (best !== null) return make(best);

  // 2) Rohtext = komplettes (ggf. ungeschlossenes) Dokument.
  const starts = [text.search(/<!doctype html/i), text.search(/<html[\s>]/i)].filter((i) => i >= 0);
  if (starts.length > 0) {
    const s = Math.min(...starts);
    const end = text.lastIndexOf("</html>");
    const e = end >= s ? end + "</html>".length : text.length;
    return make(text.slice(s, e));
  }
  return null;
}

function make(html: string): HTMLArtifact {
  const doc = html.trim();
  return { html: doc, filename: "index.html", bytes: new TextEncoder().encode(doc).length };
}
