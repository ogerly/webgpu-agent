# WP-2026-10-17 — APP-DOKU: Doku als Unterseite der App (statt eigener Website)

> **Typ:** Workpaper (Arbeitsdokument, **kein** Whitepaper)
> **Status:** closed ✅ (2026-10-17 — Doku-Unterseite + Deep-Links vom User freigegeben: „sehr gut. danke" · Live verifiziert · **Wahrheit gesichert: WH-001 DR #7 (Doku-Unterseite)** + DR #6 (Hosting) · `INDEX.md` aktuell)
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
| **Anker / Deep-Links (Erweiterung 2)** | ✅ **`#doku`-Hash-Routing in `src/main.ts`** (JS): `index.html#doku` → `doku.html` · `index.html#doku/<sektion>` → `doku.html#<sektion>` · Doku-Anker (`#warum`, `#ziel`, `#stand`, `#forschung`, `#probleme`, `#waechter`, `#links`) mit **sanftem Scrollen + Hervorhebung** (JS in `doku.html`) + Deep-Link-Liste in der TOC · direkter Aufruf bleibt `…/doku.html` (statisch, ohne JS nutzbar) |
| Space (Live) | ✅ `dist/doku.html` + aktualisierte `index.html` hochgeladen → **LIVE**: `https://ogerl-webgpu-agent.static.hf.space/doku.html` · überflüssige Root-Dateien `dokumentation.html` + `style.css` (Session-Artefakte) aus dem Space entfernt |
| README / social.md | ✅ Doku-Link auf die App-Unterseite `/doku.html` gesetzt |
| `website/dokumentation.html` | bleibt als Referenz-Kopie (nicht gelöscht); Hinweis auf `doku.html` als kanonische Seite ergänzt |

## 3. Offene Punkte

- [x] User prüft Doku-Unterseite in der App (Link in Topbar, Inhalt, Look) — **freigegeben (2026-10-17)**
- [ ] Bei Content-Änderungen: **nur** `doku.html` pflegen (kanonisch) — `website/dokumentation.html` ist Referenz → **dauerhaft** (WH-001 DR #7)

## 4. Schluss (2026-10-17)

- **User:** „sehr gut. danke, damit kann das workpaper geschlossen werden."
- **Live (verifiziert):** `https://ogerl-webgpu-agent.static.hf.space/doku.html` · App mit 📖-Link · `#doku`-Routing + Anker (`#probleme`, `#waechter` …) · altes JS 404.
- **Wahrheiten gesichert (vor Schluss):** WH-001 **DR #7** (Doku = App-Unterseite, `doku.html` kanonisch, `#doku`-Routing, Anker) + **DR #6** (Hosting) · `INDEX.md` aktuell · README/social.md mit Links.
- → `closed/`
