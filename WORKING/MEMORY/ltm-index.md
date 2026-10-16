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
