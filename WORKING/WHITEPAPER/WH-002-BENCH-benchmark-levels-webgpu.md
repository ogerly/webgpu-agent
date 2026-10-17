# WH-002 — Benchmark-System: Level 1–10 auf WebGPU (≤ 4 GB VRAM-Profil)

> **Status:** active
> **Typ:** Quelle der Wahrheit (*Wahrheit-in-Zeit*)
> **Lebenszyklus:** Initialisiert 2026-10-16 · aktualisiert **nur** bei strukturellen Entscheidungen
> **Autor:** — *(Whitepapers sind bewusst **autorfrei** — sie dokumentieren die Wahrheit des Systems, nicht, wer sie geschrieben hat.)*

---

## 1. Zweck & Geltungsbereich

Dieses Whitepaper definiert die stabile Wahrheit für das **Benchmark-Testing** des
WebGPU-Agenten: **mit welcher Methode, auf welcher Hardware und nach welchen Regeln**
gemessen wird, was der Agent auf **minimaler Rechenleistung** leisten kann.

* **Scope:** Level-System (1–10), Szenario-Kategorien, Ziel-Hardware-Profil,
  Modell-Pool-Strategie, Erfolgskriterien (Pass-Regel), Reproduzierbarkeits-Protokoll.
* **Out of Scope:** konkrete Implementierungsdetails (→ Workpapers/Code),
  Multi-Agent-Systeme, Cloud-Vergleiche, GPU-Cluster.
* **Anspruch:** nicht Perfektion — ein **vorzeigbares, reproduzierbares Ergebnis** mit
  minimaler Rechenleistung. Der Benchmark ist zugleich **Zeitzeugnis**: gleiche Tests,
  spätere Technik → Fortschritt messbar.

## 2. Kernentscheidungen (Decision Records)

