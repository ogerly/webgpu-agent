# WP-2026-10-17 — PROPOSAL: Autonomer Browser-Agent – OPFS, Pyodide, Artefakt-Tools, Skills, optionale Web-Brücke

> **Typ:** Workpaper (Arbeitsdokument, **kein** Whitepaper)
> **Status:** open · **Vorschlag zur Prüfung**
> **Bezug:** WH-001 (Single-Agent-Prototyp) · WH-002 (Benchmark-Levels ≤ 4 GB VRAM)
> **Lebenszyklus:** Nach Prüfung wandern **übernommene** Punkte in Implementierungs-Workpapers; nur **strukturelle** Entscheidungen werden in WH-001/WH-002 nachgezogen. Danach → `closed/`.

---

## 0. Auftrag an den Agenten (bitte zuerst lesen)

Du bekommst hier eine Sammlung von Verbesserungsvorschlägen für den WebGPU-Agenten.
**Deine Aufgabe:**

1. **Prüfe** jeden Vorschlag (V1–V5) gegen das bestehende Konzept (WH-001, WH-002, AAMS/2.6.0) und gegen den tatsächlichen Code-Stand.
2. **Übernimm** nur, was zum Konzept passt. Lehne Vorschläge ab oder passe sie an, wenn sie einer Invariante widersprechen. Begründe jede Entscheidung in einer Zeile.
3. **Bring die Anwendung auf einen besseren Stand**: setze die übernommenen Punkte um, in kleinen, einzeln prüfbaren Schritten.
4. **Dokumentiere** strukturelle Änderungen als Decision Record im passenden Whitepaper. Alles andere bleibt Workpaper bzw. Code.
5. **Erfinde nichts dazu.** Wo ein Vorschlag eine Annahme enthält (z. B. Modellverfügbarkeit), prüfe sie am Code (`src/llm/catalog.ts`), nicht aus dem Gedächtnis.

## 1. Leitplanken (nicht verhandelbar)

| # | Leitplanke | Konsequenz für die Prüfung |
|---|-----------|----------------------------|
| L1 | **Autonom im Browser**: keine Abhängigkeit ins System (kein Server, kein Python/Node auf dem Rechner, kein Docker, kein Backend). | Jeder Vorschlag, der das braucht, ist **abzulehnen**. |
| L2 | **Offline nach Setup**: Einmal-Downloads (Modellgewichte, Pyodide, Libraries) sind erlaubt und sichtbar zu dokumentieren. Danach läuft alles ohne Netz (Service Worker/Cache). | Keine CDN-Aufrufe zur Laufzeit; Libraries werden lokal gebündelt (Vite). |
| L3 | **Einzige erlaubte Plattform-Abhängigkeit: Chromium-Extension**, und nur für Web-Zugriff (Suche/Seiten lesen). | Ohne Extension muss der Agent **voll funktionsfähig** bleiben; das Web-Tool meldet dann „nicht verfügbar". |
| L4 | **AAMS-Doppelrolle bleibt getrennt** (A ≠ B). Gemeinsames Schema wird nur über Decision Records geändert. | Speichermedium-Wechsel (V1) ändert das Schema **nicht**. |
| L5 | **Ziel-Hardware ≤ 4 GB VRAM** (WH-002). Wächter resident, Planer on-demand. | Neue Features dürfen kein zusätzliches Modell dauerhaft im VRAM halten. |
| L6 | **Degraded/Fehlende Fähigkeiten werden gekennzeichnet**, nie still ersetzt. | Gilt auch für fehlende Extension, OPFS-Fallback, Pyodide-Fehler. |

## 2. Vorschläge

### V1 — OPFS als primärer Speicher für AAMS-B

**Idee:** Das Agenten-Gedächtnis liegt als echter Dateibaum im **Origin Private File System** (spiegelt die `WORKING/`-Struktur: MEMORY, DIARY, LOGS, skills …). IndexedDB bleibt für Index, Session-Metadaten und Audit-Log. Optional: Sync in einen vom Nutzer gewählten Ordner (File System Access API, Chromium) → menschenlesbar, git-fähig. Export weiter als ZIP/JSON.

- **Nutzen:** Agent arbeitet mit „Dateien", wie AAMS es kennt; große Inhalte ohne IndexedDB-Record-Gefrickel; echte Portabilität.
- **Konzept-Fit:** Ändert nur das Medium, nicht das Schema (L4). Ergänzt WH-001 Entscheidung #3 (IndexedDB + JSON-Export).
- **Risiken:** Browser-Support-Unterschiede; Speicherquota; OPFS nicht für Nutzer sichtbar (daher Export/Sync wichtig).
- **Prüffragen:** Wird OPFS im Ziel-Browser unterstützt? Capability-Detection + Fallback auf reines IndexedDB umsetzbar? Bleibt „Gedächtnis-Reset pro Benchmark-Run" (WH-002) trivial?
- **Wenn übernommen:** Decision Record in WH-001 (Speichermedium), Capability-Detection mit gekennzeichnetem Fallback.

