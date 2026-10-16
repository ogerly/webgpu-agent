# WP-2026-10-16-BENCH-IMPL — Modell-Pool + echter Agent-Loop (Zerlegung & Ausführung)

**Status:** open
**BY:** — / opencode / qwen/qwen3.8-27b / local
**Continued from:** `WP-2026-10-16-BENCH-PLAN-benchmark-levels-webgpu.md` (Umsetzung Schritt 1–3)
**TOPIC:** BENCH · **Sub-Topic:** IMPL
**Erstellt:** 2026-10-16
**Charakter:** **Umsetzung** — die erste echte Einheit: Modell-Pool (Wächter resident + Planer on-demand)
+ **sauberes Modell-Panel** (Auswahl + Download-Fortschritt) + ein echter Agent-Loop:
Aufgabe → **Zerlegung in Teilaufgaben (Planer-JSON)** → **Ausführung** → Ergebnis in AAMS-B.
Ersetzt die Scaffold-Platzhalter in `Agent.plan()/runStep()`.

## session_goal

„Modelle haben in unserem Modell-Pool. Das Wächtermodell wird ausgewählt. Und dann sollte es
mit einer Aufgabe, die in Teilaufgaben zerlegt werden muss, abgearbeitet werden können."
→ Genau das wird jetzt real: **kein Platzhalter mehr.** Die Beobachtung (welches Modell tut was,
wann VRAM frei wird, was die Teilaufgaben sind) ist die **Basis für alle Benchmark-Level**.

## ground-truth (WebLLM 0.2.86 — installiert, 2026-10-16 geprüft)

| Modell (Prebuilt) | `vram_required_MB` | Context | Rolle |
|-------------------|--------------------|---------|-------|
| `Qwen2.5-0.5B-Instruct-q4f16_1-MLC` | **944** | 4096 | **Wächter** (resident) |
| `Llama-3.2-3B-Instruct-q4f16_1-MLC` | **2263** | 4096 | **Planer** (on-demand) |
| `Qwen2.5-1.5B-Instruct-q4f16_1-MLC` | **1629** | 4096 | **Planer-Fallback** |

**VRAM-Budget (Zielprofil ≤ 4096 MB):**
- Wächter allein: **944 MB** → ~3,1 GB Reserve ✅
- Wächter + Planer 3B: **3207 MB** → ~0,8 GB Reserve ⚠️ eng (Benchmark beobachtet das!)
- Wächter + Planer 1,5B: **2573 MB** → ~1,5 GB Reserve ✅
→ Fallback-Leiter `3B → 1,5B` hält das Profil in jedem Fall.

Weitere Ground-Truth: `MLCEngine.unload(): Promise<void>` existiert (VRAM-Frei) ·
`ChatCompletion.usage` liefert **echte Token-Zahlen** (prompt/completion/total) →
die KERN-PROTO-Offene „reale Token-Zählung" ist damit technisch gelöst.

## plan (Design-Entscheidungen)

### 1. Rollen & Auswahl (deterministisch → beobachtbar)

| Situation | Wächter (0.5B, resident) | Planer (3B, on-demand) |
|-----------|--------------------------|------------------------|
| **L1 / einfache Aufgabe** (1 Teilaufgabe, explizit) | **ausführt** | **wird nicht geladen** (spart VRAM+Zeit) |
| **L2+ / zerlegen** (2+ Teilaufgaben) | orchestriert: schreibt Plan-JSON in AAMS-B, führt aus | **zerlegt** → JSON → wird **entladen** |
| **Executor-Regel:** | Task mit `parentId = null` (Wurzel, keine offenen Kinder) | Task mit `parentId ≠ null` (Teilaufgabe) |

→ Keine Schema-Änderung: die Executor-Rolle wird **abgeleitet** (Wurzel vs. Teilaufgabe) —
WH-001-Schema bleibt unverändert.

### 2. Planer-JSON (feste Felder, aus `WP-…-ARCH-WAEC`)

