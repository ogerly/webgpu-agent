# WP-2026-10-16-SESS-RESET — Agenten-Gedächtnis komplett & sauber zurücksetzen

**Status:** closed ✅ (2026-10-16 — umgesetzt + manuell verifiziert, User: „ok geht")
**BY:** — / opencode / qwen/qwen3.8-27b / local
**Continued from:** `WP-2026-10-16-BENCH-PLAN-benchmark-levels-webgpu.md`
**TOPIC:** SESS (neu im topic_registry) · **Sub-Topic:** RESET
**Erstellt:** 2026-10-16
**Charakter:** **Planung + Umsetzung** in einem WP — Gedächtnis-Reset (AAMS-B) als saubere, sichere Funktion.

## session_goal

Das **Gedächtnis des Agenten (AAMS-B)** lässt sich **komplett und sauber** zurücksetzen:
ein Klick → alles wird neu (frische Session), aber **nichts geht verloren** (automatischer
Safety-Export) und der Reset ist **nachvollziehbar** (Audit-Spur) und **fehler-sicher**
(bei Speicherfehler: Rollback, kein halber Zustand). Damit haben wir die
„Neue Session" aus `idee.md §3A` als echte Funktion — und die Basis für saubere
Benchmark-Runs (jeder Level-Test startet mit leerem Gedächtnis, s. `WP-…-BENCH-PLAN`).

## plan (vor Umsetzung)

### 1. Scope — was ist „Gedächtnis"?

| **Dazugehört (wird zurückgesetzt)** | **Geht NICHT ran (bewusst)** |
|-------------------------------------|-------------------------------|
| AAMS-B in IndexedDB: `tasks` (Task-Tree) | LLM-Engine / VRAM / geladene Modelle |
| `auditLog` (Diary) | WebLLM-Weights-Cache im Browser (bleibt → kein Re-Download) |
| `memory` (Langzeit-Kontext) | Repo-Dateien, manuelle JSON-Exporte des Users |
| `knowledge` (stabile Regeln) | Browser-Cache (allgemein) |
| Session-Metadaten (ID, Titel, Zeitstempel, Status) | |
| **KERN-Interna:** Context-Tokens, Step-Zähler, Timer | |

### 2. Sicherheits-Regeln (Invarianten — das ist das „sauber")

1. **Erst stoppen:** KERN-Loop wird **vor** der Löschung gestoppt und auf null gesetzt
   (keine Waisen-Write in einen alten Zustand; kein Timer läuft weiter).
2. **Safety-Export:** **vor** dem Löschen wird automatisch ein JSON-Export des
   kompletten Zustands ausgelöst → **nichts geht verloren**.
3. **Komplett:** alle vier Sammlungen + Session-Metadaten → neu. Kein Teil-Reset,
   keine Halbzustände.
4. **Nachvollziehbar:** die neue Session startet mit **genau einem** Audit-Eintrag
   `session.reset` (vorherige Session-ID + Zählungen) → der Reset ist **über die
   Grenze hinweg sichtbar** (AAMS-Philosophie: dokumentieren, was geschah).
5. **Fehler-sicher:** IndexedDB-Speichern schlägt fehl → In-Memory-Zustand wird
   **zurückgerollt**, Fehler ist sichtbar. (Kein „halb zurückgesetzt".)
6. **In-Place:** das **gleiche** Dokument-Objekt wird mutiert (etabliertes Pattern,
   siehe Import in `src/ui/app.ts`) → keine hängenden Referenzen in Agent, KERN, UI.

### 3. Reihenfolge (Sequenz)

```
Klick „↺ Gedächtnis zurücksetzen"
  → Bestätigung (zählt, WAS gelöscht wird: Tasks/Audit/Memory/Knowledge)
  → 1) KERN: Timer stoppen, tokens = 0, step = 0
  → 2) Safety-Export: aams-safety-{altId}.json (kompletter Zustand)
  → 3) In-Place-Reset: neue Session-ID + Titel/Zeiten, alle Sammlungen leer,
       Audit-Log = [ session.reset (mit Referenz auf alte Session) ]
  → 4) Persistieren (IndexedDB) — Fehler → Rollback + Meldung
  → 5) UI: alle Panels neu rendern + KERN-Log: „↺ zurückgesetzt"-Zeile, Context-Balken 0
```

### 4. DoD & Test-Protokoll

- `npm run typecheck` + `npm run build` grün.
- **Manueller Test (Browser):**
  1. Loop starten → ~10 Schritte (mind. 1 Flush) → stoppen.
  2. Reset → Bestätigung → **Export-Datei landet im Download** (enthält alte Session).
  3. UI: **neue** Session-ID · Tasks „(noch keine Aufgaben)" · Memory leer ·
     Audit-Log = **genau 1 Eintrag** `session.reset` (mit alter ID + Zählungen) ·
     Context-Balken 0 · KERN-Log zeigt „↺ zurückgesetzt".
  4. Loop neu starten → Schritt 1…6 → **frischer Flush-Zyklus** (bei 6) ✅.
  5. Seite neu laden → neue Session aus IndexedDB (alte ist weg).
  6. Edge: Reset in einer **leeren** Session → funktioniert, Audit zeigt Reset mit 0/Zählungen.

## implementation

| Datei | Inhalt |
|-------|--------|
| `src/aams/reset.ts` (neu) | `resetSession(doc)` — In-Place-Reset + Rollback + `session.reset`-Audit-Eintrag · `newSessionId()` |
| `src/kern/supervisor.ts` | `reset()` — Timer stoppen (ohne Doppel-Save) + `tokens = 0` + `step = 0` |
| `src/ui/app.ts` | Reset-Button-Handler (Bestätigung mit Zählungen → Safety-Export → Reset → Render) + `renderKernReset()` |
| `index.html` | Button `#reset` in Panel ② (Session & Tasks) + Danger-Style |
| `src/main.ts` | nutzt `newSessionId()` aus `reset.ts` (keine duplizierte ID-Logik) |

## verification

- `npm run typecheck`: ✅ (2026-10-16, keine Fehler)
- `npm run build`: ✅ (Vite, 15 Module; Chunk-Size-Warnung = WebLLM-Lib, war bereits vorher da)
- Manueller Test (Browser): ✅ **2026-10-16, User: „ok geht"**
  - Reset erfolgreich → `neue Session s_1792153923090_av8mks`
  - **Safety-Export bestätigt:** „120 Tasks + 143 Audit der alten Session exportiert"
  - (Details wie Doppelklick-Verhalten: nicht explizit geprüft → bleibt in „beobachten")

## beobachten (in der Praxis)

- [x] Reset-Flow funktioniert im Browser (User-Test 2026-10-16: „ok geht")
- [x] Safety-Export: wurde ausgelöst + bestätigt (120 Tasks + 143 Audit exportiert)
- [ ] Bestätigungstext in Ruhe ansehen (Zählungen, Reihenfolge) — nächstes Mal bewusst prüfen
- [ ] Audit-Eintrag `session.reset` — reicht 1 Zeile, oder mehr? (aktuell: `actor: user` + Zeit + Referenz auf alte Session vorhanden → vermutlich reicht)
- [ ] Verhalten bei Doppelklick auf Reset (zweites Confirm → zweiter Reset, Audit 2 Einträge) — ok oder blocken?

## open_questions

1. **2. Bestätigung** (zweites Confirm bei Doppelklick) oder einfach erlauben (jeder Reset ist exportiert → unkritisch)? (Neigung: erlauben)
2. Reset **mit** oder **ohne** Safety-Export als Option (Checkbox „Export überspringen")?
   (Neigung: **immer** Export — das ist die „sauber"-Garantie; Option später)
3. Später: **Session-Archiv** (alte Sessions bleiben als JSON in IndexedDB, statt weg)?
   → eigenes WP (verändert Store-Modell: 1 DB = viele Dokumente) — jetzt **nicht** mitschleppen.
4. Bessere Bestätigungs-UI als `confirm()` (Inline-Overlay)? → Design-WP.

## next_steps

- [x] Manueller Browser-Test → ✅ (2026-10-16, User: „ok geht"; Details s. verification)
- [x] Reset in `WP-…-BENCH-PLAN` als **Voraussetzung** für saubere Test-Runs verankert
      (jeder Run startet mit frisch zurückgesetztem Gedächtnis)
- [ ] (optional, später) Vitest-Einheit für `resetSession`-Logik (Mock-Store)

## close (2026-10-16)

Umgesetzt + verifiziert (s. verification). Funktion steht im Produkt
(`↺ Gedächtnis zurücksetzen`, Panel ②). WP → `closed/`.