### V2 — Optionale Web-Brücke als Chromium-Extension (MV3)

**Idee:** Eine kleine Extension gibt dem Agenten Web-Zugriff. Sie lädt Seiten Cross-Origin (`host_permissions`), liefert den Text (DOM → bereinigter Text/Markdown) und bietet einen Side-Panel-Einstieg. Tools: `web.search`, `web.fetch`, `web.read`. Kommunikation Agent-Seite ↔ Extension über eine klar definierte Message-Schnittstelle (z. B. `externally_connectable` oder Content-Script-Bridge).

- **Nutzen:** Löst die CORS-/Same-Origin-Grenze, die eine normale Webseite nicht überwinden kann; ermöglicht den **Live-Web-Track** aus WH-002.
- **Konzept-Fit:** L3 erlaubt genau diese eine Abhängigkeit. Der Standard-Track (fixer Quellen-Korpus) bleibt unverändert und reproduzierbar.
- **Sicherheit (Pflicht):**
  - Berechtigungen minimal halten (optionale Host-Permissions, Freigabe durch den Nutzer pro Domain).
  - **Webinhalte sind untrusted Daten, nie Instruktionen** (Prompt-Injection). Tool-Ergebnisse werden als Daten markiert und dürfen keine Tool-Aufrufe auslösen.
  - Jeder Web-Zugriff erscheint im Audit-Log (URL, Zeit, Größe).
- **Risiken:** Extension-Distribution/Installation; Prompt-Injection durch Seiteninhalt; Reproduzierbarkeit (Live-Web ist nicht reproduzierbar → muss im Run-Log gekennzeichnet sein).
- **Prüffragen:** Reicht eine kleine Message-Schnittstelle? Kann der Agent ohne Extension sauber „Web: nicht verfügbar" melden (L6)?
- **Priorität:** zuletzt umsetzen (optional, kein Blocker für den Rest).

### V3 — Pyodide (Python-in-WebAssembly) im Web Worker

**Idee:** Python-Artefakte (Kategorie B Coding) werden **im Browser** ausgeführt und verifiziert, in einem separaten Worker mit Timeout (Worker beenden bei Überschreitung). Pyodide wird lokal gebündelt/gecached (L2), kein CDN zur Laufzeit.

