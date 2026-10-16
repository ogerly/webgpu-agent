# WP-2026-10-16-ARCH-WAEC — Wächter/Supervisor-Architektur (Gedanken & Analyse)

**Status:** open — *Gedanken/Analyse, noch **nicht** als WH-Wahrheit fixiert*
**BY:** — / opencode / qwen/qwen3.8-27b / local
**Continued from:** `WP-2026-10-16-ARCH-SCAF-vite-ts-scaffold.md`
**Quellen (Rohmaterial):** `observe/modelle-gedanken-grok.md` (deine Gedanken + Grok + Gemini-Analyse)
**TOPIC:** ARCH · **Sub-Topic:** WAEC (Wächter)
**Erstellt:** 2026-10-16
**Baut auf:** `WH-001` (AAMS-B, autonomer Loop) + `idee.md` §3B (autonomer Loop)

> **Rollen-Trennung (AAMS):** Dieses WP hält **Gedanken & Analyse** (Wächter-Pattern, Modell-Strategie,
> UI, Token-Mgmt). Es ist **keine** WH-Wahrheit. Was sich als *stabil* erweist → erst **dann** als
> Decision in `WH-001` (oder neues `WH-002`) fixieren. Bis dahin: hier.

## session_goal
Nächste Architektur-Ebene sauber denken: **Wächter/Supervisor-Pattern** — ein kleines, dauerhaft
geladenes Modell orchestriert, lädt größere Modelle on-demand nach, startet Unteragenten, wartet auf
Ergebnis, entlädt das große Modell (VRAM frei) und schreibt Ergebnis + Audit-Log in AAMS-B (IndexedDB).
Dazu: UI-Konzept (3-Panel) + Token-Management. Ziel: klare Optionen, offene Fragen, Entscheidungsvorschläge.

## gedanken & analyse (kuratiert aus `observe/modelle-gedanken-grok.md`)

### 1. Wächter/Supervisor-Pattern (Kern)
- **Wächter** = kleines, **immer resident**es Modell, kleiner Context (1–2K), wenig VRAM.
- **Orchestrierungs-Loop:** Task analysieren → „welches Modell brauche ich jetzt?" →
  großes Modell **nachladen** → **Unteragent** damit starten → **auf Ergebnis warten** →
  großes Modell **entladen** (VRAM freigeben) → Ergebnis + Audit-Log in AAMS-B schreiben.
- = der *autonome Loop* aus `idee.md` §3B, konkretisiert als Supervisor/Worker-Split.
- Wächter liefert vor allem **strukturierte (JSON) Ausgaben** — auch ganz kleine Modelle schaffen das.

### 2. Modell-Strategie (resident vs. on-demand)
| Rolle | Kandidaten (Beispiele) | Größe (ca.) | Anmerkung |
|-------|------------------------|-------------|-----------|
| **Wächter (resident)** | `SmolLM2-360M-Instruct-q4f16_1-MLC`, `Qwen2.5-0.5B-Instruct-q4f16_1-MLC` | 210–450 MB | immer geladen, Routing/Steuerung/JSON |
| **Workhorse (on-demand)** | `Llama-3.2-3B-Instruct-q4f16_1-MLC`, `Qwen2.5-3B/4B`, `Qwen2.5-Coder-3B` | 1,1–2,2 GB | bei Bedarf laden, danach entladen |
| **Schweres (on-demand)** | `Qwen2.5-7B`, `Llama-3.1-8B`, `DeepSeek-R1-Distill-*` | 4–5 GB | nur bei genug VRAM |
- Quellen: `huggingface.co/mlc-ai` · WebLLM-Repo `prebuiltAppConfig.model_list` · `chat.webllm.ai`
- Quantisierung bevorzugt `q4f16_1`; Browser mit WebGPU (Chrome/Edge).

### 3. UI-Konzept (3-Panel)
- **Panel 1 — Haupt-Chat & Planung:** Aufgabe eingeben → Agent zerlegt in Sub-Tasks → stellt
  **Gegenfragen** vor Start (wenn Unklarheit) → interaktiver Startpunkt.
