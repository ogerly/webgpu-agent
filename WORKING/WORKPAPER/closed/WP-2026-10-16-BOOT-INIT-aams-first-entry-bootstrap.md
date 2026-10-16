# WP-2026-10-16-BOOT-INIT — AAMS First-Entry Bootstrap

**Status:** closed
**BY:** — / opencode / qwen/qwen3.8-27b / local
**Geschlossen:** 2026-10-16 (Task beendet; Scaffold in eigenes WP ausgegliedert)
**Continued from:** —
**TOPIC:** BOOT (Bootstrap) · **Sub-Topic:** INIT (Initialisierung)
**Erstellt:** 2026-10-16

> Ausgelöst durch: `agent_conventions.on_first_entry` (AAMS/2.6.0)
> Guard-Reihenfolge erfüllt: manifest_read ✅ → workpaper_open ✅ → authorship_present ✅ → tools_gated

---

## session_goal

Erste Initialisierung des AAMS-Workspaces in diesem Repository. `.agent.json`
(AAMS/2.6.0) wurde geladen; `on_first_entry` wird ausgeführt:
Workspace-Struktur anlegen, Repository inventarisieren, `READ-AGENT.md` anlegen,
bestehende Doku in die Memory-Schicht indexieren. Danach ist der Workspace
für künftige Sessions startklar (`on_session_start` / `on_session_end`).

## repository_inventory

| Pfad | Typ | Status |
|------|-----|--------|
| `.agent.json` | AAMS-Manifest (AAMS/2.6.0) | vorhanden (22 KB) |
| `idee.md` | Projekt-Whitepaper / Vision | vorhanden (4,2 KB) |
| `opencode.json` | OpenCode-Config (Provider, Modelle, Permissionen) | vorhanden (4,6 KB) |
| `WORKING/` | AAMS-Workspace (effektiver Root) | **neu angelegt** (diese Session) |
| `.aams-version` | Versions-Tracking | **neu angelegt** (diese Session) |
| `READ-AGENT.md` | Entry-Point | **neu angelegt** (diese Session) |
| `WORKING/TEAM.md` | Team-Roster | **neu angelegt** (diese Session) |
| `WORKING/MEMORY/ltm-index.md` | LTM-Audit-Log | **neu angelegt** (diese Session) |

> Hinweis: Kein Git-Repository (`git rev-parse` → "not a git repo"). Kein
> `README.md`, kein Quellcode, kein `.git`. Projekt ist in der Planungsphase.

## key_findings

- **Projektziel (`idee.md`):** vollständig clientseitiger, autonomer Webagent
  im Browser via **WebGPU**. AAMS als strukturiertes, session-bezogenes
  Gedächtnis + lokale Open-Source-LLMs (WebLLM). **Keine Cloud-APIs**,
  keine Serverinfrastruktur → maximale Datensouveränität.
- **Kernkomponenten:** Session-/Projekt-Management (Session-Reset, JSON-Export),
  Sub-Task-Tree + autonomer Task-Loop, WebGPU-Inferenz (Qwen/Llama via WebLLM)
  + On-Demand-Helfer-Modelle (OCR, Translation, Web-Fetch via Transformers.js),
  Persistenz über IndexedDB + JSON-Export.
- **Referenz-Projekte:** https://github.com/ogerly/AAMS und
  https://github.com/ogerly/webgpu-arena
- **Runtime (`opencode.json`):** OpenCode + lokales LM-Studio-Gateway (LAN
  `172.19.224.1:9876`), aktives Modell `mantis/qwen/qwen3.8-27b`; zusätzlich
  Ollama-Cloud- und OpenRouter-Modelle konfiguriert.
- **AAMS-Konventionen:** 4-Schicht-Doku-Modell (Workpaper → Whitepaper → Diary →
  Memory), Guard-Pattern (descriptive_only), passive Tool-Erkennung, LTM als
  Markdown (`ltm-index.md`), Secrets nie in Doku/Manifest.

## decisions (2026-10-16)

1. **Code-Repo:** Der Quellcode des WebGPU-Agenten startet **in diesem Repo**
   (`webgpu-agent`) — nicht nur Planung/Doku, nicht `webgpu-arena`.
2. **Git:** Repository wird ein Git-Repo (initialisiert 2026-10-16, Branch `main`,
   `.gitignore` nach AAMS-Patterns). → Git ist ab jetzt Source of Truth (`file_safety`).
