# WP-2026-10-16-BENCH-PLAN — Benchmark-Testing (Level 1–10) · WebGPU-Profil ≤ 4 GB VRAM

**Status:** open
**BY:** — / opencode / qwen/qwen3.8-27b / local
**Continued from:** `WP-2026-10-16-KERN-PROTO-tokenwaechter-prototyp.md`
**TOPIC:** BENCH (neu im topic_registry) · **Sub-Topic:** PLAN
**Erstellt:** 2026-10-16
**Charakter:** **Planung** — Benchmark-Testdesign: Level, Szenarien, Modell-Pool, Hardware-Profil, Metriken, Reproduzierbarkeits-Protokoll.

> **Rollen-Trennung (AAMS):** Dieses WP plant und definiert das Benchmark-Testing.
> Es ist **keine** WH-Wahrheit. Wenn sich das Level-Design + Protokoll in echten
> Testläufen als stabil erweisen → erst **dann** `WH-002-BENCH-…` (siehe §10).

## session_goal

Die KERN-Simulation ist durch (Mechanik verifiziert, s. §1). Jetzt der nächste Schritt:
**echtes Benchmark-Testing mit echten Modellen** aus dem Modell-Pool (Superwächter resident,
Planer on-demand), echten Aufgaben, die in Teilaufgaben zerlegt werden müssen — in definierten
**Leveln (1–10)**, Level 1–5 voll ausformuliert. Ziel ist **nicht Perfektion**, sondern ein
**vorzeigbares, reproduzierbares Ergebnis auf minimaler Rechenleistung** (≤ 4 GB VRAM,
~35 GB RAM, Mehrkern-CPU). Der Benchmark ist zugleich **wissenschaftlicher Zeitzeuge**:
gleiche Tests später mit besserer Technik wiederholen → Fortschritt messbar.

## 1. Daten-Check (vorher beobachtet — Export `aams-session-s_1792143454543_1qofk0.json`)

| Check | Ergebnis |
|-------|----------|
| Tasks / Audit / Memory | 22 / 25 (22 `loop.step` + 3 `tokenwatcher.flush`) / 3 · `knowledge` leer |
| Alle Tasks `done`, jede Step-Audit-Zeile hat Task | ✅ |
| Flush-Zyklus | **alle 6 Schritte** (Steps 6, 12, 18) — exakt wie berechnet: `ceil(4096·0.8 / 600) = 6` ✅ |
| Step-Abstand | 1499–1502 ms (tickMs=1500, Timer-Jitter) ✅ |
| Timestamps (auditLog, memory) | nicht-dekrementierend ✅ (Flush teilt sich den Tick mit dem auslösenden Step — korrekt) |
| Task-Tree | **flach** (alle `parentId: null`) — KERN-Loop legt nur Top-Level-Tasks an |
| Konsistenz UI ↔ Datei | Datei = **Snapshot** (22 Steps, 32 s Laufzeit, 09:38 Uhr) · Live-UI (96 Steps / 16 Flushes) folgt derselben Mechanik: `96 / 6 = 16` ✅ |
| Platzhalter-Tasks | `ycycxycyxcyxc` + `Sub-Task (Platzhalter)` = `Agent.plan()/runStep()` aus `src/agent/agent.ts` (Scaffold) |

**Fazit:** AAMS-B-Daten sind intakt und nachvollziehbar. Die Mechanik (Tokenwächter-Flush)
ist im Export **belegt**. Jetzt: gleiche Beobachtung mit **echter LLM-Arbeit** statt Simulation.

## 2. Anspruch & wissenschaftlicher Teil

- **Minimal-Proof:** mit der kleinsten sinnvollen Rechenleistung (≤ 4 GB VRAM) ein
  **vorzeigbares Ergebnis** liefern. Muss nicht perfekt sein — muss aber **beweisen**
  und **reproduzierbar** sein.