- **Panel 2 — Supervisor- & Unteragenten-Log:** Wächter-Ansicht (Live-Gedanken, Modell-Wechsel per
  Dropdown) + separater Unteragenten-Strang („Modell geladen: Llama-3.2-3B", „OCR-Modell aktiv", „Task 2.1 in Bearbeitung…").
- **Panel 3 — Live AAMS-Gedächtnis (Markdown-Explorer):** `task-tree.md`, `audit.md`,
  `research-notes.md` live einsehbar/editierbar → volle Transparenz, was der Agent ins Gedächtnis schreibt.

### 4. Token-Management (Hard Management)
- **Rolling Window:** Wächter liest **nie** den ganzen Verlauf — nur (a) High-Level-Status,
  (b) aktive Sub-Task, (c) AAMS-Metadaten aus IndexedDB.
- **Heartbeat (≈1 min):** System-/VRAM-Zustand prüfen, Zeitstempel im Gedächtnis aktualisieren.
- **Task-Loop (15–30 min / schrittweise):** nach jedem Schritt Ergebnis **komprimieren** → als
  Markdown in IndexedDB schreiben → aktiven Context **bereinigen** (*Token Flushing*).

### 5. Workflow-Beispiel (vom Prompt zum Ergebnis)
1. Eingabe: „Recherchiere Thema X + Zusammenfassung".
2. **Wächter** zerlegt in Tasks, bewertet sichtbar: „Task 1: Wächter reicht · Task 2 (Deep Research): Llama-3.2-3B laden".
3. Unklar? → **Gegenfrage** vor Start.
4. Ausführung: Task 1 → Zwischenergebnis in Gedächtnis; Task 2 → großes Modell laden → verarbeiten → entladen.
5. Abschluss: Vollzug, Stand in IndexedDB, JSON-Export möglich.

## open_questions
1. **Wächter-Modell fixieren:** SmolLM2-360M vs. Qwen2.5-0.5B? (→ WH-Decision)
2. **Unteragenten-Mechanik:** eine Engine + `reload()` vs. mehrere Engines parallel? (VRAM-Grenzen!)
3. **Panel 3 (Markdown-Explorer):** AAMS-B als `.md`-Dateien in IndexedDB — genau wie lesen/schreiben?
4. **Token-Budget:** wie viel Context pro Schritt? (Konstante/Config)
5. **Gegenfragen-Mechanik:** wann darf der Wächter fragen, wann autonom weitermachen?
6. Welche der Gedanken sind **stabil genug** für eine WH-Decision?

## decision-candidates (VORSCHLAG — erst bei Bestätigung in WH)
| Kandidat | Vorschlag | In WH? |
|----------|-----------|--------|
| Wächter/Supervisor-Pattern (resident klein + on-demand groß) | Kernarchitektur des Agenten | → ja (WH-001 §? / WH-002) |
| Modell-Strategie (2 Stufen: resident / on-demand) | ja | → ja |
| UI 3-Panel (Chat / Supervisor-Log / Live-Gedächtnis) | Vorschlag | → erst Design-WP, dann ggf. WH |
| Token-Mgmt (Rolling Window + Heartbeat + Flushing) | ja | → ja |

## next_steps
- [ ] **Bestätigen:** welche Gedanken → WH-Decision (WH-001 erweitern oder WH-002 anlegen)
- [ ] Wächter-Mechanik spezifizieren (Engine-Reload vs. Multi-Engine, VRAM-Budget)
- [ ] UI-Panel 3: AAMS-B-Dateien-Modell (`.md` in IndexedDB) klären
- [ ] Umsetzung: **Supervisor-Loop** in `src/agent/` (ersetzt die Scaffold-Platzhalter in `plan()`/`runStep()`)
- [ ] Modelle in `src/llm/webllm.ts` (resident Wächter + on-demand Workhorse) anbinden
