# WHITEPAPER/INDEX — Quellen der Wahrheit im Überblick

> **Zweck:** Der **einzige Index** über alle Whitepapers (stabile Wahrheiten, *Wahrheit-in-Zeit*)
> dieses Projekts — damit beim Schließen von Workpapers **keine Wahrheit untergeht**.
> **Regel (Doku-Kette):** Workpaper (offen) → Whitepaper (stabile Wahrheit, Decision Records) → LTM.
> **Beim WP-Schluss:** zuerst prüfen — sitzen die strukturellen Wahrheiten in einem Whitepaper (DR)?
> Falls nein: **erst DR anlegen, dann WP schließen**. Danach bleibt dieser Index aktuell.
> **Dauerhaft verankert:** `READ-AGENT.md` verweist auf diese Datei als Übersicht über die
> Quellen der Wahrheit (Session-Start-Einstieg).
>
> **Bei Widerspruch gewinnt das Whitepaper** (Quelle der Wahrheit) — Workpapers/Doku/README werden
> daran angepasst, nie umgekehrt.

## Whitepapers

| ID (Datei) | Titel | Status | Was es sichert (Kurz) | Kern-Decision-Records |
|------------|-------|--------|------------------------|------------------------|
| **WH-001**<br>`WH-001-ARCH-webgpu-single-agent-prototype.md` | Local-First WebGPU Single-Agent Prototype | active | **Kernarchitektur + AAMS-Doppelrolle** (A=Dev, B=Agent, getrennt) · Invarianten (keine Cloud für Kernprozesse, AAMS-nativ, A≠B) · **Publik-Demo/Hosting** (DR #6) · **Doku als App-Unterseite** (DR #7) | DR 1–7: AAMS-Doppelrolle · WebLLM · IndexedDB+JSON · Single-Session · Artefakte abgeleitet · **Demo=HF-Space / GitHub=nur Code** · **Doku=App-Unterseite** |
| **WH-002**<br>`WH-002-BENCH-benchmark-levels-webgpu.md` | Benchmark-System: Level 1–10 (≤ 4 GB VRAM-Profil) | active | **Wie der Agent gemessen wird**: Level-Achse (L1–L10), 3 Szenario-Kategorien + L10-App, fixer Szenario-Texte, Ziel-Hardware (≤ 4 GB VRAM), Modell-Pool (Wächter/Planer), 5/5-Pass-Regel, Reproduzierbarkeits-Protokoll, ehrliche Grenzen | DR 1–10: Level-Achse · Szenario-Kategorien · fixer Text + Quellen-Korpus · ≤ 4-GB-Profil · Modell-Pool · Auswahl-Regeln · **5/5-Pass** · Reproduzierbarkeit · ehrliche Grenzen · HTML-Artefakte |

## Wartungs-Regeln

1. **Neues Whitepaper** → Eintrag hier (ID, Zeile, erste DR) — **bevor** der erste Inhalt stabil wird.
2. **Neue Decision Record** → Spalte „Kern-DR" der betroffenen Zeile ergänzen (Nummer + Kurz-Label) +
   „zuletzt aktualisiert" im WH-Header.
3. **WP-Schluss** → **Wahrheits-Check** (Regel oben): strukturelle Wahrheiten → DR im passenden WH;
   INDEX aktuell halten; erst dann schließen.
4. **Widerspruch** → Whitepaper gewinnt; WP/Doku/README werden angepasst.
5. **Neue Agenten/Session:** diese Datei zuerst lesen, dann das passende WH — so sieht jeder sofort,
   **welche** Wahrheiten wo sitzen.

## Wo sonst stabile Wahrheiten leben (öffentlich / ergänzend)

| Wo | Was | Status |
|----|-----|--------|
| `README.md` (Repo) | Öffentliche Übersicht: Status, Features, Deploy, Mitarbeit, Lizenz (MIT) | aktiv gepflegt |
| `doku.html` (App-Unterseite, **live**) | Projekt-Doku: Warum / Ziel / Stand / Forschungsansatz / Offene Probleme P1–P10 / Wächter-Modell | kanonisch (WH-001 DR #7) |
| `WORKING/MEMORY/ltm-index.md` | Langzeit-Kontext / Audit-Log (LTM) | aktiv |
| `WORKING/WORKPAPER/closed/` | Geschlossene WP (Historie, **keine** Quelle der Wahrheit mehr — Wahrheiten sind in den WH) | Archiv |
