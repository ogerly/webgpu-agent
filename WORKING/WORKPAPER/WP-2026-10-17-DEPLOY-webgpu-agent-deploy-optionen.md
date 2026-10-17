# WP-2026-10-17 — DEPLOY: Deploy-Optionen für den WebGPU-Agenten

> **Typ:** Workpaper (Arbeitsdokument, **kein** Whitepaper)
> **Status:** open · **⚠ BEISPIEL & FORSCHUNG** (Forschungsdokumentation — **kein verbindlicher Plan**) · **Erster Deploy (2026-10-17): ✅ LIVE** als HuggingFace-Static-Space (Abschnitt 4)
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

## 4. Erster Deploy (2026-10-17 — ✅ **LIVE** via HuggingFace-Static-Space)

> **Status (2026-10-17, nach Token-Ersatz):** **LIVE** · **Entscheidung (User):** GitHub bleibt reine Quelle
> (kein Actions/Pages — Billing-Sperre wird damit irrelevant) · Deploy-Ziel = **HuggingFace** ·
> HF-Token ersetzt (Role **write**) → Space `ogerl/webgpu-agent` (Static) angelegt, `dist/` (6 MB, **kein LFS nötig**) hochgeladen, Live-Status verifiziert.
>
> **Blocker-Historie:** (1) GitHub-Account **locked (billing issue)** → Actions konnten nicht starten → umgangen (GitHub nur Quelle) · (2) HF-Token **401** (ungültig/abgelaufen) → behoben (neues Token, Write).

| Schritt | Ergebnis |
|---------|----------|
| Quell-Stand GitHub | ✅ `https://github.com/ogerly/webgpu-agent` (main; `.env` **nicht** committet — gitignored, Tokens nur in `.env`) |
| Deploy-Workflow | ✅ `.github/workflows/deploy-pages.yml`: `npm ci` + `typecheck` + `build` → Publish `dist/` — **wartet auf freigegebenes Konto** |
| Fallback-Branche | ✅ `gh-pages` mit fertigem Build (index.html + assets) — **manuell** aktivierbar: GitHub → Settings → Pages → Source = Branch `gh-pages`, Path `/` (funktioniert **ohne** Actions) |
| GitHub Pages | ✅ aktiviert (`https://ogerly.github.io/webgpu-agent/`, `build_type=workflow`); per API nicht auf Legacy umstellbar (404/422: „Deactivating … not allowed") |
| HuggingFace Space | ✅ **LIVE:** Space `ogerl/webgpu-agent` (sdk **static**, Region us) · `dist/` hochgeladen (index.html + 3 Assets, 6 MB) + `app.yaml` (`sdk: static`) · `runtime.stage = RUNNING` |

**Ergebnis (2026-10-17):**
1. **GitHub** — bleibt **reiner Code-Stand** (User-Entscheidung: **kein Pages, kein Actions**; `gh-pages`-Branch liegt nur historisch bereit) · Billing-Sperre wird damit für den Deploy irrelevant.
3. **Offizieller Demo-Link** = **Space-URL** `https://huggingface.co/spaces/ogerl/webgpu-agent` (Space-Seite embeddet die App per iframe) · Raw-App: `https://ogerl-webgpu-agent.static.hf.space/`.
2. **HF-Token** — ✅ ersetzt (Write, `whoami-v2`: User `ogerl`) → Space angelegt, `dist/` hochgeladen, Live-Verifikation bestanden.

**Live-Verifikation (2026-10-17):**
| Check | Ergebnis |
|-------|----------|
| Token | ✅ `GET /api/whoami-v2` → User `ogerl`, Access-Token Role **write** |
| Space | ✅ `GET /api/spaces/ogerl/webgpu-agent` → `sdk: static`, `runtime.stage = RUNNING`, 1 Replica |
| App-URL | ✅ `https://ogerl-webgpu-agent.static.hf.space/` → `index.html`, Title „webgpu-agent · Dashboard", HTTP 200 |
| Assets | ✅ `assets/index-B0iE_Kq-.js` (40 104 B, HTTP 200, **byte-identisch** zu `dist/`) · `assets/index-BdmpRsKy.css` (11 509 B, HTTP 200) |
| Demo-Link (offiziell) | ✅ `https://huggingface.co/spaces/ogerl/webgpu-agent` — Space-Seite embeddet die App per iframe (`src="https://ogerl-webgpu-agent.static.hf.space/index.html"`, verifiziert) · Plattform injiziert dort ein kleines `window.huggingface`-Meta-Skript (ohne Wirkung auf die App) |

**Bekannt / erwartet (Forschungsfragen 1–3):**
- Weights (≈ 945 MB Wächter / ≈ 2,3 GB Planer) kommen **beim ersten Laden** vom CDN (Setup, L2 erlaubt) — danach: Browser-Cache.
- **AAMS-B-Gedächtnis ist pro Browser + Origin** → auf `*.static.hf.space` andere Instanz als lokal (JSON-Export/Import = portable Kopie). Frage 2.
- WebGPU-Pflicht: Chrome/Edge. Frage 3.

## 5. Minimal-Beispiel (Schnellstart, lokal — für die Forschung nutzen)

```bash
npm run build
npx serve dist -l 8080     # → http://localhost:8080 (Chrome/Edge mit WebGPU)
```

Dann im UI: Wächter laden (erster Download ≈ 945 MB) → Planer laden (≈ 2,3 GB) → Aufgabe stellen.
**Erwartet:** nachweisbarer Download-Fortschritt in den Rollen-Karten; danach: Task, Audit, Artefakt-Vorschau.

## 6. Nicht-Ziele

- Kein Backend, keine Cloud-Funktionen, kein User-Management (WH-001 Invariant).
- **Keine verbindliche Deploy-Entscheidung** (wäre ein Decision Record in WH-001 — erst nach Beantwortung der Fragen).
- Keine PWA-Umsetzung, bevor Frage 1 (Offline/Weights-Cache) gemessen ist.
- Keine 1:1-Nachbau-Anleitung für ein bestimmtes Hosting (Beispiele bleiben Beispiele).

## 7. Verweise

- `WORKING/WHITEPAPER/WH-001-ARCH-webgpu-single-agent-prototype.md` (local-first, Artefakte DR #5)
- `WORKING/WORKPAPER/WP-2026-10-17-PROPOSAL-opfs-pyodide-extension-hermes-lite.md` (L1–L3, V1/V2)
- WebLLM-Doku (Weights-Verteilung) — **immer gegen die aktuelle Version prüfen** (Toolchain-Änderungen)
