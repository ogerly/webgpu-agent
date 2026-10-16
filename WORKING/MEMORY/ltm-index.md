# LTM Index — Langzeitgedächtnis (Audit-Log)

> **LTM-Modus:** markdown (zero-dependency). Später optional → vector/ChromaDB.
> **Spalten:** `# | Datum | Typ | BY | Datei | Inhalt`
> **Regel:** Workpaper vor Session-Ende hier ingestieren (frische Wahrheit, kein veraltetes WP).

| # | Datum | Typ | BY | Datei | Inhalt |
|---|-------|-----|----|-------|--------|
| 1 | 2026-10-16 | vision | —/opencode/qwen/qwen3.8-27b/local | `idee.md` | Projekt-Vision: local-first WebGPU-Agent (AAMS + WebLLM, keine Cloud, max. Datensouveränität) |
| 2 | 2026-10-16 | config | —/opencode/qwen/qwen3.8-27b/local | `opencode.json` | OpenCode-Runtime: lokales LM-Studio-Gateway (LAN), aktives Modell `qwen/qwen3.8-27b` |
| 3 | 2026-10-16 | manifest | —/opencode/qwen/qwen3.8-27b/local | `.agent.json` | AAMS/2.6.0 (2026-09-23) geladen; `on_first_entry` ausgeführt |
| 4 | 2026-10-16 | bootstrap | —/opencode/qwen/qwen3.8-27b/local | `WP-2026-10-16-BOOT-INIT-aams-first-entry-bootstrap.md` | Workspace initialisiert: Struktur, READ-AGENT.md, TEAM.md, LTM-Index |
| 5 | 2026-10-16 | decision | —/opencode/qwen/qwen3.8-27b/local | `WP-2026-10-16-BOOT-INIT-…` | Entscheidungen: **Code-Repo hier** · **Git-Init** (`main`) · **Whitepaper=Quelle der Wahrheit** (Vorlage, kein Spiegel) |
| 6 | 2026-10-16 | template | —/opencode/qwen/qwen3.8-27b/local | `WORKING/WHITEPAPER/TEMPLATE.md` | Whitepaper-Vorlage (autorfrei, Decision-Log); neue `WH-NNN` entstehen erst bei stabilen Entscheidungen |
| 7 | 2026-10-16 | whitepaper | —/opencode/qwen/qwen3.8-27b/local | `WORKING/WHITEPAPER/WH-001-ARCH-webgpu-single-agent-prototype.md` | Erstes stabiles Whitepaper: Kernarchitektur (WebLLM, IndexedDB, Single-Session) + **AAMS-Doppelrolle** (A=Dev, B=Agent) als Fundament |
| 8 | 2026-10-16 | scaffold | —/opencode/qwen/qwen3.8-27b/local | `src/*` | Vite+TS-Scaffold: aams(B)-Store, Task-Queue, WebLLM-Adapter (lazy), JSON-IO, UI; typecheck + build ✅ |
| 9 | 2026-10-16 | process | —/opencode/qwen/qwen3.8-27b/local | `WP-…-BOOT-INIT-…` (closed) + `WP-…-ARCH-SCAF-…` (open) | WP-Ausgliederung: Scaffold = eigener Task-WP mit **Plan** davor; BOOT-WP → closed/. **Rolle: WH=Wahrheit, WP=Plan/Umsetzung** |
