# WH-001 — Local-First WebGPU Single-Agent Prototype

> **Status:** active
> **Typ:** Quelle der Wahrheit (*Wahrheit-in-Zeit*)
> **Lebenszyklus:** Initialisiert 2026-10-16 · aktualisiert **nur** bei strukturellen Entscheidungen
> **Autor:** — *(Whitepapers sind bewusst **autorfrei** — sie dokumentieren die Wahrheit des Systems, nicht, wer sie geschrieben hat.)*

---

## 1. Zweck & Geltungsbereich
Dieses Whitepaper definiert die architektonische Wahrheit für den ersten Prototypen
des clientseitigen WebGPU-Agenten.
* **Scope:** Single-Agent-Betrieb im Browser, WebGPU-Inferenz (WebLLM), AAMS-Gedächtnis
  via IndexedDB, Task-Zerlegung in Sub-Tasks, Session-Export/Import.
* **Out of Scope:** Multi-Agent-Mesh (WebRTC), komplexe Multi-Session-Backends.

## 2. Kernentscheidungen (Decision Records)

| # | Datum | Entscheidung | Kontext | Alternative | Begründung |
|---|-------|--------------|---------|-------------|------------|
| 1 | 2026-10-16 | **AAMS als doppelte Weichenstellung** (Fundament) | AAMS steuert (A) unseren Dev-Prozess in diesem Repo **und** (B) ist die native Gedächtnis-Architektur des Agenten im Browser | AAMS nur als Dev-Tool; Produkt nutzt ein eigenes, anderes Memory-Modell | Eine Spezifikation, zwei Rollen: konsistent, spart doppelte Konzepte, Endnutzer bekommt AAMS-Souveränität „ab Werk" |
| 2 | 2026-10-16 | WebLLM als Inferenz-Engine | Lokale Ausführung im Browser | Server-APIs (OpenAI/Anthropic) | Absolute Datensouveränität, null Cloud-Kosten |
| 3 | 2026-10-16 | IndexedDB + JSON-Export | Persistenz für das Session-AAMS | `localStorage` | Besseres Speichervolumen, asynchron, saubere Portabilität per Datei |
| 4 | 2026-10-16 | Single-Session-Fokus | Isolierte Arbeitsräume | Globaler Multi-Session-Store | Verhindert unnötige Komplexität im Prototyp-Stadium |

## 3. AAMS-Doppelrolle (Fundament — nicht verwechseln)

> **Entscheidende Weichenstellung:** AAMS ist in diesem Projekt **doppelt** verankert.
> Diese zwei Rollen bleiben während der gesamten Entwicklung klar getrennt.

| Rolle | Was | Wo | Wer nutzt es |
|-------|-----|----|--------------|
| **A — Arbeitsgrundlage (Hier & Jetzt)** | Steuert & strukturiert unseren **Entwicklungsprozess**: Workpapers, LTM, Whitepapers, Diary, Team | In **diesem Repo** (`WORKING/`, `.agent.json`) | Wir (Entwickler + Coding-Agents) |
| **B — Native Agenten-Architektur (Endprodukt)** | Das **Gedächtnis- & Task-Modell des Agenten selbst**: Session-IDs, Task-Trees, Audit-Logs, lokaler Dateibaum — in IndexedDB + JSON-Export | **Im Browser des Endnutzers** (zur Laufzeit) | Der WebGPU-Agent im Browser des Nutzers |

**Trennungs-Regel (Invariant):**
- AAMS(**A**) ist unser *Werkzeug zum Bauen*. AAMS(**B**) ist das *eingebaute Gehirn des Produkts*.
- Dasselbe **Schema/Modell** (Session, Task-Tree, Audit-Log, Speicher-Struktur) wird in
  beiden Rollen verwendet — aber **getrennte Instanzen/Artefakte**:
  `WORKING/` (Dev) ≠ Browser-IndexedDB (Runtime).
- Wir **vermischen die beiden nicht**: Eine Änderung am Dev-Prozess (AAMS-A) ändert nicht
  automatisch das Agenten-Modell (AAMS-B) — und umgekehrt. Änderungen am **gemeinsamen
  Schema** werden als strukturelle Entscheidung in diesem Whitepaper protokolliert.
- **Ergebnis für den Endnutzer:** Der Agent **versteht AAMS von Haus aus**, baut seine
  eigene lokale Wissens- & Task-Struktur exakt nach dieser Spezifikation auf und bietet
  damit die digitale Souveränität, die AAMS auszeichnet.

## 4. Architektur
* **Runtime:** Browser (Client-side WebGPU)
* **Inferenz:** WebLLM (Qwen/Llama quantisiert)
* **Zustand/Gedächtnis:** AAMS(B)-Struktur in IndexedDB, gekapselt an eine aktive `Session-ID`
* **Export:** Manueller JSON-Download zur Sicherung des Projektstands (AAMS-B)
* **Dev-Prozess:** AAMS(A) in `WORKING/` (Workpaper → Whitepaper → LTM)

## 5. Schnittstellen & Kontrakte
* **AAMS-Schema (geteilt A/B):** JSON-Struktur mit `session_id`, `task_tree`
  (Sub-Tasks: `pending` / `in_progress` / `done`), `audit_logs`, Speicher-Struktur.
* **Helfer-Schnittstellen:** optionales Laden von Transformers.js-Modellen
  (OCR / Translation / Web-Fetch) bei Bedarf in den WebGPU-VRAM; danach VRAM freigeben.

## 6. Invarianten & Nicht-Ziele
* **Invarianten:**
  - Keine Cloud-Anbindung für Kernprozesse; Daten verbleiben zu 100 % im Client-Browser.
  - AAMS-Doppelrolle bleibt getrennt (A ≠ B); gemeinsames Schema zentral hier gepflegt.
  - Der Agent ist AAMS-nativ (B) — **kein** fremdes, paralleles Memory-Modell.
* **Nicht-Ziele (diese Phase):**
  - Keine automatische Cloud-Synchronisation.
  - Keine komplexe Benutzerverwaltung.
  - Kein Multi-Agent-Mesh / WebRTC.

## 7. Verweise
* → Vision-Seed: `idee.md` (Quelle der Inspiration, **kein** Whitepaper)
* → Whitepaper-Vorlage: `WORKING/WHITEPAPER/TEMPLATE.md`
* → Bootstrap-Workpaper: `WORKING/WORKPAPER/WP-2026-10-16-BOOT-INIT-aams-first-entry-bootstrap.md`
* → AAMS-Contract: `.agent.json` (AAMS/2.6.0)
* → LTM-Index: `WORKING/MEMORY/ltm-index.md`
