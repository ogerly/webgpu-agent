# READ-AGENT.md — webgpu-agent

> **Entry-Point für Coding-/AI-Agents.** Lies diese Datei zuerst.
> AAMS-Contract: **AAMS/2.6.0** (2026-09-23) — Details in `.agent.json`.

## Was ist dieses Projekt?

Ein **vollständig clientseitiger, autonomer Webagent** im Browser über **WebGPU**.
- **Gedächtnis:** AAMS als strukturiertes, session-bezogenes Langzeitgedächtnis
- **Intelligenz:** lokale Open-Source-LLMs (Qwen/Llama) via **WebLLM** auf der GPU
- **Helfer-Modelle:** OCR / Translation / Web-Fetch (Transformers.js), on-demand
- **Persistenz:** IndexedDB + JSON-Export (Backup/Restore)
- **Prinzip:** keine Cloud-APIs, keine Serverinfrastruktur → maximale Datensouveränität

Vollständige Vision: `idee.md` (Projekt-Whitepaper).

## Workspace-Struktur (AAMS)

```
.
├── .agent.json          # AAMS-Contract (Single Source of Truth)
├── .aams-version        # installierte Contract-Version (Versions-Check)
├── READ-AGENT.md        # diese Datei (Entry-Point)
├── idee.md              # Projekt-Vision / Whitepaper (Quelle)
├── opencode.json        # OpenCode-Runtime-Konfiguration
└── WORKING/             # AAMS-Workspace (effektiver Root)
    ├── WHITEPAPER/      # stabile Architektur-/Systemwahrheit (WH-NNN-*)
    ├── WORKPAPER/       # session-/task-bezogene Arbeitsdocs (WP-{DATE}-{TOPIC}-*)
    │   ├── closed/      # geschlossene Workpapers
    │   └── observe/     # wartend / Beobachtung
    ├── MEMORY/          # Langzeit-Kontext (ltm-index.md = Audit-Log)
    ├── AGENT-MEMORY/    # LTM-Store (optional: vector/ChromaDB)
    ├── DIARY/           # Zeitindex (tägliche → Wochen → Monats-Aggregat)
    ├── LOGS/            # Logs
    ├── GUIDELINES/      # Projekt-Konventionen
    ├── TOOLS/           # Tool-Referenzimplementierungen + skills/
    └── TEAM.md          # dynamisches Team-Roster
```

## Regeln für Agents (Guard — descriptive_only)

Bevor du **schreibst/änderst**, achte auf die Reihenfolge:
1. **manifest_read** — `.agent.json` + `READ-AGENT.md` gelesen
2. **workpaper_open** — ein offenes Workpaper unter `WORKING/WORKPAPER/` (status: open)
3. **authorship_present** — WP-Header `BY: {name|—} / {tool} / {model} / {capability}`
4. **tools_gated** — write/edit/apply_patch/bash erst danach

Weitere Konventionen:
- **Nie löschen / nie überschreiben** (`bootstrap_rules`: create_if_missing).
- **Keine Secrets** in Workpapers/Whitepapers/Memory/Manifest (nur `.env` / Secret-Manager).
- **Doku-Kette:** Workpaper → Whitepaper → LTM (niemals überspringen).
- **Passive Tool-Erkennung** (keine aktive Suche nach Tool-Dateien).
- **File-Safety (außerhalb WORKING/):** vor Löschung Git-History prüfen.

## Session-Lebenszyklus

| Event | Verhalten (Kurz) |
|-------|------------------|
| **first_entry** | Workspace-Struktur anlegen, Repo inventarisieren, READ-AGENT.md + erstes WP + LTM-Index |
| **session_start** | Versions-Check (`.aams-version`), READ-AGENT.md lesen, Memory-Query, RFL, WP öffnen |
| **session_end** | WP abschließen, Whitepaper aktuell halten, LTM-Inggest, WP → `closed/`, READ-AGENT.md pflegen |
| **update** | Contract-Mismatch → CHANGELOG/MIGRATIONS, neue Pfade anlegen, `.aams-version` setzen |

Details: `.agent.json → agent_conventions`.

## Aktueller Status

- **Aktives Workpaper:** `WORKING/WORKPAPER/WP-2026-10-16-BOOT-INIT-aams-first-entry-bootstrap.md`
- **Team:** siehe `WORKING/TEAM.md`
- **LTM:** `WORKING/MEMORY/ltm-index.md`
- **Projekt-Stand:** Planungsphase (Vision vorhanden, noch kein Quellcode)
