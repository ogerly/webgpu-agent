# WP-2026-10-17 — TRAIN-PLAN: Wächter-Spezialist für den WebGPU-Agenten

> **Typ:** Workpaper (Arbeitsdokument, **kein** Whitepaper)
> **Status:** open · **Forschungsplan, stufenweise, mit Abbruchkriterien**
> **Bezug:** WH-001 · WH-002 · WP-2026-10-17-PROPOSAL (V1–V5)
> **Lebenszyklus:** Nach jeder Stufe aktualisieren. Strukturelle Entscheidungen (z. B. neues Modell im Pool) → Decision Record in WH-002. Danach → `closed/`.

---

## 0. Auftrag an den Agenten

1. **Prüfe** den Plan gegen den Code-Stand (Run-Log-Format, `src/llm/catalog.ts`, `src/bench/scenarios.ts`). Alles Unklare als offene Frage notieren, nicht raten.
2. **Setze nur Stufe 0 sofort um** (Datenerfassung, Abschnitt 4). Die Stufen 1–5 sind Forschungsschritte, die der Mensch freigibt.
3. **Toolchain-Angaben** (MLC-LLM, Trainings-Frameworks, WebLLM-Custom-Modelle) ändern sich schnell: **gegen die aktuelle Doku prüfen**, nicht aus diesem Dokument übernehmen.
4. Erfinde keine Messwerte. Jede Aussage über Besserung braucht einen Benchmark-Vergleich (Abschnitt 6).

## 1. Ziel & Hypothese

**Ziel:** Ein schmales Wächter-Modell (0,5B–1,5B), das auf die **Protokoll-Aufgaben** des Agenten zugeschnitten ist und im ≤ 4-GB-VRAM-Profil läuft.

**Hypothese:** Ein getunter Spezialist ist in diesen engen, prüfbaren Aufgaben **zuverlässiger** als das ungetunte Basismodell, bei gleicher Größe. Er ist ausdrücklich **kein** Generalist.

**Aufgaben des Spezialisten (Scope):**
- Planer-JSON im festen Schema (WH-002 §4), ohne Retry-Bedarf
- Tool-Aufruf-JSON (Tool-Wahl + Parameter) aus der Registry
- Skill-Routing (welche Skill-Beschreibung passt)
- Memory-Zusammenfassung im AAMS-B-Format (Reflexionsschritt)

**Widerlegt, wenn:** Die getunte Variante die Baseline (Abschnitt 5, Stufe 1) in den Metriken nicht schlägt. Das ist ein gültiges Ergebnis.

## 2. Leitplanken

| # | Leitplanke |
|---|-----------|
| T1 | **Autonomie:** Das Endprodukt läuft im Browser (WebGPU), ohne Server und ohne Cloud. Training darf extern passieren, **Inferenz nie**. |
| T2 | **Profil:** ≤ 4 GB VRAM (WH-002). Kein neues Modell, das den Pool-Plan sprengt. |
| T3 | **Strikte Train/Test-Trennung** (Abschnitt 3). Ein Benchmark, auf dem trainiert wurde, misst nichts. |
| T4 | **Nur programmatisch geprüfte Daten** gelangen in den Trainingssatz. Kein Modell bewertet sich selbst. |
| T5 | **Lizenz zuerst:** Basismodell und Lehrermodell vor Nutzung prüfen und dokumentieren (Abschnitt 7). |
| T6 | **Reproduzierbar:** Daten-Version, Basismodell + Revision, Hyperparameter, Seed und Commit-Hash jedes Laufs werden festgehalten. |
| T7 | **Ehrliche Grenzen:** Ein getunter Wächter wird nicht als „intelligent" beschrieben, sondern als „zuverlässig im Protokoll". |

## 3. Daten & Train/Test-Trennung

### 3.1 Datenformat (JSONL, eine Zeile pro Beispiel)

```json
{
  "id": "…",
  "task": "plan | tool_call | skill_route | memory_summary",
  "scenario_id": "…",
  "split": "train | val | test",
  "messages": [{"role": "system|user|assistant", "content": "…"}],
  "target": "…",
  "checks": {"schema_valid": true, "dod_passed": true, "details": {}},
  "source": "teacher | model_run",
  "meta": {"model": "…", "revision": "…", "commit": "…", "tool_registry_version": "…", "timestamp": "…"}
}
```

