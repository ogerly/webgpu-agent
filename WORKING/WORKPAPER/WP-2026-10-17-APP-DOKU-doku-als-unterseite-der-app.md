# WP-2026-10-17 — APP-DOKU: Doku als Unterseite der App (statt eigener Website)

> **Typ:** Workpaper (Arbeitsdokument, **kein** Whitepaper)
> **Status:** open (Umsetzung ✅ — **Freigabe durch User noch ausstehend**)
> **BY:** user (ogerly) / opencode / qwen3.8-27b (lokal) / agent
> **Bezug:** WP-…-DOCS (Inhalt der Doku) · WP-…-DEPLOY (Space-Hosting) · WH-001 (local-first)

## 1. Auftrag (User)

> „eigentlich brauchen wir keine eigene webseite. es kann an die anwendung selber als unterseite?"

Die Projekt-Dokumentation (Inhalt aus WP-DOCS) wird **keine** separate Website-Seite, sondern
**eine Unterseite der App**: Teil des App-Builds, im App-Look (dunkles Theme), erreichbar aus der
App-Topbar. GitHub bleibt weiterhin nur Code (kein Pages — User-Entscheidung).

## 2. Umsetzung (2026-10-17)

| Item | Ergebnis |
|------|----------|
| `doku.html` (Projekt-Root) | ✅ Neue App-Unterseite: App-Topbar mit „← App" (Zurück), dunkles Theme (Theme-Tokens aus `src/ui/theme.css`), Inhalte = WP-DOCS-Sektionen (Warum/Ziel/Stand/Forschungsansatz/**offene Probleme P1–P10**/**Wächter-Modell**/Links), selbstständig (kein JS nötig), TOC-Anker |
| `vite.config.ts` | ✅ Multi-Page: `build.rollupOptions.input = { main: index.html, doku: doku.html }` → Build erzeugt `dist/doku.html` (relative Pfade, `base: "./"` bleibt) |
| `index.html` (App) | ✅ Topbar: Link **📖 Doku** → `./doku.html` |
| `src/ui/theme.css` | ✅ `a.tag` (Klick-Tag für die Doku-Verlinkung) |
| Space (Live) | ✅ `dist/doku.html` + aktualisierte `index.html` hochgeladen → **LIVE**: `https://ogerl-webgpu-agent.static.hf.space/doku.html` · überflüssige Root-Dateien `dokumentation.html` + `style.css` (Session-Artefakte) aus dem Space entfernt |
| README / social.md | ✅ Doku-Link auf die App-Unterseite `/doku.html` gesetzt |
| `website/dokumentation.html` | bleibt als Referenz-Kopie (nicht gelöscht); Hinweis auf `doku.html` als kanonische Seite ergänzt |

## 3. Offene Punkte

- [ ] User prüft Doku-Unterseite in der App (Link in Topbar, Inhalt, Look)
- [ ] Bei Content-Änderungen: **nur** `doku.html` pflegen (kanonisch) — `website/dokumentation.html` ist Referenz
