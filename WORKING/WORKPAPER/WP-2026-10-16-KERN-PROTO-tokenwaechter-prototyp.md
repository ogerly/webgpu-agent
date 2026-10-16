# WP-2026-10-16-KERN-PROTO — Tokenwächter-Prototyp (KERN in der Praxis beobachten)

**Status:** open
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

## next_steps
- [ ] Reale Token-Integration (WebLLM-Usage → Context, statt Simulation)
- [ ] Tokenwächter-Parameter (limit/threshold/tickMs) konfigurierbar in UI
- [ ] Erkenntnisse finalisieren → KERN-Definition (dann WH-Kandidat #1)