- **Benchmark = Treppenfunktion:** `Level → (Erfolg, Zerlegung, Tokens, Zeit, VRAM, Integrität)`.
  Wir messen, **wo die Grenze liegt** (erster Fail-Level = Capability-Ceiling des Profils).
- **Hypothese (zu falschen):** Im ≤ 4-GB-Profil laufen Level 1–3 stabil (5/5), Level 4–5
  funktionieren mit Abstrichen, ab Level 6–7 nimmt die Fehlerquote messbar zu.
  → Wird durch die Testläufe bestätigt oder widerlegt — Ergebnis steht **nicht** vorher fest.
- **Zeitzeugnis:** Protokoll + Run-Logs bleiben archiviert. Spätere Wiederholung
  (bessere Modelle/Hardware, gleiche Szenarien) macht Fortschritt sichtbar:
  *„Die Technik und die Möglichkeiten werden besser."* — messbar, nicht nur gefühlt.

## 3. Level-Achse (Zerlegungskomplexität)

**Definition: Level N = die Aufgabe benötigt N Teilaufgaben** (beobachtbar im AAMS-B-Task-Tree).
Level 1–5 sind **voll ausformuliert** (Szenarien + DoD), 6–9 Skizze, 10 als Endziel definiert.

| Level | Teilaufgaben | Charakter | Beobachtungsschwerpunkt |
|-------|--------------|-----------|--------------------------|
| **L1** | 1 | einfache Aufgabe, **keine** Zerlegung | kann der Wächter allein (ohne Planer) liefern? |
| **L2** | 2 | minimale Zerlegung | Planer-JSON: 2 Einträge, valide? |
| **L3** | 3 | Standard-Zerlegung | Reihenfolge korrekt? alle 3 ausgeführt? |
| **L4** | 4 | Zerlegung + ein Zwischenergebnis fließt in Teilaufgabe 4 ein | Datenfluss zwischen Steps? |
| **L5** | 5 | Zerlegung + Zwischenergebnisse + finales Artefakt | Artefakt brauchbar? Integrität nach Flush? |
| L6 | 6 | (Skizze §6) | — |
| L7 | 7 | (Skizze §6) | — |
| L8 | 8 | (Skizze §6) | — |
| L9 | 9 | (Skizze §6) | — |
| **L10** | ~10 | **kleine App**: planen + bauen + HTML-Übersicht aus ausgewerteten Daten | End-to-End-Proof, Abhängigkeiten |

## 4. Szenarien (die „Textseiten") — Level 1–5

**Kategorien:** **A** = Recherche (sammeln · auswerten · verarbeiten) · **B** = Coding
(HTML + Python) · **C** = Rezepte (aus **greifbaren** Zutaten, Vegan/Andere/Krankheiten beachten).
Jedes Szenario ist ein fester Text (Prompt), der exakt so an den Agenten geht →
Reproduzierbarkeit. Jede Teilaufgabe ist im AAMS-B-Task-Tree **beobachtbar**.

> **Recherche-Track (wichtig für Reproduzierbarkeit):** Level A arbeiten mit einem
> **fixen Quellen-Korpus** (vorab gespeicherte Web-Texte als lokale Dateien, im Repo
> `bench/corpus/`). Live-Web-Fetch ist ein separater, **weniger reproduzierbarer**
> Beobachtungs-Track (nur optional, eigene Kennzeichnung).

### L1 — einfache Aufgabe (1 Teilaufgabe)

| ID | Szenario (Prompt, fester Text) | DoD (harte Kriterien) |
|----|--------------------------------|------------------------|
| A1 | „Nenne 5 Fakten zu **WebGPU** und gib zu mindestens einem eine Quellenangabe." | 5 Fakten · ≥ 1 Quelle · keine offensichtliche Erfindung (Spot-Check) |
| B1 | „Erstelle eine einzige HTML-Datei mit Titel, einem Absatz und einem Button. Button-Klick zeigt eine Meldung." | Datei rendert im Browser · Klick erzeugt Meldung |
| C1 | „Verfügbare Zutaten: **Tomate, Mozzarella, Basilikum**. Nenne genau ein passendes Gericht." | genau 1 Gericht · Zutaten ⊆ Liste (Zusätze explizit markiert) |