```json
{
  "verstaendnis": "kurz & präzise",
  "teilaufgaben": [ { "id": "T1", "beschreibung": "…", "prioritaet": 1 } ],
  "vorentscheidungen": ["…"],
  "risiken_oder_offen": ["…"]
}
```
- Prompt ist **fix** (Reproduzierbarkeit) · `expectedSubtasks` (Szenario/Benchmark) wird als
  Hinweis „Erwarte genau N Teilaufgaben" mitgegeben.
- Parsing robust: Code-Fences stripfen, erstes `{` … letztes `}`.
- `verstaendnis` → `memory` (kind: decision) · Plan → Task-Tree · Modell + Degraded-Status → Audit.

### 3. Ausführung & Beobachtung (Audit-Aktionen, neu)

| Aktion | Wann | Note |
|--------|------|------|
| `llm.load` | Modell geladen (Pool-Event) | model, vram_MB |
| `llm.unload` | Modell entladen | model |
| `llm.fallback` | Fallback-Leiter | model → model |
| `llm.degraded` | Planer nicht ladbar → Wächter übernimmt | als solches gekennzeichnet! |
| `plan.created` | Zerlegung abgeschlossen | model, N Teilaufgaben, degraded? |
| `llm.execute` | Teilaufgabe ausgeführt | model, **echte Token-Zahlen** (usage) |
| `task.root_done` | alle Kinder done → Wurzel auto-done | N/N |

### 4. Fehler- & Randfälle

- Planer-JSON unlesbar → **1 Retry** mit Hinweis „ANTWORTE NUR mit JSON" → noch falsch:
  Fehler in Audit + Task bleibt `pending` (nichts halbfertig).
- Ausführung wirft → Task zurück auf `pending` + Audit `llm.error` (Loop kann weiter).
- Doppelklick/Parallelität: `plan()`/`runStep()` sind sequenziell (UI-Buttons, kein Racing).
- **Erst-Load lädt Weights (einmalig, ~0,9/2,3 GB) aus dem Netz** → danach Browser-Cache
  (lokale Inferenz bleibt zu 100 % — Download ist Setup, wird im Status sichtbar).

## implementation

| Datei | Inhalt |
|-------|--------|
| `src/llm/engine.ts` | `chat()` liefert `{ content, usage? }` · `unload(): Promise<void>` |
| `src/llm/webllm.ts` | Umsetzung `unload()` + Usage-Mapping |
| `src/llm/catalog.ts` (neu) | **Modell-Katalog** (7 Instruct-Modelle q4f16_1 ≤ 4 GB, exakte `vram_required_MB` aus der Lib) + Defaults |
| `src/llm/pool.ts` (neu) | `ModelPool`: Rollen, **Modell-Auswahl** (`selectWaechter/selectPlanner`), `loadWaechter/unloadWaechter`, `ensurePlanner()` (Fallback-Leiter), `unloadPlanner()`, `status()`, **`progress`** (InitProgressReport), Events |
| `src/agent/task-queue.ts` | `nextExecutable()` (erste offene Aufgabe ohne offene Kinder) + `pendingChildren()` + `allChildrenDone()` |
| `src/agent/agent.ts` | **echtes** `plan(goal, expectedSubtasks?)` + **echtes** `runStep()` (Executor-Regel, Audit, Token-Usage) |
| `index.html` | **Panel ① „Modell-Pool (WebGPU)"**: 2× Modell-Dropdown (mit ≈MB) + Laden/Entladen + **Download-Fortschritt** (Balken + % + Schritt + Zeit + ≈Größe) + Budget-Zeile · Panels ②–④ nummeriert |
| `src/ui/app.ts` | `renderPool()` + `renderProgress()` + `setRoleState()` (○/◌/●/⚠) + Verdrahtung · Plan-Button: + optionale Eingabe „Erwartete Teilaufgaben" |
| `src/main.ts` | `ModelPool` statt Einzel-Engine; Pool-Events → **Audit** (`pool.select`, `llm.load/unload/fallback/degraded/error`) + Status-Zeile + Fortschritts-Anzeige |

**Progress-Semantik (Bundle-Check, 0.2.86):** Download = `fetchedBytes / totalBytes`
→ **0–100 % über den gesamten Download** · danach Schritte wie „Creating model" (Text zeigt
den Schritt) · `timeElapsed` in Sekunden · Cache-Treffer → sofort 100 %.

