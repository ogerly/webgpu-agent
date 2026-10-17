# WP-2026-10-17-ARTIFACT — V4 Schritt 1: artifact.create (HTML: Vorschau + Download)

**Status:** closed ✅ (2026-10-17 — **V4 Schritt 1 umgesetzt** (typecheck+build ✅), **live im Einsatz**; Browser-Checkliste §6 als erledigt gewertet (User: „alle 4") · **Wahrheiten gesichert:** WH-001 **DR #5** + WH-002 **DR #10** · **Schritt 2 (ZIP/mehrdateiig/docx/xlsx) = eigener WP** (Kandidat; verfolgt in WP-PROPOSAL §V4 + Doku „Forschungsziel 5"))
**BY:** — / opencode / qwen/qwen3.8-27b / local
**Continued from:** `WP-2026-10-17-PROPOSAL-opfs-pyodide-extension-hermes-lite.md` (V4 = „angepasst übernommen")
**TOPIC:** ARTIFACT (neu im topic_registry) · **Sub-Topic:** V4-STEP1
**Erstellt:** 2026-10-17
**Charakter:** **Umsetzung** (kleiner, einzeln prüfbarer Schritt) — die HTML-Ergebnisse des
Agenten werden endlich **echte Dateien**: Vorschau + Download im Dashboard. Schließt die
nachgewiesene Lücke der Website-Aufgabe (Session `s_…_8i6ma8`: 6/6 „done", **0 Dateien** auf Disk).

## session_goal

Jedes Task-Ergebnis, das ein HTML-Dokument enthält, ist im Tab **Arbeit** sofort als
**Artefakt** erkennbar: `👁 Vorschau` (sandboxed-iframe) + `⬇ index.html` (Download).
Jede Aktion ist im **Audit** nachvollziehbar (`artifact.ready` / `artifact.preview` /
`artifact.download`). Die Webseite der Browser-Agenten-Session ist damit **zum ersten Mal
als Datei abrufbar** — ohne Schema-Änderung.

## design-decisions (warum)

| # | Entscheidung | Begründung |
|---|--------------|------------|
| D1 | **Derivierte Artefakte, keine gespeicherten** | `extractHTMLArtifact(task.result)` = **reine, deterministische Funktion** über der AAMS-B-Session (Quelle der Wahrheit). → **Kein Schema-Eingriff (L4)**, kein neuer Zustand, kein Reset-Aufwand, überlebt Sessions-Reset automatisch (dazu gehört das Resultat). |
| D2 | **Sandbox-Preview:** `<iframe sandbox="allow-scripts">` **ohne** `allow-same-origin` | Opaque Origin: Modell-Code darf rendern/läuft, hat aber **keinen** Zugriff auf Elternseite, Cookies oder Storage (WP-PROPOSAL §V4: „muss wirklich isoliert sein"). Beim Schließen wird `srcdoc` geleert (Scripts gestoppt). |
| D3 | **Audit-Triple:** `artifact.ready` (Agent, bei Task-Fertigstellung) + `artifact.preview` / `artifact.download` (User-Aktion) | Konsistent mit dem AAMS-Prinzip „dokumentieren, was geschah"; User-Aktionen laufen über den WGA-Hook `onArtifact` → `pushAudit` + Persist (gleiches Hook-Muster wie `onExport`/`onImport`). |
| D4 | **Extraktions-Regeln (kein LLM):** (1) größter Fenced-Block mit `<html>` gewinnt · (2) sonst Rohtext als Dokument (auch ungeschlossenes — kleine Modelle dürfen abschneiden) · (3) sonst null | Deterministisch + beobachtbar; reines CSS/JS (ohne HTML) ist **kein** HTML-Artefakt → keine falschen Buttons. |
| D5 | **Dateiname: `index.html`** (User benennt beim Download um) | Deterministisch; Titel-Slugifizierung wäre Fuzzy-Logik mit 3B-Modell-Titeln = instabil. Benennung aus dem Kontext (z. B. `blog.html`) = Schritt 2. |

## umsetzung

| Datei | Änderung |
|-------|----------|
| `src/artifact/extract.ts` | **neu** — `HTMLArtifact`-Typ + `extractHTMLArtifact()` (Fenced-Blöcke / Rohtext, null-fall) |
| `src/artifact/io.ts` | **neu** — `downloadArtifact()` (Blob + `<a download>`, Pattern aus `aams/io.ts`) |
| `src/agent/agent.ts` | `runStep()`: nach `llm.execute` → Artefakt-Prüfung → Audit `artifact.ready` + Chat-Zeile „📦 index.html bereit …" |
| `src/ui/api.ts` | WGA: Hook `onArtifact(taskId, action)`; Buttons `👁/⬇` im Task-Tree (Event-Delegation, da innerHTML-Render); `showPreview()`/`closePreview()` (srcdoc + stoppen); `kindFromAction`: `artifact.*` → Feed-Kategorie `task` |
| `src/main.ts` | Hook `onArtifact` → `pushAudit` + `aamsStore.save` + Feed-Zeile |
| `index.html` | Preview-Modal (`#pvModal`, iframe `sandbox="allow-scripts"`, Header mit Download/Schließen) |
| `src/ui/theme.css` | `.task .art` (Button-Reihe) + `.pv*` (Modal, Design-Tokens) |

**Verifiziert:** `npm run typecheck` ✅ · `npm run build` ✅ (Chunk-Warnung = bekannte WebLLM-Lib, präexistent)

## browser-checkliste (OFFEN — User)

1. Task mit HTML-Ergebnis (z. B. alte Website-Aufgabe neu laufen lassen) → Tab **Arbeit** zeigt
   `👁 Vorschau` + `⬇ index.html` unter dem Task.
2. **Vorschau:** Modal öffnet, Seite rendert; Hinweis „sandboxed · kein Zugriff auf diese Seite".
3. **Download:** `index.html` landet im Download-Ordner, öffnet sich im Browser.
4. **Audit:** Einträge `artifact.ready` (+ `artifact.preview`/`artifact.download` bei Klicks) im
   Tab **Audit** (Filter `task`) + im JSON-Export.
5. **Reset:** nach „↺ Gedächtnis zurücksetzen" verschwinden die Tasks (korrekt); Artefakt-Buttons
   tauchen nur bei Tasks mit HTML-Resultat auf (kein Phantom-Zustand).
6. **Negativfall:** Task mit reinem CSS/Text → **keine** Artefakt-Buttons.

## nicht in Schritt 1 (Schritt 2 = eigener WP, wenn gewünscht)

- **Mehrdateiig / ZIP** (JSZip lazy): mehrere Task-Ergebnisse zu einem Paket (z. B. die 4
  Website-Dateien `index/blog/impressum/style`) + Dateinamen je Datei.
- **docx / xlsx / PDF** (pdf-lib, SheetJS) — nur bei Szenario-Bedarf (WP-PROPOSAL §V4:
  „Nur das übernehmen, was ein Szenario braucht").
- **Vorschau nicht-HTML-Artefakte** (nur Text-Ansicht).
- **Dateiname aus Kontext** (z. B. `blog.html` statt `index.html`).

## Schluss (2026-10-17)

- **User:** „Alle 4" (Freigabe des Schlusses von UI-DASH, BENCH-IMPL, ARTIFACT, WEBSITE).
- **Wahrheiten gesichert (vor Schluss):** WH-001 **DR #5** (Artefakte abgeleitet, Sandbox ohne `allow-same-origin`) + WH-002 **DR #10** (HTML-Aufgaben dateibeweisbar) · Doku §5 (Problem P6 Datei-Output).
- **Nichts verloren:** **Schritt 2 (ZIP/mehrdateiig, docx/xlsx, Dateinamen aus Kontext) = eigener WP** — Kandidat bleibt in WP-PROPOSAL §V4 (Reihenfolge V4→V1→V5→V3→V2) + Doku „Forschungsziel 5".
- → `closed/`

## verweise

- `WORKING/WORKPAPER/WP-2026-10-17-PROPOSAL-opfs-pyodide-extension-hermes-lite.md` §V4 + §3 Matrix (V4)
- `WORKING/WORKPAPER/WP-2026-10-17-WEBSITE-…` (die Lücke, die dieser Schritt schließt)
- `WORKING/WHITEPAPER/WH-001-…` §3 (L4: Schema bleibt unverändert)
- Code: `src/artifact/{extract,io}.ts` · `src/agent/agent.ts` (runStep) · `src/ui/api.ts` (WGA) · `index.html` (Modal)
