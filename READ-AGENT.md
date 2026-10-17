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

> **Index (dauerhaft verankert):** `WORKING/WHITEPAPER/INDEX.md` — Übersicht über **alle** Whitepapers +
> was jedes sichert + Wartungs-Regeln. **Neue Agenten/Session: INDEX zuerst lesen.**
> **Regel beim WP-Schluss:** strukturelle Wahrheiten **erst** als DR im passenden Whitepaper sichern,
> **dann** schließen · INDEX aktuell halten · **Widerspruch → Whitepaper gewinnt.**

- `WH-001` — Kernarchitektur + AAMS-Doppelrolle + Invarianten + **Demo/Hosting (DR #6)** + **Doku-Unterseite (DR #7)**
- `WH-002` — **Benchmark-System** (Level 1–10, ≤ 4 GB VRAM-Profil, Pass-Regel 5/5, Reproduzierbarkeit; DR #1–10)

## Aktueller Status

- **Offene Workpapers:**
  - `WORKING/WORKPAPER/WP-2026-10-17-WH002-CHANGE-referenzgeraet-messprofil.md` (offen — **Vorschlag zur Prüfung**: Referenzgerät (GTX 1050 4 GB, Variante zu verifizieren) vs. Dev-Gerät (RTX 5090) · C1 Geräterollen (nur Referenz = „bewiesen“ 5/5) · C2 Messprofil als Gruppierungsschlüssel im Run-Log · C3 Capability-Gate vor Modellwahl (`shader-f16` → q4f16_1, sonst q4f32_1 + ≤ 4-GB-Prüfung) · C4 VRAM-Budget mit Systemreserve · C5 ehrliche Grenzen; **Matrix offen**; erster Schritt: ein L1-Run auf dem Referenzgerät (MachineProfile))
  - `WORKING/WORKPAPER/WP-2026-10-17-DEPLOY-webgpu-agent-deploy-optionen.md` (offen — **⚠ BEISPIEL & FORSCHUNG**: Deploy-Optionen (lokaler Server, statisches Hosting, PWA, selbst gehostete Weights) + 6 Forschungsfragen (Offline nach Setup, AAMS-B pro Browser/Origin, WebGPU-Verfügbarkeit, Modell-Updates); README entsprechend markiert; **Erster Deploy LIVE (2026-10-17): Demo = Space-URL `https://huggingface.co/spaces/ogerl/webgpu-agent`** (`dist/` verifiziert; GitHub = **nur Code, kein Pages**))
  - `WORKING/WORKPAPER/WP-2026-10-17-SOCIAL-social-postings-readme-wip-lizenz.md` (offen — Social-Postings (X/WhatsApp/Telegram/LinkedIn/Foren) in `WORKING/TOOLS/social.md` + README: Screenshot, „Projekt-Natur (WIP/Experiment/privat, Mitarbeit erwünscht)", „Mitarbeit", **MIT-Lizenz** (`LICENSE` neu); **User-Freigabe vor Publizierung offen**)

  - `WORKING/WORKPAPER/WP-2026-10-17-TRAIN-PLAN-waechter-spezialist.md` (offen — **Forschungsplan**: Wächter-Spezialist (0,5–1,5 B) für Protokoll-Aufgaben, Stufen 0–5 mit Abbruchkriterien; Stufe 0 = Datenerfassung (JSONL) — nur nach menschlicher Freigabe je Stufe)

  - `WORKING/WORKPAPER/WP-2026-10-17-PROPOSAL-opfs-pyodide-extension-hermes-lite.md` (offen — **PROPOSAL V1–V5 geprüft**, Entscheidungs-Matrix + Prüf-Notizen §3.1 gefüllt: V1 OPFS ✅ · V2 Extension ✅ (optional, zuletzt) · V3 Pyodide ✅ (DR WH-002 #9 erst nach 5/5-Proof) · V4 Artefakte ✅ (HTML+ZIP zuerst) · V5 Hermes-lite ✅ 1–4 / 5.5 abgelehnt (Katalog-Check: kein Hermes ≤ 4 GB) · **Implementierung offen** (Vorschlag: V4→V1→V5→V3→V2))

- **Zuletzt geschlossen:** **2026-10-17:** `UI-DASH` + `BENCH-IMPL` + `ARTIFACT` + `WEBSITE` (alle umgesetzt, User: „alle 4"; Wahrheiten in WH-001/WH-002; **Fortführung:** Schritt 2 ZIP → WP-PROPOSAL §V4 · Benchmark-Folge-Einheiten → README „Nächste Schritte"/WP-WH002-CHANGE · Impressum-Platzhalter = User-TO-DO) + `DOCS` + `APP-DOKU` (Doku = App-Unterseite, **LIVE**; Wahrheiten → WH-001 **DR #6/#7**) · **2026-10-16:** `BENCH-PLAN` (→ WH-002) · `ARCH-SCAF` · `ARCH-WAEC` · `KERN-PROTO` · `SESS-RESET` (alle in `WORKING/WORKPAPER/closed/`)
- **Team:** siehe `WORKING/TEAM.md`
- **LTM:** `WORKING/MEMORY/ltm-index.md`
- **Projekt-Stand:** Scaffold + KERN-Prototyp (beobachtet) + **Gedächtnis-Reset** (verifiziert) + **Modell-Pool** (Wächter/Planer-Karten, Auswahl + Downloadstand + DEGRADED) + **echter Agent-Loop** (Planer-JSON, Executor-Regel, echte Token-Usage) + **Chat als einziger Dialogkanal** (`Agent.chat()`, Wächter = Stimme) + **neues Dashboard (WP-UI-DASH, closed ✅)**: dunkler App-Frame, 3 Spalten, VRAM-Bar, Tabs **Zuschauen/Arbeit/Audit/Gedächtnis** (Browser-Test ✅) + **Artefakt (V4 Schritt 1, closed ✅)**: HTML-Vorschau (Sandbox) + Download + Audit `artifact.*` (WH-001 DR #5, WH-002 DR #10) + **Website** als statische Dateien in `website/` · **Forschung:** WP-TRAIN-PLAN (Wächter-Spezialist, Stufen 0–5) + WP-DEPLOY (Beispiel & Forschung, in README markiert; **Erster Deploy LIVE: Demo = `huggingface.co/spaces/ogerl/webgpu-agent`**) + **WP-SOCIAL** (Postings `WORKING/TOOLS/social.md` + README: Screenshot/WIP/Mithilfe + **MIT** `LICENSE`; Freigabe offen) + **Doku (live, freigegeben):** `doku.html` = App-Unterseite + Deep-Links (WP `DOCS`/`APP-DOKU` geschlossen; Wahrheiten in WH-001 DR #6/#7; **`WHITEPAPER/INDEX.md` neu** = Index der Quellen der Wahrheit) · **Benchmark-System = WH-002** · nächste Einheiten: Browser-Tests (WP-UI-DASH §8 + WP-ARTIFACT §6) → V4 Schritt 2 (ZIP) / V1 (OPFS) → Benchmark-Seite (Szenario-Textseiten L1–L5) + Panel „Maschine" + erster L1-Testlauf