- **Nutzen:** Schließt die in WH-002 benannte Grenze („Python-Artefakte außerhalb des Browsers verifiziert"); Coding-Level werden voll im Browser beweisbar.
- **Konzept-Fit:** Stärkt „geschlossener Testkreis im Browser" (WH-002 #9). **Berührt eine Kernentscheidung** → bei Übernahme muss WH-002 #9 als Decision Record aktualisiert werden.
- **Grenzen (ehrlich ausweisen):** nur reines Python bzw. Pyodide-kompatible Pakete; keine Sockets/kein Netz; Startzeit und Download-Größe (Setup); zusätzlicher RAM-Bedarf (nicht VRAM).
- **Prüffragen:** Wie groß ist der Setup-Download? Läuft die Ausführung stabil im Worker ohne WebGPU-Konflikt? Bleibt die Pass-Regel (5/5, 0 harte DoD-Verstöße) unverändert anwendbar?

### V4 — Artefakt-Erzeugung im Browser (HTML + Dokumente)

**Idee:** Ein Tool `artifact.create` erzeugt Ergebnisse rein clientseitig:

- **HTML:** als `Blob`, Vorschau in `<iframe sandbox srcdoc>` (ohne `allow-same-origin`), Download per `<a download>`.
- **Dokumente:** Word (`docx`), PDF (`pdf-lib`), Excel (`SheetJS`), Pakete (`JSZip`), jeweils lazy geladen und lokal gebündelt.

- **Nutzen:** Deckt die Kategorie-B/C- und L10-Szenarien (HTML-Übersicht, Dokumente) ohne Backend ab.
- **Konzept-Fit:** L1/L2 erfüllt; reine Tool-Erweiterung, kein Schema-Eingriff.
- **Risiken:** Bundle-Größe (daher lazy); das Sandbox-Iframe muss wirklich isoliert sein, weil das Modell den Code erzeugt.
- **Prüffragen:** Welche Formate sind für die Szenarien wirklich nötig? (Nur das übernehmen, was ein Szenario braucht.)

### V5 — „Hermes-lite": Skills, Reflexionsschritt, schlanke Tool-Registry

Inspiration ist das Konzept des Hermes Agent (Nous Research): vom Agenten gepflegter Speicher, Skills als prozedurales Gedächtnis, zusammenfassende Reflexionsschritte. **Kein Port, nur Konzepte**, die zu AAMS-B passen:

1. **Skills als Markdown-Dateien** in OPFS (`skills/<name>.md`, Frontmatter: `name`, `description`). **Progressive Disclosure:** nur Name + Beschreibung stehen im Kontext, der Body wird bei Bedarf geladen. Das ist wichtig für das kleine Kontextfenster.
2. **Reflexionsschritt („Nudge")** am Ende einer Aufgabe: Das Wächter-Modell schlägt Memory-Einträge vor (`kind: decision/fact`), die ins AAMS-B-Gedächtnis geschrieben werden. Er läuft nur zwischen Aufgaben, nie parallel zum Planer (L5).
3. **Selbstverbesserung nur mit Freigabe:** Kleine Modelle (0,5–3B) können Skills verschlechtern. Der Agent **schlägt Skill-Änderungen als Diff vor** (Audit-Log), der Nutzer gibt frei. Keine stillen Auto-Änderungen.
4. **Schlanke Tool-Registry (≤ 6 Tools):** `memory.*`, `skill.*`, `artifact.create`, `python.run` (V3), `web.*` (V2, optional). Einheitliches Schema mit Name, Beschreibung, Parametern und Ergebnis (Daten, kein Befehl).
5. **Modell-Prüfung (optional):** Ob eine Function-Calling-trainierte Variante (z. B. Hermes-3 auf Llama-3.2-3B-Basis) im WebLLM-Katalog vorhanden ist, **am Code prüfen** (`src/llm/catalog.ts`) und nur bei ≤ 4-GB-Passung gegen den bisherigen Planer benchmarken.

- **Konzept-Fit:** Skills und Reflexion sind Erweiterungen von AAMS-B-Memory; der Executor-Regel-Determinismus (WH-002 #6) bleibt erhalten.
- **Risiken:** Kontextfenster-Verbrauch; Qualität bei kleinen Modellen; Skill-Wildwuchs (daher Freigabe).

## 3. Entscheidungs-Matrix (vom Agenten auszufüllen)

> **Ausgefüllt:** 2026-10-17 · BY: — / opencode / qwen/qwen3.8-27b / local
> (Prüfung gegen WH-001, WH-002, AAMS/2.6.0 + Code-Stand; Prüf-Notizen in §3.1)

| # | Vorschlag | Entscheidung (übernommen / angepasst / abgelehnt) | Begründung (1 Zeile) | Betroffene Doku |
|---|-----------|----------------------------------------------------|----------------------|-----------------|
| V1 | OPFS als Primärspeicher | **übernommen** | L1/L4 erfüllt (Medium-Wechsel, Schema bleibt); Agent bekommt echten Dateibaum wie AAMS es kennt; Capability-Detection + IDB-Fallback (L6); WH-001 DR #3 wird **erweitert** (IDB bleibt für Index/Metadaten/Audit), nicht ersetzt | WH-001 (DR zu #3) |
| V2 | Web-Brücke (Extension) | **übernommen (optional, zuletzt)** | L3 erlaubt genau diese eine Plattform-Abhängigkeit; WH-002 #3 kennt Live-Web bereits als *gekennzeichneten* Zusatz-Track → passt; ohne Extension läuft der Agent voll weiter (L6: „Web: nicht verfügbar") | WH-001 (L3-DR) · WH-002 (Track-Kennzeichnung) |
| V3 | Pyodide im Worker | **angepasst übernommen** | L1/L2 erfüllt (lokaler Bundle, Worker + Timeout); **berührt WH-002 #9** (stabile Grenzen-Ausweis) → DR erst **nach 5/5-Proof** der In-Browser-Verifikation; Scope: Core-Pyodide ohne Paket-Ökosystem, RAM (nicht VRAM) im Run-Log ausweisen | WH-002 #9 (DR) |
| V4 | Artefakt-Erzeugung | **angepasst übernommen (Scope: HTML + ZIP zuerst; docx/xlsx nur bei Szenario-Bedarf)** | Schließt die **nachgewiesene Lücke** (Website-Task Session `s_…_8i6ma8`: 6/6 „done", 0 Dateien auf Disk); L1/L2 erfüllt, kein Schema-Eingriff; Sandbox-iframe **ohne** `allow-same-origin` ist Pflicht, weil das Modell den Code erzeugt | – (Code) |
| V5 | Hermes-lite (Skills/Reflexion/Registry) | **angepasst übernommen (V5.1–V5.4); V5.5 abgelehnt** | Skills/Reflexion sind Erweiterungen des AAMS-B-Memory (Schema kennt bereits `kind: "skill"`); Tool-Registry muss als **Prompt-Level-JSON** laufen (LLMEngine hat kein Function-Calling, s. `src/llm/engine.ts`) — wie das bestehende Planer-JSON; **V5.5: kein Hermes-Modell im Katalog** (`src/llm/catalog.ts`: 7 Modelle, keines Hermes; nächster Hermes = 8B ≈ > 5,1 GB → außerhalb des ≤ 4-GB-Profils, WH-002 §3.2) → Watch-Liste, nicht Plan | WH-001 (DR: Skills = prozedurales Memory) |

### 3.1 Prüf-Notizen (am Code verifiziert, 2026-10-17)

1. **Kontextfenster (Ground-Truth `src/llm/catalog.ts`):** alle 7 Katalog-Modelle =
   **4096 Tokens** (Prebuilt-Config). → Progressive Disclosure (V5.1) ist bei diesem
   Kontext **kein Nice-to-have, sondern Pflicht** (nur Name + Beschreibung im Kontext,
   Body bei Bedarf aus OPFS laden).
2. **Tool-Aufrufe (Ground-Truth `src/llm/engine.ts`):** `chat(messages, opts)` —
   reines Nachrichten-Interface, **keine** Function-Calling/Tool-API in der
   WebLLM-Integration. → V5.4-Registry = JSON-in-Prompt + robustes Parsing +
   1 Retry (exakt das Planer-JSON-Pattern aus WH-002 §4), nicht native Tool-Calls.
3. **Modell-Check V5.5 (Ground-Truth `src/llm/catalog.ts`):** 7 Instruct-Modelle
   (Qwen2.5/Llama-3.2, 0.5–3 B, q4f16_1) — **kein Hermes-Modell**; 7B/8B-Klasse
   ≈ > 5100 MB (WH-002 §3.2) → außerhalb Zielprofil. V5.5 = abgelehnt (Watch-Liste:
   neu prüfen, wenn WebLLM ein passendes Hermes-Prebuild ≤ 4 GB anbietet).
4. **WH-002 #9 ist eine stabile Grenzen-Ausweis-Entscheidung** („Python außerhalb
   verifiziert") → V3 darf sie **nur** per Decision Record ändern, und der ehrliche
   Pfad ist: erst In-Browser-Verifikation 5/5 nachweisen, dann #9 aktualisieren
   (und im Run-Log: Pyodide-Version, Worker-Timeout, RAM).
5. **Reihenfolge:** V1 vor V5 (Skills brauchen OPFS) ist zwingend; **V4 kann vor V1**
   umgesetzt werden (Blobs + Download brauchen kein OPFS) und schließt die
   demonstrierte Lücke sofort → empfohlene Praxis-Reihenfolge: **V4 → V1 → V5 → V3 → V2**
   (jeder Schritt einzeln, s. §4).

## 4. Empfohlene Reihenfolge

1. **V1** (Speicher, Fundament für V5)
2. **V4** (Tools für die Szenarien, geringes Risiko)
3. **V3** (Python-Verifikation, berührt WH-002 #9)
4. **V5** (Skills/Reflexion, baut auf V1 auf)
5. **V2** (optionale Extension, zuletzt)

Jeder Schritt einzeln umsetzen, einzeln prüfen, dann erst der nächste.

## 5. Definition of Done

- Jede übernommene Änderung läuft **ohne Systemabhängigkeit** im Browser (L1) und nach dem Setup **offline** (L2).
- Ohne Extension funktioniert der komplette Agent weiter; das fehlende Web-Tool ist gekennzeichnet (L3, L6).
- Die Benchmark-Szenarien (WH-002) laufen unverändert weiter; neue Fähigkeiten verändern weder die Level-Definition noch die Pass-Regel.
- Strukturelle Änderungen stehen als Decision Record in WH-001/WH-002; die Entscheidungs-Matrix (Abschnitt 3) ist ausgefüllt.
- Abgelehnte Vorschläge sind mit Begründung dokumentiert (auch das ist ein Ergebnis).

## 6. Nicht-Ziele

- Kein Backend, kein lokaler Server, keine Cloud-Anbindung.
- Kein Multi-Agent-Mesh / WebRTC.
- Kein 1:1-Port des Hermes Agent (40+ Tools, Messaging-Gateway, Terminal-Backends sind bewusst außen vor).
- Keine stillen Selbständerungen von Skills oder Schema.

## 7. Verweise

* → `WORKING/WHITEPAPER/WH-001-ARCH-webgpu-single-agent-prototype.md`
* → `WORKING/WHITEPAPER/WH-002-BENCH-benchmark-levels-webgpu.md`
* → Katalog (Ground-Truth): `src/llm/catalog.ts` · Pool: `src/llm/pool.ts`
* → AAMS-Contract: `.agent.json`
