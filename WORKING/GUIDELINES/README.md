# GUIDELINES — Projekt-Konventionen

> Konventionen für **Code + Zusammenarbeit** in diesem Repo.
> Basis: `WH-001` (Quelle der Wahrheit) + AAMS-Contract (`.agent.json`, AAMS/2.6.0).

## AAMS-Doppelrolle in Code (WH-001 §3 — Fundament)
- **AAMS(A) — Dev:** `WORKING/` steuert unseren Prozess (Workpaper → Whitepaper → LTM).
- **AAMS(B) — Agent:** `src/aams/*` ist das **native Gedächtnis-Modell des Produkts**.
- **Regel:** Die Struktur in `src/aams/` spiegelt die Logik von `WORKING/`
  (Tasks↔Workpaper, Audit-Log↔Diary, Memory↔LTM, Knowledge↔Whitepaper),
  ist aber eine **getrennte Instanz** (Browser-IndexedDB ≠ Repo). **Nicht vermischen.**

## Stack
- **Vite + TypeScript** (local-first). `base: "./"` → läuft auch statisch.
- **WebLLM** (`@mlc-ai/web-llm`) für WebGPU-Inferenz — **lazy** geladen (erst bei `load()`).
- **IndexedDB** für Persistenz (AAMS-B). **JSON-Export/Import** für Portabilität.
- Kein Build-/Cloud-Laufzeitbedarf (WH-001 Invariant).

## Code-Style
- TypeScript `strict`. Keine `any`. Interfaces für alle Kontrakte.
- Kleine, fokussierte Module (je 1 Verantwortung).
- Kommentare auf **Deutsch** (Projekt-Kontext), API-Namen auf **Englisch**.
- Keine Cloud-Abhängigkeiten im Kernpfad.
- LLM-Zugriffe nur über die `LLMEngine`-Interface (austauschbar), nie hart verdrahtet.

## Struktur
```
src/
├── aams/     # AAMS(B): Schema, Store (IndexedDB), JSON-IO   ← Herzstück
├── agent/    # Agent-Core, Task-Queue
├── llm/      # LLMEngine-Interface + WebLLM-Adapter (austauschbar)
└── ui/       # minimale UI-Verdrahtung
```

## Tests
- **Aufbau (nächster Schritt):** Vitest + jsdom für `aams/*` (Store/IO) + `task-queue`.
- Ziel: Schema-Validierung, Task-Status-Maschine, JSON-Roundtrip.

## Workflows
- **Neue strukturelle Entscheidung** → erst in `WH-001` (Decision-Record) verankern, dann Code.
- **Session-Lebenszyklus** (Dev) → `on_session_start` / `on_session_end` (`.agent.json`).
