# WP-2026-10-16-KERN-PROTO — Tokenwächter-Prototyp (KERN in der Praxis beobachten)

**Status:** closed ✅ (2026-10-16 — Mechanik live beobachtet & belegt)
**BY:** — / opencode / qwen/qwen3.8-27b / local
**Continued from:** `WP-2026-10-16-ARCH-WAEC-supervisor-architektur.md` (KERN-Definition)
**TOPIC:** KERN · **Sub-Topic:** PROTO
**Erstellt:** 2026-10-16
**Charakter:** **explorativ** — Minimal-Beobachtungsgerüst, um die KERN-Mechanik live zu sehen

## session_goal
Minimal-Beobachtungsgerüst bauen, damit wir live sehen können, wie sich der **Tokenwächter** verhält:
Context füllt sich → Tokenwächter sichert in AAMS-B (**BEVOR** Kontextgrenze) → Context geflusht →
nichts verloren. Alles live in **Panel ③ (Live-Gedächtnis)** sichtbar.

## plan (vor Umsetzung)
- `src/kern/context.ts`: `ContextWindow` + `TokenWatcher` (stumper Heartbeat, rein mechanisch).
- `src/kern/supervisor.ts`: `KernSupervisor` (mechanischer Loop, tick-basiert; jeder Tick = Arbeit + Tokenwächter-Check).
- **UI 3-Panel:** ① KERN-Loop + Context-Balken · ② Session & Tasks · ③ Live-Gedächtnis (memory + auditLog).
- **Simulation** (kein LLM): Context = Token-Zähler → Mechanik beobachten, nicht final.
- **DoD:** typecheck + build grün · Tokenwächter feuert bei ~80 % · Flush + memory/auditLog live sichtbar.

## implementation
| Datei | Inhalt |
|-------|--------|
| `src/kern/context.ts` | `TokenWatcher`: threshold 0.8, `ratio()`, `consume()`, `check()` (→ onFlush + flush) |
| `src/kern/supervisor.ts` | `KernSupervisor`: start/stop, `tick()` (Arbeit+Context), `flush()` → AAMS-B + IndexedDB |
| `index.html` | 3-Panel-Layout + Context-Balken + Logs |
| `src/ui/app.ts` | `renderSession/renderMemory/renderAudit/renderKern` + `wire` |
| `src/main.ts` | `KernSupervisor` instanziert (1500 ms, 600 Tokens/Schritt, 0.8) + onTick→Renders |

## verification
- `npm run typecheck`: (s. unten)
- `npm run build`: (s. unten)

## beobachten (in der Praxis)
- [ ] Feuert der Tokenwächter zuverlässig bei ~80 %? (Erwartung: alle ~6 Schritte bei 600/4096)
- [ ] Landet der Flush sauber in `memory` + `auditLog`?
- [ ] Ist der Rhythmus gut lesbar? (tickMs=1500)
- [ ] Verhalten bei schnellen/großen Schritten?
- → **Erkenntnisse hier notieren** + ggf. KERN-Definition (`ARCH-WAEC`) anpassen.

## open_questions
- Reale Token-Zählung (LLM-Usage aus `chat.completions`) vs. Simulation — wie nahtlos anbinden?
- Threshold 80 % optimal? (zu früh = viel Flushing; zu spät = OOM-Risiko)
- Tokenwächter **pro Engine** oder **global**?
- Should-der-Loop automatisch starten oder immer explizit (mechanischer Trigger)?

## next_steps (Stand bei Schließung)
- [x] **Reale Token-Zählung** technisch gelöst: `ChatCompletion.usage` liefert echte
      Token-Zahlen → `ChatResult.usage` + Audit `llm.execute` (`WP-…-BENCH-IMPL`)
- [ ] **→ nächstes WP:** echte Tokens in den **Tokenwächter** einbinden (statt Simulation)
- [ ] **→ nächstes WP:** Tokenwächter-Parameter (limit/threshold/tickMs) konfigurierbar in UI
- [ ] **KERN-Definition → WH-Kandidat** (bleibt offen: erst nach Benchmark-Validierung — WH-002 §5)

## close (2026-10-16)
Mission erfüllt: Minimal-Beobachtungsgerüst gebaut, **Tokenwächter live beobachtet** (User),
Mechanik im Export belegt (Flush-Zyklus exakt alle 6 Schritte = `ceil(4096·0.8/600)`,
Step-Rhythmus 1500 ms, Audit/Memory intakt — Daten-Check in `WP-…-BENCH-PLAN` §1).
Offene Punkte (Tokenwächter-Parameter, echte Tokens im Wächter) sind als „→ nächstes WP" geroutet.