Nur Beispiele mit `checks.schema_valid == true` und (wo anwendbar) `checks.dod_passed == true` kommen in den Trainingssatz.

### 3.2 Trennung (Pflicht)

| Split | Inhalt | Regel |
|-------|--------|-------|
| **train** | Viele **Varianten** (Umformulierungen, andere Zutaten/Quellen/Themen) der Szenario-Typen | darf nie fixe Benchmark-Texte enthalten |
| **val** | Eigene Varianten für Training-Kontrolle | nie im Training |
| **test** | Die **fixen Benchmark-Szenarien aus WH-002** + zurückgehaltene Zusatz-Szenarien | **nie** im Training, nie als Lehrerbeispiel |

Zusätzlich prüfen: Dubletten und Beinahe-Dubletten zwischen train und test (Text-Ähnlichkeit) → entfernen.

### 3.3 Datenquellen

1. **Eigene Läufe (`model_run`):** Gute Läufe des Agenten, die die DoD-Prüfungen bestehen. Schlechte Läufe sind als Negativbeispiele für die Analyse nützlich, **nicht** als Trainingsziel.
2. **Lehrermodell (`teacher`):** Ein stärkeres Modell (z. B. lokal über LM Studio) erzeugt saubere Pläne und Tool-Aufrufe zu den Trainings-Varianten. Jede Ausgabe läuft durch dieselben Prüfungen.
3. **Synthetische Variation:** Programmatisch erzeugte Szenario-Varianten (andere Parameter, gleiche Struktur).

## 4. Stufe 0 — Datenerfassung (sofort umsetzbar, kein Training)

Erweitere das Run-Log so, dass **jeder Lauf** zusätzlich speichert:

- vollständige Prompts und Antworten pro LLM-Aufruf (nicht nur Metriken)
- Ergebnis jeder programmatischen Prüfung (Schema, DoD)
- Commit-Hash, Tool-Registry-Version, Skill-Stand, Modell + Revision
- Split-Kennzeichnung (Benchmark-Szenarien sind **immer** `test`)

Ausgabe: `WORKING/LOGS/train-data/{datum}/*.jsonl`. Keine personenbezogenen Daten ins Log; Daten bleiben lokal.

**DoD Stufe 0:** Ein Benchmark-Lauf erzeugt valide JSONL-Zeilen im Format 3.1; ein Validator-Skript meldet 0 Formatfehler.

## 5. Stufenplan mit Abbruchkriterien

| Stufe | Inhalt | Ergebnis | Abbruch / Weiter |
|-------|--------|----------|------------------|
| **0** | Datenerfassung (Abschnitt 4) | wachsender Datensatz | Weiter, sobald Format stabil |
| **1** | **Baseline ohne Training:** Prompt-Optimierung + grammatik-/schemabasierte JSON-Ausgabe in WebLLM (Unterstützung in der eingesetzten Version prüfen) | Referenzwerte für Planer-JSON/Tool-Aufruf | Wenn Baseline schon ≥ Zielwert → Training überflüssig, Stufe 2+ streichen |
| **2** | **Datensatz-Aufbau:** Lehrermodell + Filter, Train/Val/Test-Split, Dubletten-Check | versionierter Datensatz (`train-data-vN`) | Weiter bei genügend gefilterten Beispielen je Task (Mindestmenge vorab festlegen, nicht erst danach) |
| **3** | **Erstes Tuning** (LoRA/QLoRA) auf 0,5B, danach ggf. 1,5B | getunter Adapter + Trainingsprotokoll | Abbruch, wenn Val-Metriken nicht besser als Baseline |
| **4** | **Export für WebGPU:** Adapter zusammenführen, quantisieren (q4f16_1), für WebGPU kompilieren, in WebLLM laden (Toolchain gegen aktuelle Doku prüfen) | lauffähiges Modell im Browser | Abbruch, wenn Export Qualität oder VRAM-Profil bricht |
| **5** | **Benchmark-Vergleich:** Base vs. Tuned im selben WH-002-Protokoll | Befund (siehe 6) | Entscheidung über Aufnahme in den Pool (→ Decision Record) |

