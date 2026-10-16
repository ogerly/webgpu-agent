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

## Whitepapers (Quelle der Wahrheit)

- `WORKING/WHITEPAPER/WH-001-ARCH-webgpu-single-agent-prototype.md` — Kernarchitektur + AAMS-Doppelrolle
- `WORKING/WHITEPAPER/WH-002-BENCH-benchmark-levels-webgpu.md` — **Benchmark-System** (Level 1–10, ≤ 4 GB VRAM-Profil, Pass-Regel 5/5, Reproduzierbarkeit)

## Aktueller Status

- **Offene Workpapers:**
  - `WORKING/WORKPAPER/WP-2026-10-16-BENCH-IMPL-modell-pool-echter-agent-loop.md` (einziger offen — Modell-Pool + **Modell-Panel ①** (Auswahl + Downloadstand) + echter Loop; **Browser-Test des Agenten-Flusses offen** → dann close)
- **Zuletzt geschlossen (2026-10-16):** `BENCH-PLAN` (→ WH-002) · `ARCH-SCAF` · `ARCH-WAEC` · `KERN-PROTO` · `SESS-RESET` (alle in `WORKING/WORKPAPER/closed/`)
- **Team:** siehe `WORKING/TEAM.md`
- **LTM:** `WORKING/MEMORY/ltm-index.md`
- **Projekt-Stand:** Scaffold + KERN-Prototyp (beobachtet) + **Gedächtnis-Reset** (verifiziert) + **Modell-Pool mit Panel ①** (Auswahl + Downloadstand) + **echter Agent-Loop** (Planer-JSON, Executor-Regel, echte Token-Usage) · **Benchmark-System = WH-002** · nächste Einheiten: Benchmark-Seite (Szenario-Textseiten L1–L5) + Panel „Maschine" + Run-Report + erster L1-Testlauf
