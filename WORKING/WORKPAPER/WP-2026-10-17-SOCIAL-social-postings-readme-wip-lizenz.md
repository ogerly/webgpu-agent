# WP-2026-10-17 — SOCIAL: Social-Postings + README (WIP-Natur, Mitarbeit, Lizenz)

> **Typ:** Workpaper (Arbeitsdokument, **kein** Whitepaper)
> **Status:** open (Umsetzung ✅ — **Freigabe durch User vor Publizierung** noch ausstehend)
> **BY:** user (ogerly) / opencode / qwen3.8-27b (lokal) / agent
> **Bezug:** README.md · `WORKING/TOOLS/social.md` · WP-…-DEPLOY (Live-Demo)

## 1. Auftrag (User)

1. **`WORKING/TOOLS/social.md`:** Artikel/Postings zum Projekt im aktuellen Stand für
   **X**, **WhatsApp/Telegram**, **LinkedIn**, **Foren** (HN/Reddit/DE).
2. **README:** aktuellen Screenshot (`src/public/images/screenshot.png`) aufnehmen ·
   klar machen: **WIP, Experiment, privates Forschungsprojekt, Mitarbeit erwünscht** · Lizenz **MIT**.
3. **User-Entscheidung (Deploy):** Demo = **Space-URL** `https://huggingface.co/spaces/ogerl/webgpu-agent`
   (Space-Seite embeddet die App per iframe) · **GitHub = nur Code — kein Pages, kein Actions.**

## 2. Umsetzung (2026-10-17)

| Item | Ergebnis |
|------|----------|
| `social.md` | ✅ Kernbotschaft (DE/EN) + X (2 Varianten, ≤ 280 Z. inkl. t.co-Regel) + WhatsApp/Telegram + LinkedIn (DE+EN) + Foren (HN/Reddit×2/DE/Lobsters) + Do/Don't + Reihenfolge + Vor-Post-Checkliste |
| README | ✅ Screenshot nach Intro · neue Sektion **„Projekt-Natur (WIP/Experiment)"** · neue Sektion **„Mitarbeit"** · neue Sektion **„Lizenz" (MIT)** · Deploy-Sektion: Demo = Space-URL, GitHub = nur Code (kein Pages) |
| `LICENSE` | ✅ **neu: MIT** (c) 2026 ogerly — vorher gab es **keine** Lizenz (= alle Rechte vorbehalten) |
| `package.json` | ✅ `"license": "MIT"` ergänzt |
| Screenshot | ✅ `src/public/images/screenshot.png` in README referenziert + committet (Raw-Link für Foren funktioniert) |

## 3. Offene Punkte

- [ ] **User prüft Text vor Publizierung** (Ton, Name/Handle auf X/LinkedIn, Reihenfolge)
- [ ] X-Handle / LinkedIn-Profil in die Postings ergänzen, falls vorhanden
- [ ] Optional: kurze EN-README-Variante, falls englischsprachiges Publikum adressiert werden soll
