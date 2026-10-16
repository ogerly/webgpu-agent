# WP-2026-10-16-ARCH-SCAF — Code-Scaffold (Vite+TS) planen & umsetzen

**Status:** closed ✅ (2026-10-16 — Scaffold gebaut & verifiziert; Kernerfolg weitergeführt)
**BY:** — / opencode / qwen/qwen3.8-27b / local
**Continued from:** `WP-2026-10-16-BOOT-INIT-aams-first-entry-bootstrap.md` (→ `closed/`)
**TOPIC:** ARCH · **Sub-Topic:** SCAF
**Erstellt:** 2026-10-16
**Implementiert gegen:** `WH-001` (Quelle der Wahrheit)

> **Rollen-Trennung (AAMS) — bewusst festgehalten:**
> - **WH-001** = *Wahrheit* (Doppelrolle, Kernarchitektur, Invarianten). **Nicht** für Planung/Umsetzung.
> - **Dieses WP** = *Plan + Umsetzung + Verifikation* des Scaffolds (task-scoped; bei Ende → `closed/`).
>
> Der Code implementiert WH-001; er *definiert* die Architektur nicht. Änderungen an
> strukturellen Entscheidungen gehen zurück in WH-001, nicht in dieses WP.

## session_goal
Den Code-Scaffold nach WH-001 umsetzen: AAMS(B)-Kern (Schema/Store/IO), Agent-Core +
Task-Queue, WebLLM-Adapter (lazy), UI — so dass `typecheck` + `build` grün sind und die
AAMS-Doppelrolle in Code sichtbar wird (`src/aams/*` spiegelt die Logik aus `WORKING/`).

## plan (vor Umsetzung)
**Abhängigkeits-Reihenfolge:**
`schema` → `store` + `io` → `task-queue` → `engine` (Interface) + `webllm` (Adapter) → `agent` → `ui` + `main` → Config.

**Prinzipien:**
- LLM-Interface zuerst (austauschbar); der Agent spricht nur die Interface, nie die Lib direkt.
- WebLLM **lazy** (dynamischer Import) → Scaffold läuft ohne Model-Download.
- UI zuletzt (hängt an Store + Agent).
- `base: "./"` → Build läuft auch statisch (Local-First, WH-001 Invariant).

**Risiko & Definition of Done:**
| Risiko | DoD |
|--------|-----|
| WebLLM-API-Drift (Version) | `tsc --noEmit` + `vite build` grün, Adapter an **echte** Typen gebunden |
| zu früh „fertig" erklären | Platzhalter (LLM-Planer / -Ausführung) **explizit als TODO** markiert |

## key_findings
- **WebLLM-API (v0.2.86):** `CreateMLCEngine(modelId, MLCEngineConfig?)`; GPU-Auswahl liegt in
  `AppConfig` (kein `gpuSelection` auf Config-Ebene). `chat.completions.create()` → OpenAI-style;
  `message.content` ist `string | null`. → Adapter + `InitProgressCallback` danach ausgerichtet.
- **AAMS-B ≡ AAMS-A:** Tasks↔Workpaper · Audit-Log↔Diary · Memory↔LTM · Knowledge↔Whitepaper.
- Build warnt bei 6MB-Chunk (WebLLM) — wird **lazy/on-demand** geladen (erwartet, kein Fehler).

## repository_inventory (Zustand nach Umsetzung)
| Pfad | Zweck | Status |
|------|-------|--------|
| `src/aams/{schema,store,io}.ts` | **AAMS(B)-Kern:** Schema, IndexedDB, JSON-IO | gebaut ✅ |
| `src/agent/{agent,task-queue}.ts` | Agent-Core, Sub-Task-Tree | gebaut ✅ (Ausführung = Platzhalter) |
| `src/llm/{engine,webllm}.ts` | LLMEngine-Interface + WebLLM-Adapter (lazy) | gebaut ✅ |
| `src/ui/app.ts`, `src/main.ts` | UI-Verdrahtung, Boot | gebaut ✅ |
| `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts` | Vite+TS-Grundgerüst (`base:"./"`) | gebaut ✅ |
| `README.md`, `WORKING/GUIDELINES/README.md` | Doku + Konventionen | gebaut ✅ |

## implementation
Wie Inventory; Details in den Header-Kommentaren je Datei. **Platzhalter (bewusst):**
`agent.ts` → `plan()` legt Wurzel + Sub-Task an, `runStep()` markiert `done` — beide mit
`TODO: LLM-Planer / echte Ausführung`. Der echte LLM-Pfad kommt als nächster Baustein.

## verification
| Check | Ergebnis |
|-------|----------|
| `npm install` | ✅ 13 pkgs · **2 vulns (1 moderate, 1 high)** — nicht force-fix (breaking) |
| `npm run typecheck` (`tsc --noEmit`) | ✅ exit 0 |
| `npm run build` (`vite build`) | ✅ 12 modules · WebLLM als lazy-Chunk |

## open_questions
1. **LLM-Planer:** Prompt-Strategie für die Sub-Task-Zerlegung? (JSON-Mode / Function-Call / Freitext?)
2. **Helfer-Modelle:** welche zuerst (OCR / Translation / Web-Fetch)?
3. **Tests:** Vitest + jsdom — Setup jetzt oder erst mit Planer?
4. **npm audit:** welche 2 Pakete (1 high)? → identifizieren + entscheiden.

## file_protocol
| Datei | Aktion |
|-------|--------|
| `src/*`, `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`, `package-lock.json` | create |
| `README.md`, `WORKING/GUIDELINES/README.md` | create |
| `.gitignore` | + `node_modules/`, `dist/`, `public/models/`, `*.gguf` |
| `node_modules/`, `dist/` | gitignore (nie committen) |
| `WORKING/WORKPAPER/WP-…-BOOT-INIT-…md` | close → `closed/` (Task beendet, WP ausgegliedert) |

## next_steps (Stand bei Schließung)
- [x] **LLM-Planer:** Task-Zerlegung via LLM + echte Ausführung → **erledigt** in
      `WP-…-BENCH-IMPL` (Planer-JSON + Executor-Regel + Modell-Pool)
- [ ] **→ nächstes WP:** Tests (Vitest): `aams/*` + `task-queue` + `llm/pool` (Schema, Task-Maschine, JSON-Roundtrip)
- [ ] **→ nächstes WP:** Helfer-Modelle (OCR / Translation / Web-Fetch) via Transformers.js, on-demand
- [ ] **→ nächstes WP:** npm audit: die 2 Vulns (1 high) identifizieren + entscheiden
- [x] Session-Ende: WP → `closed/`, WH aktuell (WH-001 + WH-002), LTM-Inggest

## close (2026-10-16)
Mission erfüllt: Scaffold nach WH-001 gebaut, typecheck + build grün, Platzhalter explizit
markiert. Der zentrale Next-Step (LLM-Planer) ist in `WP-…-BENCH-IMPL` realisiert.
Offene Punkte (Tests, Helfer-Modelle, npm audit) sind als „→ nächstes WP" geroutet.