| # | Datum | Entscheidung | Kontext | Alternative | Begründung |
|---|-------|--------------|---------|-------------|------------|
| 1 | 2026-10-16 | **Level N = die Aufgabe benötigt N Teilaufgaben** (L1…L10, beobachtbar im AAMS-B-Task-Tree) | Testachse des Benchmarks | freie Schwierigkeitsskala, Zeitlimits | Zerlegungskomplexität ist **objektiv zählbar** im Gedächtnis → sauber beobacht- und reproduzierbar |
| 2 | 2026-10-16 | **Drei Szenario-Kategorien + L10-App:** A = Recherche (sammeln · auswerten · verarbeiten) · B = Coding (HTML + Python) · C = Rezepte (aus greifbaren Zutaten, vegan/Andere/Krankheiten) · L10 = kleine App mit HTML-Übersicht aus ausgewerteten Daten | was gemessen wird | reine Chat-Fragen | Abdeckt die realen Nutzungsfälle; jede Kategorie hat **harte DoD-Kriterien** (prüfbar, nicht Geschmack) |
| 3 | 2026-10-16 | **Szenario-Texte sind fix** (im Repo, exakt wie ausgeführt) · Recherche-Standard-Track = **fixer Quellen-Korpus** | Reproduzierbarkeit | freie Prompts, Live-Web | Gleicher Text + gleiche Quellen = vergleichbare Läufe. Live-Web ist nur ein **gekennzeichneter Zusatz-Track** (nicht reproduzierbar) |
| 4 | 2026-10-16 | **Ziel-Hardware-Profil: ≤ 4 GB VRAM · ~35 GB RAM · Mehrkern-CPU** (Consumer-Laptop) | „minimalste Rechenleistung → vorzeigbares Ergebnis" | High-End-GPUs | Das ist der Kern-Proof des Projekts: local-first muss auf Alltags-Hardware gehen |
| 5 | 2026-10-16 | **Modell-Pool: Wächter resident + Planer on-demand.** Default: Wächter `Qwen2.5-0.5B` (944,62 MB), Planer `Llama-3.2-3B` (2263,69 MB), Fallback `Qwen2.5-1.5B` (1629,75 MB) → **Degraded** (Wächter, immer gekennzeichnet). Auswahl aus Katalog (Instruct, q4f16_1, ≤ 4 GB) | Modell-Strategie ≤ 4 GB | ein fixes Modell für alles | Wächter = zuverlässig + klein (immer an), Planer = intelligenter (nur solange gebraucht) → **VRAM wird frei gegeben** (`unload()`); Fallback hält das Profil in jedem Fall |
| 6 | 2026-10-16 | **Auswahl-Regeln (deterministisch):** L1 → Wächter allein (Planer wird **nicht** geladen) · L2+ → Planer zerlegt (Planer-JSON) → **Planer entladen** · Executor-Regel: Teilaufgabe (`parentId ≠ null`) → Planer · Wurzel → Wächter | wer macht was, wann | „das Modell entscheidet" | Deterministisch = **beobachtbar + vergleichbar**; ohne Schema-Änderung (Rolle wird abgeleitet) |
| 7 | 2026-10-16 | **Pass-Regel: „bewiesen" = 5/5 Läufe mit Score ≥ 2 und 0 harte DoD-Verstöße.** Sonst: „funktional" (3–4/5) oder „instabil" (≤ 2/5). Jeder Level-Run = **frische Session** (Gedächtnis-Reset) | was ein gültiger Proof ist | 1x-Lauf, Majorität | Ein **reproduzierbarer** Befund braucht Stabilität über Läufe — 5/5 ist der ehrliche Beweis-Standard |
| 8 | 2026-10-16 | **Reproduzierbarkeits-Protokoll:** fixiert werden Modell + Revision, Quant, Kontextfenster, Temperature (Planung 0 / Generierung 0,2), Szenario-Text, Browser + Version, **MachineProfile** (WebGPU-Adapter/Limits, CPU, RAM, Speicher) · N = 5 · Run-Log in AAMS-B → JSON-Export · erster Fail-Level = dokumentierte Capability-Ceiling | wissenschaftlicher Teil | „es ging mal" | Gleiche Variablen + protokollierte Umgebung = vergleichbar über Zeit und Maschinen („die Technik wird besser" — messbar) |
| 9 | 2026-10-16 | **Ehrliche Grenzen (stabil im Protokoll):** Python-Artefakte werden **außerhalb** des Browsers verifiziert (Browser führt Python nicht aus) · RAM-API deckelt bei 8 GB („≥ 8 GB") · VRAM nur als **Limits-Proxy** (Indikator, kein Messwert) · HTML-Aufgaben = geschlossener Testkreis **im** Browser (voll beweisbar) | was man nicht verschweigt | alles „best effort" nennen | Ein Proof ist nur so gut wie seine **offen ausgewiesenen Grenzen** |
| 10 | 2026-10-17 | **HTML-Aufgaben erzeugen Artefakte** (V4 Schritt 1, WP-…-ARTIFACT): Ergebnis → abgeleitetes HTML (Sandbox-Vorschau + Download), Audit `artifact.*` | #9 „geschlossener Testkreis im Browser" wird damit auch **dateibeweisbar** (Datei herunterladbar, im Browser öffbar) | Artefakt nur als Chat-Text (Status quo) | Datei = harter Beleg; **Python-Grenze unverändert** (außerhalb verifiziert; V3/Pyodide = offen, DR folgt erst nach 5/5-Proof) |

## 3. Architektur (Benchmark-System)

### 3.1 Level-Achse (stabile Definition)

| Level | Teilaufgaben | Charakter |
|-------|--------------|-----------|
| **L1** | 1 | einfache Aufgabe, keine Zerlegung |
| **L2** | 2 | minimale Zerlegung |
| **L3** | 3 | Standard-Zerlegung |
| **L4** | 4 | ein Zwischenergebnis fließt in Teilaufgabe 4 ein |
| **L5** | 5 | Zwischenergebnisse + finales Artefakt |
| L6–L9 | 6–9 | (Skizze — erst bei Bedarf ausformulieren) |
| **L10** | ~10 | **kleine App:** planen + bauen + HTML-Übersicht aus ausgewerteten Daten (Abhängigkeiten, finales Artefakt = der Kern-Proof) |

**DoD-Kriterien** (harte, prüfbare Bedingungen) gehören zu jedem Szenario —
konkret in `src/bench/scenarios.ts` (Implementierung) + Quellen-Workpaper.

### 3.2 Modell-Pool & VRAM-Budget (Ground-Truth: WebLLM 0.2.86)

| Kombination | VRAM (≈, Lib-Metadaten) | Passt in ≤ 4096 MB? |
|-------------|-------------------------|----------------------|
| Wächter `Qwen2.5-0.5B` allein | 944,62 MB | ✅ ~3,1 GB Reserve |
| Wächter + Planer `Llama-3.2-3B` | 3208,31 MB | ⚠️ ~0,8 GB Reserve (Benchmark beobachtet das!) |
| Wächter + Fallback `Qwen2.5-1.5B` | 2574,37 MB | ✅ ~1,5 GB Reserve |
| 7B-Modelle | > 5100 MB | ❌ außerhalb des Zielprofils |

**Lebenszyklus einer L2+-Aufgabe:** Planer laden → Planer-JSON → AAMS-B (Task-Tree +
Memory + Audit) → Planer **entladen** (VRAM frei) → Teilaufgaben ausführen (Executor-Regel)
→ Wurzel auto-done → (Benchmark) Run-Log.

### 3.3 Metriken (pro Lauf, auto-logged in AAMS-B)

Erfolg (hartes DoD, 0/1) · Score (0–3) · geplante Teilaufgaben (vs. Level) · Token
(echte Usage: prompt/completion/total) · Zeit (gesamt/je Teilaufgabe) · VRAM
(geladen MB, OOM-Events) · Flush-Zyklen + **KERN-Integrität** (nichts nach Flush verloren —
Invariante aus WH-001/AAMS) · Modell-Ereignisse (`llm.load/unload/fallback/degraded`).

## 4. Schnittstellen & Kontrakte

* **Planer-JSON (feste Felder):**
  `{ "verstaendnis": "…", "teilaufgaben": [{ "id", "beschreibung", "prioritaet" }],
     "vorentscheidungen": ["…"], "risiken_oder_offen": ["…"] }` —
  Parsing robust (Code-Fences/Text), 1 Retry, danach `plan.error` (nichts halbfertig).
* **Run-Log (AAMS-B):** Audit-Aktionen `pool.select` · `llm.load/execute/unload/fallback/degraded/error`
  (mit `model=…`, echten Token-Zahlen) · `plan.created/plan.error` · `task.root_done` ·
  Memory `kind: "decision"` (Verständnis) · **MachineProfile** (WebGPU-Adapter/Limits,
  CPU-Kerne, RAM „≥ 8 GB", Speicher usage/quota, Browser) in jedem Run-Log.
* **Export:** `bench/{szenario}/{run-n}.json` (AAMS-B-Dokument + MachineProfile +
  Modell-Revisionen) → Archiv `WORKING/LOGS/bench/`.

## 5. Invarianten & Nicht-Ziele

* **Invarianten:**
  - Keine Cloud-Anbindung für Kernprozesse; Inference zu 100 % im Client-Browser
    (einmaliger Weights-Download = Setup, sichtbar dokumentiert).
  - Benchmark-Runs starten **immer** mit frischem, zurückgesetztem Gedächtnis
    (Gedächtnis-Reset, WP-SESS-RESET) — kein Zustands-Übergreifen zwischen Läufen.
  - **Degraded-Modus wird immer gekennzeichnet** (Audit + UI) — nie still.
  - „Bewiesen" heißt **5/5** — weniger ist ein Grenzbefund (und das ist auch wertvoll:
    es markiert die Capability-Ceiling des Profils).
* **Nicht-Ziele (dieses System):**
  - Keine Cloud-APIs im Benchmark-Vergleich (das wäre ein anderes Experiment).
  - Kein Multi-Agenten-/WebRTC-Betrieb.
  - Keine 7B+/8B-Modelle im Zielprofil (nur als „passt nicht" dokumentiert).

## 6. Verweise

* → Entstehung: `WORKING/WORKPAPER/closed/WP-2026-10-16-BENCH-PLAN-benchmark-levels-webgpu.md`
* → Umsetzung Pool/Loop: `WORKING/WORKPAPER/WP-2026-10-16-BENCH-IMPL-modell-pool-echter-agent-loop.md`
* → Fundament: `WORKING/WHITEPAPER/WH-001-ARCH-webgpu-single-agent-prototype.md`
* → Katalog (Ground-Truth): `src/llm/catalog.ts` · Pool: `src/llm/pool.ts`
* → Vision: `idee.md`
