# WP-2026-10-17 — DEPLOY: Deploy-Optionen für den WebGPU-Agenten

> **Typ:** Workpaper (Arbeitsdokument, **kein** Whitepaper)
> **Status:** open · **⚠ BEISPIEL & FORSCHUNG** (Forschungsdokumentation — **kein verbindlicher Plan**, **nichts umgesetzt**)
> **Bezug:** WH-001 (local-first, keine Cloud) · WH-002 (≤ 4 GB VRAM) · WP-…-PROPOSAL (L2: offline nach Setup)
> **Lebenszyklus:** Forschungsergebnisse → nur **strukturelle** Entscheidungen als Decision Record in WH-001. Danach → `closed/`.
> **README:** als „Beispiel & Forschung" gekennzeichnet.

---

## 0. Was „Deploy" in diesem Projekt bedeutet

Der Agent läuft **100 % clientseitig** (WH-001: keine Cloud, kein Server, keine Backend-Infrastruktur).
„Deploy" heißt hier daher: **die statische App + die Modelle an die Browser liefern** —
nicht „Backend betreiben". Das ändert nichts an L1 (Autonomie im Browser):
jede Option unten ist nur ein **Weg, die Dateien zum Browser zu bringen**.

## 1. Was deployt wird (Artefakte)

| Teil | Größe (≈) | Anmerkung |
|------|-----------|-----------|
| `dist/` (Vite-Build: HTML+JS+CSS) | ~2–3 MB (+ WebLLM-Lib) | **statisch**, kein Server nötig |
| WebLLM-Weights (Wächter 0,5 B) | ~945 MB | erster Lauf: Download (Setup, L2 erlaubt) |
| WebLLM-Weights (Planer 3 B) | ~2,3 GB | on-demand |
| AAMS-B-Gedächtnis | klein (KB–MB) | **pro Browser + Origin** (IndexedDB) — wandert **nicht** mit der App! |
| Extension (V2, optional) | — | User installiert sie selbst (Chromium) |

## 2. Optionen (Beispiel — keine Empfehlung, alle ungetestet)

| Option | Wie | Vorteil | Grenzen / offene Punkte |
|--------|-----|---------|--------------------------|
| **Local: `file://`** | `dist/index.html` direkt öffnen | null Setup | **eher ungeeignet:** ES-Module, IndexedDB, WebGPU brauchen in der Regel http(s)/Origin (CORS/Quota) → statischer Server |
| **Statischer Server (local/LAN)** | `npx serve dist` · nginx · Caddy | einfach, schnell, eigene Geräte | nur eigene Netzumgebung |
| **Statisches Hosting** (GitHub Pages / Netlify / Cloudflare Pages — Beispiele) | `dist/` hochladen | teilbarer Link, kein Server-Betrieb | **AAMS-B bleibt pro Browser/Origin** (JSON-Export = portable Kopie) · Weights vom CDN (1× Internet nötig) · WebGPU-Pflicht |
| **PWA** (Forschung) | Web-App-Manifest + Service Worker (App-Shell + ggf. Weights cachen) | installierbar, offline nach Erststart | Cache-Strategie für 1–2,5 GB Weights (CacheStorage vs. OPFS) · Update-Strategie bei neuen Modell-Revisionen |
| **Selbst gehostete Weights** (Forschung) | MLC-WebLLM-Weights auf eigenem Static-Host | kein Drittanbieter-CDN, eigene Updates/Versionierung | Bandbreite, Verteilung, Versions-Pflege (Toolchain **gegen aktuelle Doku prüfen** — WebLLM/MLC ändern sich schnell) |

## 3. Forschungsfragen (offen — Beantwortung = Fortschritt dieses WPs)

1. **Offline nach Setup (L2):** Was darf der Service Worker zuverlässig cachen?
   App-Shell: ja. Weights: 1–2,5 GB → Quota/`CacheStorage`-Verhalten je Browser messen (nicht raten).
2. **AAMS-B und Origin:** Das Gedächtnis ist an Browser+Origin gebunden. Was bedeutet das
   konkret für „Deploy" (anderes Gerät = leeres Gedächtnis, bis JSON-Import)? Reicht Export/Import
   (Status quo) — oder OPFS + File-System-Access-Sync (V1) als Brücke?
3. **WebGPU-Verfügbarkeit:** Welche Browser/Devices können es (Chrome/Edge: ja;
   Firefox/Safari: Stand prüfen)? → Capability-Check + saubere Meldung im UI (L6: gekennzeichnet, nie still).
4. **Modell-Updates:** Wie versionieren wir Weights (Revision pro Modell), wie veralten Caches,
   wie migrieren Nutzer auf neue Quantisierungen?
5. **Extension (V2):** Sinnvoll nur am selben Gerät wie die App (Chromium) — wie verteilen/aktualisieren?
6. **Sicherheit/Hosting:** CSP-Header beim Hosting, keine Secrets in der App (Invariant),
   Web-Zugriff nur via V2-Brücke (untrusted-Daten-Regel aus WP-…-PROPOSAL §V2).

## 4. Minimal-Beispiel (Schnellstart, lokal — für die Forschung nutzen)

```bash
npm run build
npx serve dist -l 8080     # → http://localhost:8080 (Chrome/Edge mit WebGPU)
```

Dann im UI: Wächter laden (erster Download ≈ 945 MB) → Planer laden (≈ 2,3 GB) → Aufgabe stellen.
**Erwartet:** nachweisbarer Download-Fortschritt in den Rollen-Karten; danach: Task, Audit, Artefakt-Vorschau.

## 5. Nicht-Ziele

- Kein Backend, keine Cloud-Funktionen, kein User-Management (WH-001 Invariant).
- **Keine verbindliche Deploy-Entscheidung** (wäre ein Decision Record in WH-001 — erst nach Beantwortung der Fragen).
- Keine PWA-Umsetzung, bevor Frage 1 (Offline/Weights-Cache) gemessen ist.
- Keine 1:1-Nachbau-Anleitung für ein bestimmtes Hosting (Beispiele bleiben Beispiele).

## 6. Verweise

- `WORKING/WHITEPAPER/WH-001-ARCH-webgpu-single-agent-prototype.md` (local-first, Artefakte DR #5)
- `WORKING/WORKPAPER/WP-2026-10-17-PROPOSAL-opfs-pyodide-extension-hermes-lite.md` (L1–L3, V1/V2)
- WebLLM-Doku (Weights-Verteilung) — **immer gegen die aktuelle Version prüfen** (Toolchain-Änderungen)
