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
  - `WORKING/WORKPAPER/WP-2026-10-17-WH002-CHANGE-referenzgeraet-messprofil.md` (offen — **Vorschlag zur Prüfung**: Referenzgerät (GTX 1050 4 GB, Variante zu verifizieren) vs. Dev-Gerät (RTX 5090) · C1 Geräterollen (nur Referenz = „bewiesen“ 5/5) · C2 Messprofil als Gruppierungsschlüssel im Run-Log · C3 Capability-Gate vor Modellwahl (`shader-f16` → q4f16_1, sonst q4f32_1 + ≤ 4-GB-Prüfung) · C4 VRAM-Budget mit Systemreserve · C5 ehrliche Grenzen; **Matrix offen**; erster Schritt: ein L1-Run auf dem Referenzgerät (MachineProfile))
  - `WORKING/WORKPAPER/WP-2026-10-17-DEPLOY-webgpu-agent-deploy-optionen.md` (offen — **⚠ BEISPIEL & FORSCHUNG**: Deploy-Optionen (lokaler Server, statisches Hosting, PWA, selbst gehostete Weights) + 6 Forschungsfragen (Offline nach Setup, AAMS-B pro Browser/Origin, WebGPU-Verfügbarkeit, Modell-Updates); README entsprechend markiert; **Erster Deploy LIVE (2026-10-17): Demo = Space-URL `https://huggingface.co/spaces/ogerl/webgpu-agent`** (`dist/` verifiziert; GitHub = **nur Code, kein Pages**))
  - `WORKING/WORKPAPER/WP-2026-10-17-SOCIAL-social-postings-readme-wip-lizenz.md` (offen — Social-Postings (X/WhatsApp/Telegram/LinkedIn/Foren) in `WORKING/TOOLS/social.md` + README: Screenshot, „Projekt-Natur (WIP/Experiment/privat, Mitarbeit erwünscht)", „Mitarbeit", **MIT-Lizenz** (`LICENSE` neu); **User-Freigabe vor Publizierung offen**)
  - `WORKING/WORKPAPER/WP-2026-10-17-DOCS-dokumentationsseite-projekt.md` (offen — **Doku-Inhalt**: Warum/Ziel/Stand/Forschungsansatz + **Offene Probleme P1–P10 gesondert** + **Wächter-Modell** (Ansatz/Stufen/Sinnhaftigkeit/Nutzen/Probleme) · kanonische Seite jetzt = App-Unterseite (WP-APP-DOKU); `website/dokumentation.html` = Referenz; **User-Freigabe des Textes offen**)
  - `WORKING/WORKPAPER/WP-2026-10-17-APP-DOKU-doku-als-unterseite-der-app.md` (offen — **Doku = Unterseite der App** (User: keine eigene Website): `doku.html` im Root (App-Theme, „← App") + Vite-Multi-Page (`dist/doku.html`) + **📖 Doku**-Link in der App-Topbar · **LIVE** `https://ogerl-webgpu-agent.static.hf.space/doku.html` (verifiziert) · Space aufgeräumt (alte Assets/Kopien entfernt) · **User-Freigabe offen**)
  - `WORKING/WORKPAPER/WP-2026-10-17-TRAIN-PLAN-waechter-spezialist.md` (offen — **Forschungsplan**: Wächter-Spezialist (0,5–1,5 B) für Protokoll-Aufgaben, Stufen 0–5 mit Abbruchkriterien; Stufe 0 = Datenerfassung (JSONL) — nur nach menschlicher Freigabe je Stufe)
  - `WORKING/WORKPAPER/WP-2026-10-17-ARTIFACT-v4-artifact-create-html.md` (offen — **V4 Schritt 1 umgesetzt**: HTML-Artefakt aus `task.result` (kein Schema-Eingriff) + Sandbox-Preview-Modal (`allow-scripts`, ohne `allow-same-origin`) + Download + Audit `artifact.ready/preview/download`; typecheck+build ✅; **Browser-Checkliste WP §6 offen** (User); Schritt 2 = ZIP/mehrdateiig + docx/xlsx, eigener WP)
  - `WORKING/WORKPAPER/WP-2026-10-17-PROPOSAL-opfs-pyodide-extension-hermes-lite.md` (offen — **PROPOSAL V1–V5 geprüft**, Entscheidungs-Matrix + Prüf-Notizen §3.1 gefüllt: V1 OPFS ✅ · V2 Extension ✅ (optional, zuletzt) · V3 Pyodide ✅ (DR WH-002 #9 erst nach 5/5-Proof) · V4 Artefakte ✅ (HTML+ZIP zuerst) · V5 Hermes-lite ✅ 1–4 / 5.5 abgelehnt (Katalog-Check: kein Hermes ≤ 4 GB) · **Implementierung offen** (Vorschlag: V4→V1→V5→V3→V2))
  - `WORKING/WORKPAPER/WP-2026-10-17-WEBSITE-einfache-webseite-start-blog-impressum.md` (offen — Website als **echte Dateien** in `website/` (Start/Blog/3 Beiträge/Impressum + style.css) + Systemklärung AAMS-A/B & Session-Speicher; **offen:** Impressum-Platzhalter, Browser-Check, Folge-WP-Kandidat „File-Output-Tool für Browser-Agenten")
  - `WORKING/WORKPAPER/WP-2026-10-16-UI-DASH-client-dashboard-harte-analyse-style-migration.md` (offen — **harte Analyse** Dashboard vs. `observe/client-index-example.html` + **UMGESETZT** (2026-10-16): `src/ui/theme.css` + `src/ui/api.ts` (WGA) + `src/ui/wire.ts` + `Agent.chat()` (Intent status/task/frage, Planer bestimmt Teilaufgaben, Wächter fragt nach neuer Aufgabe) + `stageFromText()`; `app.ts` weg; typecheck+build ✅; **Browser-Checkliste WP §8 offen** → dann close)
  - `WORKING/WORKPAPER/WP-2026-10-16-BENCH-IMPL-modell-pool-echter-agent-loop.md` (offen — Modell-Pool + **Modell-Panel ①** (Auswahl + Downloadstand) + echter Loop; **Browser-Test des Agenten-Flusses offen** → dann close)
- **Zuletzt geschlossen (2026-10-16):** `BENCH-PLAN` (→ WH-002) · `ARCH-SCAF` · `ARCH-WAEC` · `KERN-PROTO` · `SESS-RESET` (alle in `WORKING/WORKPAPER/closed/`)
- **Team:** siehe `WORKING/TEAM.md`
- **LTM:** `WORKING/MEMORY/ltm-index.md`
- **Projekt-Stand:** Scaffold + KERN-Prototyp (beobachtet) + **Gedächtnis-Reset** (verifiziert) + **Modell-Pool** (Wächter/Planer-Karten, Auswahl + Downloadstand + DEGRADED) + **echter Agent-Loop** (Planer-JSON, Executor-Regel, echte Token-Usage) + **Chat als einziger Dialogkanal** (`Agent.chat()`, Wächter = Stimme) + **neues Dashboard (WP-UI-DASH)**: dunkler App-Frame, 3 Spalten, VRAM-Bar, Tabs **Zuschauen/Arbeit/Audit/Gedächtnis** (Browser-Test offen) + **Artefakt (V4 Schritt 1)**: HTML-Vorschau (Sandbox) + Download + Audit `artifact.*` (WH-001 DR #5, WH-002 DR #10) + **Website** als statische Dateien in `website/` · **Forschung:** WP-TRAIN-PLAN (Wächter-Spezialist, Stufen 0–5) + WP-DEPLOY (Beispiel & Forschung, in README markiert; **Erster Deploy LIVE: Demo = `huggingface.co/spaces/ogerl/webgpu-agent`**) + **WP-SOCIAL** (Postings `WORKING/TOOLS/social.md` + README: Screenshot/WIP/Mithilfe + **MIT** `LICENSE`; Freigabe offen) + **WP-DOCS/WP-APP-DOKU** (Doku: Warum/Ziel/Stand/Forschung + offene Probleme P1–P10 + Wächter-Modell — als **Unterseite der App** `doku.html`, **LIVE** `https://ogerl-webgpu-agent.static.hf.space/doku.html`, 📖-Link in Topbar) · **Benchmark-System = WH-002** · nächste Einheiten: Browser-Tests (WP-UI-DASH §8 + WP-ARTIFACT §6) → V4 Schritt 2 (ZIP) / V1 (OPFS) → Benchmark-Seite (Szenario-Textseiten L1–L5) + Panel „Maschine" + erster L1-Testlauf
