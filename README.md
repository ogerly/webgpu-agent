# webgpu-agent

**Local-First WebGPU Agent** — ein vollständig clientseitiger, autonomer Webagent im Browser.
AAMS als **natives Gedächtnis** (AAMS-Doppelrolle) + **WebLLM** (WebGPU) für lokale Inferenz.
Keine Cloud, keine Serverinfrastruktur → maximale Datensouveränität.

> **Architektur & Fundament:** `WORKING/WHITEPAPER/WH-001-ARCH-webgpu-single-agent-prototype.md`
> **Dev-Prozess:** `READ-AGENT.md` + `.agent.json` (AAMS/2.6.0)

## Status
**Scaffold** (Vite + TypeScript). Die Kernpfade stehen:
AAMS(B)-Store (IndexedDB) · Task-Queue · LLMEngine-Interface · WebLLM-Adapter (lazy) · UI.
LLM-gestützte Zerlegung/Ausführung ist noch **Platzhalter**.

## Start
```bash
npm install
npm run dev        # → http://localhost:5173
npm run build      # → dist/ (relativ, läuft auch statisch)
npm run typecheck  # tsc --noEmit
```

> **WebGPU-Voraussetzung:** aktueller Browser mit WebGPU (Chrome/Edge).
> Die WebLLM-Weights werden beim ersten `load()` lazy geladen (siehe `src/llm/webllm.ts`).

## Features (Scaffold)
- **AAMS(B)-Session** in IndexedDB: `session` + `tasks` (Task-Tree) + `auditLog` + `memory` + `knowledge`
- **Task-Queue:** Sub-Tasks mit Status `pending / in_progress / done`
- **JSON-Export/Import:** Portabilität + Backup/Restore (keine Cloud)
- **WebLLM-Adapter (lazy):** WebGPU-Inferenz, austauschbar via `LLMEngine`-Interface

## Struktur
```
src/
├── aams/     # AAMS(B): Schema, Store (IndexedDB), JSON-IO   ← Herzstück (Doppelrolle)
├── agent/    # Agent-Core, Task-Queue
├── llm/      # LLMEngine-Interface + WebLLM-Adapter (austauschbar)
└── ui/       # minimale UI-Verdrahtung
```

## Nächste Schritte (→ Workpaper `next_steps`)
- [ ] LLM-gestützte **Task-Zerlegung** (Planer) + echte **Ausführung** im Loop
- [ ] **Helfer-Modelle** (OCR / Translation / Web-Fetch) via Transformers.js, on-demand, VRAM danach frei
- [ ] **Tests** (Vitest) für `aams/*` + `task-queue`
- [ ] Auto-Loop-Timer (15–30 min) / manuelle Auslösung (idee.md §3B)