3. **Whitepaper-Philosophie:** Whitepaper = **Quelle der Wahrheit** (Wahrheit-in-Zeit),
   *keine* Kopie einer Idee. `idee.md` bleibt Vision/Seed. Statt sie zu spiegeln:
   **Vorlage** `WORKING/WHITEPAPER/TEMPLATE.md`. Ein konkretes `WH-NNN` entsteht erst
   bei stabilen Entscheidungen (autorfrei, mit Decision-Log).
4. **LTM-Modus:** bleibt `markdown` (zero-dependency); `vector`/ChromaDB optional später.
5. **AAMS-Doppelrolle (Fundament):** AAMS ist (A) unsere **Arbeitsgrundlage** in diesem
   Repo (Workpaper/LTM/Whitepaper/Team) **und** (B) die **native Gedächtnis-Architektur
   des Agenten** im Browser des Endnutzers (Session-IDs, Task-Trees, Audit-Logs in
   IndexedDB + JSON-Export). Gleiche **Schema**, getrennte **Instanzen** (Dev ≠ Runtime).
   → Festgeschrieben in `WH-001` (Decision-Record #1) als Fundament.

## file_protocol

| Datei | Aktion | Begründung |
|-------|--------|------------|
| `WORKING/*` (Ordner) | create_if_missing | on_first_entry Schritt 2 |
| `WORKING/{LOGS,AGENT-MEMORY,WORKPAPER/closed,WORKPAPER/observe}/.gitkeep` | create | gitignore-Patterns aus Manifest (issue #10) |
| `WORKING/TEAM.md` | create_if_missing | bootstrap_rules.team_file |
| `WORKING/WORKPAPER/WP-2026-10-16-BOOT-INIT-…md` | create | on_first_entry Schritt 3 (dieses WP) |
| `READ-AGENT.md` | create_if_missing | on_first_entry Schritt 4 |
| `.aams-version` | create | version_detection (Init für künftige on_session_start-Checks) |
| `WORKING/MEMORY/ltm-index.md` | create | on_first_entry Schritt 5 (Doku indexieren) |
| `WORKING/DIARY/2026-10.md` | create | Zeitindex (pointer-only) |
| `.gitignore` | create | AAMS gitignore_patterns (always + vector) + Secrets/OS-Hygiene |
| `WORKING/WHITEPAPER/TEMPLATE.md` | create | Whitepaper-Vorlage (Quelle der Wahrheit, autorfrei) |
| `WORKING/WHITEPAPER/WH-001-ARCH-webgpu-single-agent-prototype.md` | create | Erstes stabiles WP (Kernarchitektur + **AAMS-Doppelrolle**) |
| `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`, `README.md` | create | Vite+TS-Grundgerüst (local-first, `base:"./"`) |
| `src/aams/{schema,store,io}.ts` | create | **AAMS(B)-Kern:** Schema, IndexedDB-Store, JSON-IO |
| `src/agent/{agent,task-queue}.ts` | create | Agent-Core + Task-Queue (Sub-Task-Tree) |
| `src/llm/{engine,webllm}.ts` | create | LLMEngine-Interface + WebLLM-Adapter (lazy) |
| `src/ui/app.ts`, `src/main.ts` | create | UI-Verdrahtung + Entry-Point |
| `WORKING/GUIDELINES/README.md` | create | Projekt-Konventionen (Doppelrolle, Stack, Style) |
| `node_modules/`, `dist/` | gitignore | Build-/Runtime-Artefakte (nie committen) |
| (git) | `git init -b main` + Initial-Commit | Repo wird Git-Repo (Entscheidung #2) |
| `idee.md`, `opencode.json`, `.agent.json` | **nicht** ändern | Vorhandene Inhalte bleiben unangetastet |

## Abschluss (closed)

Bootstrap-Task **abgeschlossen**: Workspace · Git · WH-001 · Scaffold.
- **Rollen-Trennung gesichert:** WH-001 = Wahrheit · WP = Plan/Umsetzung/Track.
- Der Scaffold (eigener Task) wurde in ein eigenes, sauberes Workpaper ausgegliedert:
  **`WP-2026-10-16-ARCH-SCAF-vite-ts-scaffold.md`** (open) — dort: Plan, Umsetzung, Verifikation,
  offene Fragen (LLM-Planer, Helfer-Modelle, Tests, npm-audit).
- Offene Folgearbeiten liegen **nicht** mehr hier, sondern im obigen Scaffold-WP.
