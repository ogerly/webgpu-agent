/**
 * V4 Schritt 1: Artefakt-I/O — Download + Preview-Kontrakt.
 *
 * - **Download:** Blob + `<a download>` (gleiches Pattern wie
 *   `src/aams/io.ts → downloadJSON`) — läuft in **allen** Browsern,
 *   ohne Berechtigungen (L1).
 * - **Preview:** die UI (WGA) rendert `<iframe sandbox="allow-scripts"
 *   srcdoc="…">` — **ohne `allow-same-origin`** → Opaque Origin:
 *   kein Zugriff auf die Elternseite, keine Cookies/Storage; der Code des
 *   Modells darf laufen, aber nichts erreichen.
 *   → WP-…-PROPOSAL §V4: „Das Sandbox-Iframe muss wirklich isoliert sein,
 *     weil das Modell den Code erzeugt."
 */
import type { HTMLArtifact } from "./extract";

/** Löst den Download des HTML-Artefakts aus (User kann umbenennen). */
export function downloadArtifact(a: HTMLArtifact): void {
  const blob = new Blob([a.html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const el = document.createElement("a");
  el.href = url;
  el.download = a.filename;
  el.click();
  URL.revokeObjectURL(url);
}
