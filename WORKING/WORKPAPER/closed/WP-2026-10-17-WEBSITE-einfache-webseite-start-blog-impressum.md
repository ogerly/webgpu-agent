# WP-2026-10-17-WEBSITE — Einfache Webseite: Startseite + Blog + Impressum

**Status:** closed ✅ (2026-10-17 — **umgesetzt** als echte Dateien in `website/`; Browser-Check als erledigt gewertet (User: „alle 4") · User-Entscheidung: „eigentlich brauchen wir keine eigene webseite" → Doku lebt jetzt als **App-Unterseite** (WH-001 **DR #7**) · Website/Blog bleibt im Repo als statische Dateien · **Impressum-Platzhalter bleibt User-TO-DO** (persönliche Angaben))
**BY:** — / opencode / qwen/qwen3.8-27b / local
**TOPIC:** WEBSITE (neu im topic_registry) · **Sub-Topic:** STATIC
**Erstellt:** 2026-10-17
**Charakter:** **Umsetzung + Systemklärung** — die "Webseite-Aufgabe" des Browser-Agenten
wird endlich als **echte Dateien** geliefert, und die AAMS-Doppelrolle / Session-Speicherung
wird für den User nachvollziehbar gemacht (Hauptbeschwerde: „wird nur im Chat geschrieben,
keine wirkliche Webseite, wo ist der Projektordner?").

## session_goal

Eine einfache, statische Webseite mit **Startseite**, **Blogbereich** (3 Beiträge) und
**Impressum** existiert als **echte, laufende HTML-Dateien** im Projektordner `website/` —
nicht mehr nur als Text in Chat und `task.result` der AAMS(B)-Session.

## warum (Hintergrund — die Lücke)

Der webgpu-agent (Browser, WebLLM/WebGPU) hat **keine Dateisystem-Zugriffe** (Browser-Sandbox,
WH-001 §6: Daten bleiben im Client). Seine „Ausführung" ist per Definition nur Text-Generierung:
`src/agent/agent.ts → executePrompt()`: *„Die Antwort IST das Ergebnis"*. Ergebnis →
`task.result` + Chat. → Die Website-Aufgabe der Session `s_…_8i6ma8` war „erledigt 6/6",
aber **keine einzige Datei** wurde erzeugt. Die Lücke ist by-Design (aktuell), kein Bug —
aber sie muss (a) dem User sichtbar sein und (b) ggf. per Feature schließen.

## umsetzung (2026-10-17)

Neuer Ordner `website/` (Root des Repos, statisch, kein Build):

| Datei | Zweck |
|-------|-------|
| `website/index.html` | Startseite: Hero + „Auf einen Blick"-Cards + CTA „Zum Blog" |
| `website/blog.html` | Blogbereich: 3 Beitrags-Karten (Titel/Datum/Excerpt → Detailseite) |
| `website/beitrag-1.html` | „Hallo Welt — mein erster Beitrag" (05.10.2026) |
| `website/beitrag-2.html` | „Meine Lieblingsbücher" (10.10.2026) |
| `website/beitrag-3.html` | „Wohin die Reise geht" (15.10.2026) |
| `website/impressum.html` | TMG-Angaben + Kontakt + Haftung + Urheberrecht + Datenschutz (Platzhalter!) |
| `website/style.css` | Gemeinsames Stylesheet (Design-Tokens, Header/Nav/Footer konsistent, responsiv) |

Qualität: **konsistentes** Design über alle Seiten (im Chat-Output des 3B-Planers waren
`style.css` vs. `styles.css`, 4× verschiedene Header/Footer, widersprüchliches Impressum).
Inhalt: aus den Intentionen der Planer-Tasks übernommen (Blog-Themen), Text sauber formuliert.

**Achtung:** `impressum.html` enthält **Platzhalter** (Name/Adresse/E-Mail) — User muss
eigene Angaben einsetzen (sonst kein gültiges Impressum).

**Testen:** `website/index.html` direkt im Browser öffnen (oder `npx serve website`).

## systemklärung (was wo gespeichert ist — User-Frage)

- **AAMS(A)** = Dev-Gedächtnis **dieses Repos** → `WORKING/` (dieses WP, DIARY, MEMORY, …)
- **AAMS(B)** = Gedächtnis des **Browser-Agenten** → `src/aams/` (schema/store/io/reset),
  persistiert in **IndexedDB** (DB `aams-webgpu-agent`, key `current`), exportierbar als JSON
  (`src/aams/io.ts`). Die beiden Root-JSONs `aams-session-s_…_8i6ma8.json`
  (Session mit Website-Aufgabe: 7 Tasks, 38 Audit, 1 Memory) und
  `zurückgesetzt-aams-safety-s_…_msnk31.json` (Safety-Export eines leeren Reset-Zustands)
  sind **Exports** aus IndexedDB — nicht die eigentliche Speicheroberfläche.
- **`src/aams/`** = AAMS(B) in Code: `schema.ts` (Datenmodell), `store.ts` (IndexedDB),
  `io.ts` (JSON-Export/Import), `reset.ts` („Neue Session" mit Safety-Export + Rollback).

## offene fragen / nächste schritte

1. **Impressum-Platzhalter** durch echte Angaben ersetzen (User-Daten).
2. **Feature-Lücke (Kandidat für neues WP):** File-Output-Tool für den Browser-Agenten —
   Ergebnis-Code als **echte Dateien** erzeugen (File System Access API oder Download-Bundle),
   damit „Webseite erstellen" im Agenten tatsächlich Dateien erzeugt. Dazu gehört:
   Task-Typ „datei" im Planer-JSON + Audit-Aktion `file.written` + UI-Anzeige.
3. Browser-Check: alle 7 Seiten durchklicken (Nav, Links, mobil < 600 px). — **als erledigt gewertet (2026-10-17, User: „alle 4")**

## Schluss (2026-10-17)

- **User:** „Alle 4" (Freigabe des Schlusses von UI-DASH, BENCH-IMPL, ARTIFACT, WEBSITE) + „eigentlich brauchen wir keine eigene webseite" → Doku = App-Unterseite (WH-001 **DR #7**).
- **Wahrheiten gesichert (vor Schluss):** WH-001 DR #7 (Doku-Unterseite, keine separate Website) · Systemklärung AAMS-A/B ist in WH-001 §3.
- **Nichts verloren:** Impressum-Platzhalter bleibt als **User-TO-DO** (persönliche Angaben für `website/impressum.html`) · Folge-WP-Kandidat „File-Output-Tool" ist in WP-PROPOSAL §V4 + Doku P6.
- → `closed/`

## verweise

- `WORKING/WHITEPAPER/WH-001-ARCH-webgpu-single-agent-prototype.md` §3 (AAMS-Doppelrolle)
- `src/aams/schema.ts` (Spiegel-Struktur WORKING → AAMS-B)
- `src/agent/agent.ts` (`executePrompt` = „Antwort IST das Ergebnis")
- `aams-session-s_1792170879760_8i6ma8.json` (Session, in der die Aufgabe „erledigt" wurde)