### L2 — 2 Teilaufgaben

| ID | Szenario | DoD |
|----|----------|-----|
| A2 | „Quelltext: [Korpus-K1, ~300 Wörter zu X]. (1) Extrahiere 5 Fakten. (2) Kürze die 3 wichtigsten." | 5 extrahiert, 3 gekürzt · alle in K1 nachvollziehbar |
| B2 | „(1) HTML-Formular (Name + E-Mail) mit Validierung. (2) Style es mit CSS." | leere/ungültige Eingabe wird blockiert · Styles sichtbar (Klassen/Inline) |
| C2 | „Zutaten: [4 Zutaten]. (1) Sichte die Zutaten. (2) Schlage 2 Rezepte vor, davon genau 1 vegan." | 2 Rezepte · genau 1 vegan · Zutaten ⊆ Liste (oder markiert) |

### L3 — 3 Teilaufgaben

| ID | Szenario | DoD |
|----|----------|-----|
| A3 | „Recherche [Thema X]: (1) Sammle Fakten aus [K1+K2]. (2) Prüfe Widersprüche/Belege. (3) Schreibe eine Zusammenfassung (≤ 5 Sätze) mit Quellen." | 3 Steps im Task-Tree · Zusammenfassung zitiert K1/K2 · Widersprüche markiert (falls vorhanden) |
| B3 | „(1) HTML-Seite mit Tabelle [fixes Datenset ~10 Zeilen]. (2) JavaScript-Filter. (3) Python-Skript, das die HTML-Tabelle parst und CSV schreibt." | 3 Artefakte · JS-Filter funktioniert · `python`-Skript läuft (außerhalb Browser, s. §8) |
| C3 | „Zutatenliste [6]. (1) Filtere vegane Optionen. (2) Recherchiere Allergene (Laktose, Gluten). (3) Schlage 3 Rezepte vor (≥ 1 vegan, ≥ 1 laktosefrei) mit Begründung." | 3 Rezepte · Restriktionen erfüllt · Allergen-Info vorhanden |

### L4 — 4 Teilaufgaben

| ID | Szenario | DoD |
|----|----------|-----|
| A4 | „Vergleich [Thema A vs B]: (1) Fakten A aus [K1]. (2) Fakten B aus [K2]. (3) Vergleichstabelle. (4) Empfehlung mit Begründung." | 4 Steps · Tabelle mit ≥ 3 Vergleichsachsen · Empfehlung belegt |
| B4 | „Mini-Dashboard: (1) Daten als JSON [fixes Set ~20 Zeilen]. (2) HTML-Tabelle. (3) JS: sortieren + filtern. (4) Export als CSV-Download." | 4 Steps · Sortier-/Filter-Interaktion funktioniert · CSV-Download valid |
| C4 | „Wochenplan: (1) Zutaten [8] aufnehmen. (2) 4 Tage planen (je 1 Gericht). (3) Einkaufsliste. (4) Kosten-Schätzung [gegebene Preisliste]." | 4 Tage · Einkaufsliste ⊇ alle Zutaten · Kosten = Summe laut Preisliste |

### L5 — 5 Teilaufgaben

| ID | Szenario | DoD |
|----|----------|-----|
| A5 | „Deep-Research [3 Quelltexte K1–K3]: (1) Fakten extrahieren. (2) Widersprüche markieren. (3) Bewertung (Verlässlichkeit je Quelle). (4) Fazit + offene Fragen. (5) Quellenverzeichnis." | 5 Steps · jede Bewertung belegt · Quellenverzeichnis vollständig |
| B5 | „Todo-App (eine HTML-Datei): (1) UI (Liste + Input). (2) CRUD per JS. (3) Persistenz via LocalStorage. (4) Styles. (5) Selbsttest-Protokoll (≥ 5 Fälle mit Ergebnis)." | CRUD funktioniert · Reload behält Einträge · Protokoll mit 5+ Fällen |
| C5 | „Ernährungsplan 7 Tage: (1) Zutaten [10]. (2) Planen: 7 Tage (Frühstück + Mittag). (3) Wo möglich vegan & laktosefrei. (4) Sortierte Einkaufsliste. (5) Hinweise zu Krankheits-Restriktionen (Beispiel: Bluthochdruck → Salz reduzieren)." | 14 Gerichte · Restriktionen sichtbar · Einkaufsliste sortiert · Hinweise konkret |