Jede Stufe endet mit einer kurzen Auswertung im Workpaper (Was gemessen, was herausgekommen, Weiter/Abbruch).

## 6. Metriken (Base vs. Tuned)

Immer unter identischen Bedingungen (Modell-Pool-Regeln, Protokoll aus WH-002, Seed fixiert, soweit WebLLM es erlaubt):

- **Schema-Validität** (Planer-/Tool-JSON ohne Retry), in Prozent der Läufe
- **Tool-Wahl korrekt** (gegen Referenz) und **Parameter korrekt**
- **Retry-Rate**
- **DoD-Erfolg** der Szenarien (hart, programmatisch)
- **Token und Zeit** pro Aufgabe, **VRAM-Spitze**
- **Test-Set-Leistung getrennt** von Val-Leistung ausweisen (Überanpassung sichtbar machen)
- **Streuung:** Läufe mehrfach, Spannweite angeben; Vergleichbarkeit gilt nur im Rahmen der Streuung (WebGPU-Determinismus ist nicht garantiert)

„Besser" heißt: Verbesserung **außerhalb** der Streuung auf dem Test-Split.

## 7. Lizenz & Compliance (vor Stufe 2 abschließen)

- Lizenz des Basismodells **selbst lesen** und im Workpaper festhalten (Nutzung, Weitergabe, abgeleitete Modelle).
- Nutzungsbedingungen des **Lehrermodells** prüfen, ob Ausgaben zum Training anderer Modelle erlaubt sind. Bei Unklarheit: anderes oder offen lizenziertes Lehrermodell wählen.
- Keine fremden urheberrechtlich geschützten Texte in den Trainingssatz; bei Recherche-Szenarien nur eigene oder frei lizenzierte Quellen-Korpora.
- Dokumentation der Herkunft jedes Datensatzes (`source`, `meta`).

## 8. Risiken

| Risiko | Gegenmaßnahme |
|--------|---------------|
| Daten-Leckage / Auswendiglernen | Strikter Split (T3), Dubletten-Check, zurückgehaltene Test-Szenarien |
| Lehrer-Fehler im Trainingssatz | Nur programmatisch geprüfte Beispiele (T4) |
| Überanpassung auf das Protokoll, Verlust von Allgemeinwissen | Aufgabe bewusst eng halten; Generalisten-Leistung nicht versprechen (T7) |
| Export bricht Qualität (Quantisierung) | Stufe 4 misst vor/nach Export |
| Moving Target (Agent ändert sich laufend) | Commit-Hash, Registry- und Skill-Version in jedem Datensatz |
| Aufwand unterschätzt | Abbruchkriterien pro Stufe; Stufe 1 kann alles beenden |

## 9. Definition of Done (Gesamtplan)

- Stufe 0 läuft, Datensatz wächst mit validem Format.
- Baseline (Stufe 1) ist gemessen und dokumentiert.
- Für jede abgeschlossene Stufe existiert eine kurze, ehrliche Auswertung — auch bei Abbruch.
- Wird ein getuntes Modell in den Pool aufgenommen, steht der Beleg (Base vs. Tuned, Test-Split, außerhalb der Streuung) im Decision Record in WH-002.

## 10. Nicht-Ziele

- Kein Generalisten-Training, kein Wettlauf mit großen Modellen.
- Kein Training auf den fixen Benchmark-Szenarien.
- Keine Cloud-Inferenz im Endprodukt.
- Kein Multi-Agent-Mesh in diesem Plan (spätere, eigene Phase; in WH-001 ein Nicht-Ziel).
- Keine Annahme, dass Training sich lohnt, bevor die Baseline gemessen ist.

## 11. Verweise

* → `WORKING/WHITEPAPER/WH-001-ARCH-webgpu-single-agent-prototype.md`
* → `WORKING/WHITEPAPER/WH-002-BENCH-benchmark-levels-webgpu.md`
* → `WP-2026-10-17-PROPOSAL-opfs-pyodide-extension-hermes-lite.md`
* → Szenarien: `src/bench/scenarios.ts` · Katalog: `src/llm/catalog.ts` · Pool: `src/llm/pool.ts`
