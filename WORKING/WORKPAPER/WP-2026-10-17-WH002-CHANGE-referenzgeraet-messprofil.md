# WP-2026-10-17 — WH002-CHANGE: Referenzgerät, Messprofil, Capability-Gate

> **Typ:** Workpaper (Änderungsvorschlag an WH-002)
> **Status:** open · **Vorschlag zur Prüfung**
> **Bezug:** WH-002 (#4 Ziel-Hardware-Profil, #5 Modell-Pool, #7 Pass-Regel, #8 Reproduzierbarkeit, #9 Ehrliche Grenzen)
> **Lebenszyklus:** Nach Prüfung und erstem Lauf auf dem Referenzgerät → Decision Records in WH-002; danach → `closed/`.

---

## 0. Auftrag an den Agenten

1. Prüfe die Vorschläge gegen WH-002 und den Code (`MachineProfile`, `src/llm/catalog.ts`, `src/llm/pool.ts`).
2. Übernimm, passe an oder lehne ab, jeweils mit Begründung in einer Zeile (Matrix, Abschnitt 4).
3. Erfinde keine Messwerte. Hardware-Fähigkeiten werden **am Gerät gemessen** (Adapter, Features, Limits), nicht angenommen.

## 1. Ausgangslage

Es gibt zwei Geräte mit unterschiedlicher Rolle:

| Gerät | Rolle |
|-------|-------|
| **Referenzgerät:** NVIDIA GTX 1050 (laut Nutzer 4 GB, **Variante zu verifizieren**) | Gerät, auf dem das Profil „≤ 4 GB VRAM" tatsächlich gilt |
| **Entwicklungsgerät:** RTX 5090 (32 GB) | Entwicklung, Training (siehe TRAIN-PLAN), schnelle Iteration |

Problem: Auf der 5090 wird das ≤-4-GB-Profil nur durch **Pool-Regeln** eingehalten, nicht durch die Hardware. Zeiten und Tokenraten sind dort nicht repräsentativ für Alltags-Hardware.

## 2. Vorschläge

### C1 — Zwei Geräterollen in WH-002 verankern
- **Referenzgerät:** Nur Läufe auf dem Referenzgerät dürfen den Status **„bewiesen"** (Pass-Regel 5/5) begründen.
- **Entwicklungsgerät:** Läufe dort gelten als **„bestätigt (Dev)"**: aussagekräftig für Erfolg/Stabilität (DoD, Schema-Validität), **nicht** für Zeit, Token-pro-Sekunde oder VRAM-Verhalten.
- Betrifft WH-002 #4 und #7.

### C2 — Messprofil im Run-Log verpflichtend und auswertbar
- `MachineProfile` (Adapter, Features, Limits, CPU, RAM, Browser + Version, Treiber/OS soweit auslesbar) steht in **jedem** Run-Log (Entscheidung #8) und wird in der Auswertung als **Gruppierungsschlüssel** genutzt.
- Zeit- und VRAM-Metriken werden **nie** zwischen Geräten gemittelt.
- Zusätzlich: `device_role: "reference" | "dev"` im Run-Log.

### C3 — Capability-Gate vor Modellwahl (neu)
- Vor dem Pool-Start wird gemessen: Ist `shader-f16` verfügbar? Welche Buffer-/Storage-Limits meldet der Adapter?
- **Ergebnis bestimmt die Modellvariante:** `q4f16_1` nur bei vorhandenem `shader-f16`, sonst `q4f32_1` (höherer VRAM-Bedarf, aus dem Katalog **neu gegen die ≤-4-GB-Grenze prüfen**).
- Wird dadurch ein Modell aus dem Pool unmöglich, wird das **gekennzeichnet** (Degraded, Audit + UI), nie still ersetzt (Invariante aus WH-002).
- Betrifft WH-002 #5 (Modell-Pool) und #6 (Auswahl-Regeln, bleibt deterministisch: Eingabe ist jetzt auch das Capability-Ergebnis).

### C4 — VRAM-Budget mit Systemreserve
- Das 4-GB-Budget gilt abzüglich Betriebssystem/Browser-Anteil. Die Tabelle „Passt in ≤ 4096 MB?" (WH-002 §3.2) wird um eine Spalte **„Reserve nach Systemanteil (am Referenzgerät gemessen)"** ergänzt.
- Speicherfehler (OOM) bleiben ein erwartetes, protokolliertes Ereignis und lösen den Fallback aus (`llm.fallback`).

### C5 — Ehrliche Grenzen ergänzen (#9)
- „VRAM nur als Limits-Proxy" bleibt, ergänzt um: **Auf Geräten mit großzügigen Limits (Dev) beweist ein erfolgreicher Lauf nichts über das ≤-4-GB-Profil.** Der Beleg dafür kommt ausschließlich vom Referenzgerät.

## 3. Erster Schritt (ohne Änderung an WH-002)

1. Auf dem Referenzgerät ein **einzelnes L1-Szenario** laufen lassen, nur um das MachineProfile zu erfassen (Adapter, `shader-f16`, Limits, tatsächlicher VRAM).
2. Ergebnis hier im Workpaper festhalten (Abschnitt 5, „Messung Referenzgerät"). Erst danach C3/C4 final entscheiden, weil die Messung die Modellvarianten bestimmt.

## 4. Entscheidungs-Matrix (vom Agenten auszufüllen)

| # | Vorschlag | Entscheidung (übernommen / angepasst / abgelehnt) | Begründung (1 Zeile) | Betroffen |
|---|-----------|----------------------------------------------------|----------------------|-----------|
| C1 | Zwei Geräterollen | | | WH-002 #4, #7 |
| C2 | Messprofil als Schlüssel | | | WH-002 #8 |
| C3 | Capability-Gate | | | WH-002 #5, #6 |
| C4 | VRAM-Reserve | | | WH-002 §3.2 |
| C5 | Grenzen ergänzen | | | WH-002 #9 |

## 5. Messung Referenzgerät (nach dem ersten Lauf auszufüllen)

| Feld | Wert |
|------|------|
| GPU-Modell / VRAM laut Adapter | |
| `shader-f16` verfügbar | |
| Relevante Limits (Buffer/Storage) | |
| Browser + Version, Treiber | |
| Ergebnis L1 (Wächter allein) | |
| Beobachtungen | |

## 6. Definition of Done

- Erster Lauf auf dem Referenzgerät dokumentiert (Abschnitt 5).
- Entscheidungs-Matrix ausgefüllt; strukturelle Änderungen als Decision Records in WH-002.
- Run-Logs tragen `device_role` und vollständiges MachineProfile.
- Kein Benchmark-Ergebnis wird ohne Geräterolle berichtet.

## 7. Nicht-Ziele

- Keine künstliche Drosselung der 5090 als Ersatz für ein echtes schwaches Gerät.
- Keine Mittelung von Zeit- oder VRAM-Werten über Geräte.
- Kein Hardware-Kauf als Voraussetzung.

## 8. Verweise

* → `WORKING/WHITEPAPER/WH-002-BENCH-benchmark-levels-webgpu.md`
* → `WP-2026-10-17-TRAIN-PLAN-waechter-spezialist.md`
* → Katalog: `src/llm/catalog.ts` · Pool: `src/llm/pool.ts`
