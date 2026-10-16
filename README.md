# webgpu-agent

**Local-First WebGPU Agent** — ein vollständig clientseitiger, autonomer Webagent im Browser.
AAMS als **natives Gedächtnis** (AAMS-Doppelrolle) + **WebLLM** (WebGPU) für lokale Inferenz.
Keine Cloud, keine Serverinfrastruktur → maximale Datensouveränität.

> **Architektur & Fundament:** `WORKING/WHITEPAPER/WH-001-ARCH-webgpu-single-agent-prototype.md`
> **Benchmark-System (Level 1–10, ≤ 4 GB VRAM):** `WORKING/WHITEPAPER/WH-002-BENCH-benchmark-levels-webgpu.md`
> **Dev-Prozess:** `READ-AGENT.md` + `.agent.json` (AAMS/2.6.0)

## Status
**Prototyp** (Vite + TypeScript). Kernpfade + **echter Agent-Loop**:
AAMS(B)-Store (IndexedDB) · Task-Queue · **Modell-Pool** (Wächter resident + Planer on-demand,
Auswahl + Download-Fortschritt in der UI) · **echte Zerlegung** (Planer-JSON) + **echte Ausführung**
(Executor-Regel, echte Token-Usage) · KERN-Prototyp (Tokenwächter, simuliert) · Gedächtnis-Reset.
**Benchmark-System** (Level 1–10) ist als `WH-002` fixiert; erste Testläufe + Benchmark-Seite folgen.

## Start
```bash
npm install
npm run dev        # → http://localhost:5173
npm run build      # → dist/ (relativ, läuft auch statisch)
npm run typecheck  # tsc --noEmit
```

> **WebGPU-Voraussetzung:** aktueller Browser mit WebGPU (Chrome/Edge).
> Die WebLLM-Weights werden beim ersten `load()` lazy geladen (siehe `src/llm/webllm.ts`).

## Features
- **AAMS(B)-Session** in IndexedDB: `session` + `tasks` (Task-Tree) + `auditLog` + `memory` + `knowledge`
- **Task-Queue:** Sub-Tasks mit Status `pending / in_progress / done`
- **Modell-Pool (Panel ①):** Wächter resident + Planer on-demand · **Modell-Auswahl** (Katalog ≤ 4 GB) +
  **Laden/Entladen** + **Download-Fortschritt** (Balken/%/Schritt/Zeit) · VRAM-Budget-Anzeige
- **Echter Agent-Loop:** Zerlegung via **Planer-JSON** → Task-Tree · Ausführung mit **Executor-Regel**
  (Teilaufgabe→Planer, Wurzel→Wächter) · **echte Token-Usage** + Audit-Spur (`llm.*`, `plan.*`)
- **Gedächtnis-Reset:** „Neue Session" komplett & sauber — automatischer Safety-Export, Audit-Spur (`session.reset`), Rollback bei Speicherfehler (idee.md §3A)
- **JSON-Export/Import:** Portabilität + Backup/Restore (keine Cloud)
- **WebLLM-Adapter (lazy):** WebGPU-Inferenz, austauschbar via `LLMEngine`-Interface

## Struktur
```
src/
├── aams/     # AAMS(B): Schema, Store (IndexedDB), JSON-IO, Reset   ← Herzstück (Doppelrolle)
├── agent/    # Agent-Core (Planer-JSON, Executor-Regel), Task-Queue
├── kern/     # KERN-Prototyp: Tokenwächter + mechanischer Loop
├── llm/      # LLMEngine-Interface, WebLLM-Adapter (lazy), Katalog + Modell-Pool
└── ui/       # UI-Verdrahtung (Panel ① Modell-Pool … ④ Gedächtnis)
```

## Nächste Schritte (→ Workpaper `next_steps` + `WH-002`)
- [x] LLM-gestützte **Task-Zerlegung** (Planer) + echte **Ausführung** im Loop
- [ ] **Benchmark-Seite:** Szenario-Textseiten L1–L5 + Start + Run-Report (`src/bench/*`)
- [ ] **Panel „Maschine“:** WebGPU/CPU/RAM/Speicher + MachineProfile (Reproduzierbarkeit)
- [ ] **Erster Testlauf:** L1 × 3 Kategorien × 5 Runs → WH-002 „bewiesen“-Standard (5/5)
- [ ] **Helfer-Modelle** (OCR / Translation / Web-Fetch) via Transformers.js, on-demand, VRAM danach frei
- [ ] **Tests** (Vitest) für `aams/*` + `task-queue` + `llm/pool`
- [ ] Auto-Loop-Timer (15–30 min) / manuelle Auslösung (idee.md §3B)