### L10 — kleine App (Endziel, ~10 Teilaufgaben mit Abhängigkeiten)

> „Plan und baue eine **kleine App**: Aus einem **fixen, vorab ausgewerteten Datenset**
> (z. B. 50 Zeilen: Verbrauch/Wetter/Preise) eine **HTML-Übersicht** (Dashboard) mit
> Charts (SVG/Canvas), Filter und Export.

| # | Teilaufgabe | Abhängig von |
|---|-------------|--------------|
| 1 | Daten analysieren (Schema + Kennzahlen) | — |
| 2 | Dashboard-Layout definieren | 1 |
| 3 | HTML-Gerüst | 2 |
| 4 | Charts aus Daten rendern | 1, 3 |
| 5 | Filter + Interaktion | 3 |
| 6 | Aggregierte Ansicht (Summen/Mittel) | 1 |
| 7 | Export (CSV/JSON) | 6 |
| 8 | Styles | 3 |
| 9 | Doku (README + Nutzung) | 3–8 |
| 10 | Test-Protokoll (≥ 5 Testfälle, alle grün) | 3–9 |

**DoD (der „Beweis"):** kleine App als (wenige) HTML-Datei(en) · läuft **offline** im Browser ·
Charts rendern aus dem Datenset · Filter + Export funktionieren · Test-Protokoll komplett.
→ **Vorzeigbares Ergebnis mit ≤ 4 GB VRAM** — das ist der Kern-Proof des Projekts.

### L6–L9 (Skizze — erst bei Bedarf ausformulieren)

| Level | A (Recherche) | B (Coding) | C (Rezepte) |
|-------|---------------|------------|-------------|
| L6 | 4 Quellen → Timeline + Einordnung | Parser-CLI (Python) + HTML-Bericht | Menü für 2 Personen mit unterschiedlichen Diäten |
| L7 | Behauptung prüfen (wahr/falsch + Beleg aus Korpus) | 2 Seiten + geteiltes JS (Mini-Web-App) | Rezept-Sammlung mit Tausch-Regeln (Substitution) |
| L8 | Mini-Report (~500 Wörter: Einleitung/Ergebnisse/Empfehlung/Quellen) | Datenpipeline: JSON → Statistiken (Python) → HTML | Ganze Woche + Saison + Budget + Tauschvorschläge |
| L9 | Report + Fakten-Check + Gegenargumente + Fazit | App mit Formular + Validierung + SVG-Chart | Ernährungsplan mit Makro-Schätzung (kcal/Protein) |

## 5. Modell-Pool & Rollen (WebGPU, ≤ 4 GB VRAM)

**Prinzip (aus `WP-…-ARCH-WAEC`):** Superwächter = klein + zuverlässig, **immer geladen**;
Planer = intelligenter, **on-demand**; das Wächter-Modell wird **ausgewählt**, nicht der „Kluge".

| Rolle | Kandidat (WebLLM-Prebuilt, `q4f16_1`) | Weights (ca.) | Lebensdauer |
|-------|----------------------------------------|---------------|-------------|
| **Superwächter** (resident) | `Qwen2.5-0.5B-Instruct-q4f16_1-MLC` | ~0,4 GB | immer geladen |
| **Planer / Denker** | `Llama-3.2-3B-Instruct-q4f16_1-MLC` | ~1,9 GB | on-demand |
| **Planer (Fallback)** | `Qwen2.5-1.5B-Instruct-q4f16_1-MLC` | ~1,1 GB | on-demand |
| (außerhalb ≤ 4-GB-Profil) | 7B+ | > 4 GB | ❌ nicht im Zielprofil |

**VRAM-Budget (≈, inkl. KV-Cache + WebGPU-Overhead; exakte Werte aus Model-Config `vram_required_MB`):**

| Kombination | ca. Bedarf | Passt in 4 GB? |
|-------------|-----------|----------------|
| Wächter allein | ~0,7 GB | ✅ locker |
| Wächter + Planer 3B | ~3,0–3,3 GB | ⚠️ eng (~0,7–1,0 GB Reserve) |
| Wächter + Planer 1,5B | ~1,8–2,2 GB | ✅ komfortabel |
| Wächter + 7B | > 5,5 GB | ❌ |

**Auswahl-Regeln (deterministisch → beobachtbar):**
1. **L1:** Wächter allein (Planer **nicht** laden → spart VRAM + Zeit).
2. **L2+:** Planer laden → **kompaktes Planer-JSON** (feste Felder, s. `ARCH-WAEC`) →
   Wächter schreibt es sparsam in AAMS-B (Task-Tree + Audit) → **Planer entladen** (VRAM frei).
3. **OOM/Load-Fehler:** Fallback-Leiter `3B → 1,5B → Degraded-Modus` (Wächter allein,
   L1-fähig) — Degraded-Modus wird im Run-Log **als solches** gekennzeichnet.
4. **Niemals** zwei große Modelle gleichzeitig (≤ 4 GB-Regel).

## 6. Hardware-Profil & Maschinensicht

**Referenz-Profil (Ziel-Hardware):** ≤ **4 GB VRAM** (dediziert) · ~**35 GB RAM** ·
Mehrkern-CPU (Consumer-Laptop). Alles muss in einer **kleinen Übersicht** sichtbar sein,
damit der Nutzer Platz & Leistung seiner Maschine sieht:

**Panel ④ „Maschine"** (neues UI-Panel, klein, immer sichtbar):

| Feld | Quelle (Browser-API) | Anmerkung |
|------|----------------------|-----------|
| WebGPU verfügbar | `navigator.gpu` | ja/nein + Fallback-Hinweis |
| Adapter (Vendor/Name) | `requestAdapter().requestAdapterInfo()` | z. B. NVIDIA/AMD/Intel |
| Adapter-Limits | `adapter.limits` (Buffer-/Storage-Größen) | ≈ VRAM-Indikator (kein exakter Wert — ehrlich kennzeichnen) |
| **VRAM-Fit** | Modell-Größen (§5) vs. Limits | 🟢/🟡/🔴 Wächter / Planer 3B / Planer 1,5B |
| CPU-Kerne | `navigator.hardwareConcurrency` | Logik-Kerne |
| RAM | `navigator.deviceMemory` | **Achtung:** API deckelt bei 8 GB → Anzeige „≥ 8 GB" (Ehrlichkeit, s. §8) |
| Speicher | `navigator.storage.estimate()` (usage/quota) | „Platz" für IndexedDB + Modell-Cache |
| Browser | `navigator.userAgent` | Teil des Run-Logs (Reproduzierbarkeit) |

→ Die Werte werden als **MachineProfile-JSON** in **jeden** Benchmark-Run-Log geschrieben
(Reproduzierbarkeit: gleiche Maschine/Browser = Vergleichbarkeit; andere = getrennte Kurve).

## 7. Metriken & Erfolgskriterien

**Pro Lauf (auto-logging in AAMS-B → JSON-Export):**

| Metrik | Quelle | Einheit |
|--------|--------|---------|
| Erfolg (hartes DoD) | Script/Manuell pro Szenario | 0/1 |
| Score (Rubrik) | 0 = Fail · 1 = teilweise · 2 = funktional · 3 = sauber + effizient | 0–3 |
| Geplante Teilaufgaben | AAMS-B `tasks` | Anzahl (vs. Level-Erwartung) |
| Token-Effizienz | LLM-Usage (in/out je Stufe) | Tokens |
| Zeit | `auditLog`-Timestamps | ms gesamt / je Teilaufgabe |
| VRAM | Adapter-Limits + Modell-Größen + (Load-/OOM-Ereignisse) | MB |
| Flush-Zyklen | `auditLog: tokenwatcher.flush` | Anzahl |
| **KERN-Integrität** | nach Flush: memory/audit/tasks vollständig? | 0/1 (Invariante!) |
| Modell-Ereignisse | `llm.load` / `llm.unload` (Audit) | Sequenz |

**Pass-Regel (der „Beweis"-Standard):**
- **Bewiesen:** 5/5 Läufe mit Score ≥ 2 **und** 0 harte DoD-Verstöße.
- **Funktional:** 3–4/5 Läufe mit Score ≥ 2.
- **Instabil:** ≤ 2/5.
→ Ein Level gilt nur dann als *bewiesen*, wenn es 5/5 hält — sonst ist es eine **Grenzbefundung**
(was genauso wertvoll ist: sie markiert die Capability-Ceiling des Profils).

## 8. Testprotokoll (Reproduzierbarkeit — der wissenschaftliche Teil)

1. **Fixieren aller Variablen:**
   - Modell-ID + Quant + **exakte Weights-Revision** (HuggingFace-URL in Run-Log)
   - `context_window_size`, `temperature = 0` (Planung) / `0,2` (Generierung), `max_tokens`
   - Szenario-Texte **exakt** (Repo `bench/scenarios/`) · fixer Quellen-Korpus (`bench/corpus/`)
   - Browser + Version + GPU-Treiber · WebLLM-Version (`package-lock.json`)
   - MachineProfile (§6)
2. **Durchführung:** pro Szenario **N = 5 Läufe**, jeweils **frische Session** (AAMS-B),
   Level-Reihenfolge L1 → L10 (oder isoliert je Szenario).
3. **Auto-Logging:** jeder Lauf → AAMS-B (`auditLog` + `memory`, `kind: "benchmark"`)
   → JSON-Export `bench/{szenario}/{run-n}.json` (enthält MachineProfile + Modell-Revisionen).
4. **Auswertung:** Median + min/max pro Level · Tabelle Level × Metrik ·
   erster Fail-Level = dokumentierte Ceiling.
5. **Archiv:** Run-Logs + Auswertung in `WORKING/LOGS/bench/` + LTM-Eintrag;
   stabile Aussagen → **WH-002** (§10).
6. **Zeit-Dimension:** Wiederholung später (bessere Modelle/Hardware, **gleiche** Szenarien)
   → Fortschrittskurve im selben Protokoll.

**Ehrliche Grenzen (bewusst im Protokoll, nicht dahinter versteckt):**
- **Python:** der Browser führt Python **nicht** aus → Python-Artefakte (B3, B5, L6–L9)
  werden *generiert* und **außerhalb** des Browsers verifiziert (z. B. `python -m py_compile` +
  Lauf-Check). HTML-Aufgaben = geschlossener Testkreis **im** Browser (vollständig beweisbar).
- **RAM-API** deckelt bei 8 GB → wir berichten „≥ 8 GB", keinen Schein-Präzisionswert.
- **VRAM** ist im WebGPU-API nur als Limits-Proxy sichtbar → Fit-Anzeige ist ein
  **Indikator** (🟢/🟡/🔴), kein Messwert.
- **Recherche:** Live-Web ist nicht reproduzierbar → fixer Korpus als Standard-Track,
  Live-Track nur als gekennzeichnete Zusatzbeobachtung.

## 9. Umsetzung (Plan — „Benchmark-Textseite" + Maschinensicht)

| Schritt | Inhalt | Wo |
|---------|--------|----|
| 1 | **Modell-Pool:** Rollen (Wächter/Planer), load/unload, VRAM-Budget, Fallback-Leiter | `src/llm/pool.ts` (ersetzt Einzel-Default in `webllm.ts`) |
| 2 | **Echte Zerlegung:** `Agent.plan()` → Planer-JSON (feste Felder) → AAMS-B-Task-Tree | `src/agent/agent.ts` |
| 3 | **Echte Ausführung:** `runStep()` pro Task-Typ (recherche/coding/rezept/artefakt) | `src/agent/agent.ts` |
| 4 | **Szenario-Daten:** Level 1–10 als Daten (Prompt, DoD, Erwartung) | `src/bench/scenarios.ts` |
| 5 | **Benchmark-Seite (Textseiten):** Level wählen → Szenario-Text → Start → beobachten | `src/ui/bench.ts` |
| 6 | **Maschinensicht:** Panel ④ „Maschine" + MachineProfile-JSON | `src/ui/machine.ts` |
| 7 | **Run-Log & Report:** Auto-Logging → JSON-Export → Ergebnistabelle | `src/bench/report.ts` |
| 8 | **Erster Testlauf:** L1 (alle 3 Kategorien) × 5 Läufe → Erkenntnisse hierher | (dieses WP) |

**DoD Umsetzung:** `typecheck` + `build` grün · L1 läuft 5/5 „Bewiesen" **oder** der
Befund (warum nicht) ist sauber dokumentiert — beides ist ein gültiges Ergebnis.

## 10. WH-Kandidat (erst nach Bestätigung durch Testläufe)

| Kandidat | In WH? |
|----------|--------|
| **Benchmark-Level-System** (Level = Teilaufgaben-Anzahl, L1–L10, DoD pro Szenario) | → **WH-002-BENCH-…**, wenn L1–L5 in echten Läufen validiert |
| **Hardware-Profil ≤ 4 GB VRAM / ~35 GB RAM** + VRAM-Budget + Fallback-Leiter | → ja (WH-002) |
| **Pass-Regel 5/5** + Fixier-Protokoll (Reproduzierbarkeit) | → ja (WH-002) |
| **Ehrliche-Grenzen-Kasten** (Python außerhalb, RAM-Cap, VRAM-Proxy, Korpus-Track) | → ja (WH-002) |

## open_questions

1. Temperature: `0` (Planung) + `0,2` (Generierung) — oder beides `0`? (A/B im ersten L1-Test)
2. N = 5 manuell oder „5× automatisch" per UI-Button (Halb-Automatik)?
3. Maschinensicht: MachineProfile in AAMS-B (`knowledge`) oder eigener Store? (Neigung: AAMS-B — bleibt im Export)
4. Python-Verifikation: reiner `py_compile`-Check reicht für v1, oder fester Test-Skript-Rahmen?
5. Live-Web-Track: schon jetzt (Web-Fetch-Helfer) oder erst nach L5-Stabilität?
6. L10-Datenset: welches fixe Set (Energie/Wetter/Preise)? → in `bench/corpus/` fixieren

## next_steps

- [ ] **Bestätigen** (User): Level-Definition + Szenario-Texte L1–L5 + L10
- [ ] Modell-Pool `src/llm/pool.ts` (Wächter resident + Planer on-demand + Fallback)
- [ ] `Agent.plan()/runStep()` → echte LLM-Zerlegung/-Ausführung (ersetzt Scaffold-Platzhalter)
- [ ] `src/bench/*` (scenarios, report) + UI-Benchmark-Seite + Panel ④ „Maschine"
- [x] **Voraussetzung saubere Runs:** frisches Gedächtnis pro Run — Gedächtnis-Reset vorhanden
      (`WP-2026-10-16-SESS-RESET-…`, closed, Button „↺ Gedächtnis zurücksetzen" in Panel ②)
- [ ] **Erster Testlauf L1 × 3 Kategorien × 5 Runs** → Erkenntnisse + Befund in dieses WP
- [ ] Stabil? → **WH-002-BENCH** anlegen (WH-Kandidat §10)