## verification

- `npm run typecheck`: ✅ (2026-10-16, keine Fehler)
- `npm run build`: ✅ (Vite; Chunk-Size-Warnung = WebLLM-Lib, war bereits vorher da)
- Keine verwaisten Referenzen (`ensureLLM`/Einzel-Engine entfernt) — grep sauber
- **Browser-Protokoll (User):**
  1. **Panel ① sichtbar:** 2× Modell-Dropdown (mit ≈MB) + Status „○ nicht geladen" + Budget-Zeile.
  2. **Wächter laden:** „▶ Laden" → **saubere Download-Anzeige** (Balken, %, Schritt, Zeit, ≈Größe)
     → „● bereit" → Budget-Zeile zeigt ~945 MB. „⏹ Entladen" → wieder „○" + 0 MB.
  3. **Modell wechseln:** Dropdown auf „Qwen2.5-Coder 0.5B" → Status-Zeile + Audit `pool.select`.
  4. **Planer laden:** „▶ Laden" (Llama-3.2-3B) → Download-Anzeige → „● bereit" → ~3208 MB geladen.
  5. `npm run dev` → „+ Aufgabe planen" → Ziel: „Nenne 3 Fakten zu WebGPU" · **Teilaufgaben: 1**
     → Wächter (falls entladen: auto-Load) → **direkt ausgeführt** (kein Planer!) → Ergebnis in Task.
  6. „+ Aufgabe planen" → Ziel L2 (s. BENCH-PLAN) · **Teilaufgaben: 2**
     → Task-Tree zeigt **2 Teilaufgaben** → beide ausgeführt → Planer **wird entladen** („VRAM frei")
     · Audit zeigt `pool.select / llm.load / llm.execute / llm.unload`.
  7. VRAM-Monitor (Task-Manager): Wächter allein vs. Wächter+Planer → Werte notieren.
  8. Fehler-Pfad: Planer-JSON unlesbar → Retry → Audit `plan.*` sichtbar.

## beobachten (in der Praxis)

- [ ] Lädt der Planer zuverlässig (Downloads, Fortschritt)?
- [ ] Wie lange dauert Wächter- vs. Planer-Load? (Zeit notieren)
- [ ] Zerlegt der 3B-Planer sauber (JSON valide, richtige Anzahl)?
- [ ] Executor-Qualität: Wächter (L1) vs. Planer (L2+) — wo ist die Kante?
- [ ] VRAM: Wächter+Planer parallel → passt es in 4 GB? (Fallback-Test: Task-Manager)
- [ ] Entladung: wird VRAM wirklich frei (vorher/nachher)?
- [ ] Token-Usage: realistisch? (pro Teilaufgabe)

## open_questions

1. Executor für L2+: **immer Planer** (aktuell) oder Wächter-Versuch mit Planer-Eskalation?
   (Neigung: Planer direkt — deterministischer für den Benchmark)
2. `expectedSubtasks` aus der UI-Eingabe — reicht das für die Benchmark-Seite, oder kommen
   die Szenarien später direkt aus `src/bench/scenarios.ts`? (Neigung: Szenario-Modul)
3. Wurzel-Abschluss: nur „N/N done" oder Wächter-Zusammenfassung aller Ergebnisse?
   (Neigung: erst N/N, Zusammenfassung = L10-Aufgabe)
4. Token-Usage → in den **Tokenwächter** (KERN-PROTO offen) einbinden? → nächste WP.

## next_steps

- [ ] Browser-Protokoll (verification) ausführen → Erkenntnisse hier notieren
- [ ] **Benchmark-Seite** (Szenario-Textseiten L1–L5 + Start) → `src/bench/scenarios.ts` + `src/ui/bench.ts`
- [ ] **Panel ④ „Maschine"** (WebGPU/CPU/RAM/Speicher + MachineProfile-JSON)
- [ ] **Run-Log & Report** (Auto-Logging → JSON-Export → Ergebnistabelle) → `src/bench/report.ts`
- [ ] Token-Usage → Tokenwächter (echte statt simulierte Tokens)
