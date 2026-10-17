# WP-2026-10-17 — DOCS: Dokumentationsseite zum Projekt (Warum/Ziel/Stand/Forschung/Probleme/Wächter)

> **Typ:** Workpaper (Arbeitsdokument, **kein** Whitepaper)
> **Status:** closed ✅ (2026-10-17 — Doku vom User freigegeben: „sehr gut. danke" · Inhalte jetzt kanonisch in `doku.html` (App-Unterseite, WP-APP-DOKU) · **Wahrheiten gesichert: WH-001 DR #6 (Demo/Hosting) + DR #7 (Doku-Unterseite)** · `INDEX.md` aktuell)
> **BY:** user (ogerly) / opencode / qwen3.8-27b (lokal) / agent
> **Bezug:** `idee.md` (Vision) · WH-001 (Architektur, AAMS-Doppelrolle) · WH-002 (Benchmark) ·
> WP-…-DEPLOY (6 Forschungsfragen) · WP-…-TRAIN-PLAN (Wächter) · WP-…-PROPOSAL (V1–V5) · WP-…-WH002-CHANGE

## 1. Auftrag (User)

Eine **Dokumentationsseite für das Beispiel (Projekt)** anlegen, die erklärt:
1. **Warum** wir das machen.
2. **Was das Ziel** ist.
3. **Wie der Stand** ist — alles so gut wie möglich beschrieben.
4. Der **Forschungsansatz**.
5. **Die Probleme extra und gesondert aufführen**, die es gilt in Zukunft zu lösen —
   bessere Wege finden und nach besseren Lösungen suchen.
6. Der **Ansatz des eigenen Modells für den Wächter**: Aufführung,
   die Sinnhaftigkeit, der erwartete Nutzen, die Probleme.

## 2. Umsetzung (2026-10-17)

| Item | Ergebnis |
|------|----------|
| `website/dokumentation.html` | ✅ Neue Seite (gemeinsames `style.css`, hell, responsiv): **§1** Was ist das · **§2 Warum** (Datensouveränität, lokale Inferenz, Autonomie, Forschungsfrage) · **§3 Ziel** (Kernziel + 6 Forschungsziele + Nicht-Ziele) · **§4 Stand** (umgesetzt vs. offen, mit Status-Badges) · **§5 Forschungsansatz** (Prinzipien „messen, nicht raten", Doku-Kette AAMS, WH-002-Protokoll inkl. Level-/VRAM-Tabellen, 6 Forschungsfragen, V1–V5) · **§6 Offene Probleme** (10 Punkte, je mit „warum" + „worauf wir suchen" — extra Sektion) · **§7 Wächter-Modell** (Ansatz, Stufen 0–5 mit Abbruchkriterien, Sinnhaftigkeit/erwarteter Nutzen, Probleme) · **§8 Links** |
| Navigation | ✅ „Doku"-Link auf allen 7 Website-Seiten |
| Live | ✅ Space-Upload (`dokumentation.html` + `style.css`) → `https://ogerl-webgpu-agent.static.hf.space/dokumentation.html` |
| **Hosting (geändert, WP-APP-DOKU)** | ✅ Doku ist jetzt eine **Unterseite der App**: `doku.html` (Projekt-Root, App-Theme) + Vite-Multi-Page (`dist/doku.html`) + 📖-Link in der App-Topbar → **LIVE** `https://ogerl-webgpu-agent.static.hf.space/doku.html` (verifiziert). Die Website-Kopie bleibt als Referenz (nicht mehr gepflegt). |
| README / social.md | ✅ Doku-Link ergänzt |

**Quellenlage:** alle Fakten aus `idee.md`, WH-001 (Invarianten, AAMS-Doppelrolle, DR #5),
WH-002 (Level, VRAM-Budget, Metriken), WP-TRAIN-PLAN (Stufen, Risiken), WP-DEPLOY (Forschungsfragen),
WP-PROPOSAL (V1–V5), WP-WH002-CHANGE (Geräterollen) — nichts erfunden; Referenzgerät als „zu verifizieren" gekennzeichnet.

## 3. Offene Punkte

- [x] User prüft Text (v. a. §6 Probleme + §7 Wächter) — **freigegeben (2026-10-17)**
- [ ] Seite pflegen: bei Session-Ende §4 (Stand) und §6 (Probleme) aktualisieren, wenn sich etwas ändert → **Pflicht der App-Unterseite `doku.html`** (WH-001 DR #7)
- [ ] Optional: EN-Variante der Doku-Seite, falls internationales Publikum adressiert wird

## 4. Schluss (2026-10-17)

- **User:** „sehr gut. danke, damit kann das workpaper geschlossen werden."
- **Wahrheiten gesichert (vor Schluss):** WH-001 **DR #6** (Demo = HF-Space, GitHub = nur Code) + **DR #7** (Doku = App-Unterseite) · `WORKING/WHITEPAPER/INDEX.md` (neu) aktuell ·
  Doku-Kanoni­k: `doku.html` (Live: `https://ogerl-webgpu-agent.static.hf.space/doku.html`).
- **Referenz:** `website/dokumentation.html` bleibt als Kopie (nicht mehr gepflegt, Verweis-Hinweis eingefügt).
- → `closed/`
