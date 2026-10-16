**Passende Modelle für den Local-First WebGPU Single-Agent Prototyp (WebLLM) gibt es vor allem unter der Hugging-Face-Organisation `mlc-ai`.**

Das Whitepaper (WH-001) spezifiziert **WebLLM** als Inferenz-Engine mit quantisierten **Qwen/Llama**-Modellen. WebLLM lädt Modelle im **MLC-Format** (meist `q4f16_1` oder `q4f32_1`) direkt aus dem Browser über WebGPU. Die offiziellen, vorkompilierten Modelle liegen bei:

- https://huggingface.co/mlc-ai  
- Liste der prebuilt Models: `prebuiltAppConfig.model_list` im [WebLLM-Repo](https://github.com/mlc-ai/web-llm) (`src/config.ts`)

### Empfohlene Modelle nach Größe (für den Prototyp)

| Kategorie | Modell-ID (Beispiel) | Größe (ca.) | Context | VRAM-Richtwert | Stärken | Hugging-Face-Link |
|-----------|----------------------|-------------|---------|----------------|---------|-------------------|
| **Tiny / schnell testen** | `Qwen2.5-0.5B-Instruct-q4f16_1-MLC`<br>`Qwen3-0.6B-q4f16_1-MLC`<br>`SmolLM2-360M-Instruct-q4f16_1-MLC`<br>`TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC` | 210–400 MB | 2–4K | sehr niedrig | Sofort laden, einfache Tasks, Task-Zerlegung testen | [mlc-ai/Qwen2.5-0.5B…](https://huggingface.co/mlc-ai) u. a. |
| **Small (guter Einstieg)** | `Llama-3.2-1B-Instruct-q4f16_1-MLC`<br>`Qwen2.5-1.5B-Instruct-q4f16_1-MLC`<br>`Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC` | 700–900 MB | 4K | niedrig | Solide Qualität, multilingual, Code-Varianten | [mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC](https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC) |
| **Medium (Empfehlung für Prototyp)** | `Llama-3.2-3B-Instruct-q4f16_1-MLC`<br>`Qwen2.5-3B-Instruct-q4f16_1-MLC`<br>`Qwen3-1.7B-q4f16_1-MLC` / `Qwen3-4B-q4f16_1-MLC`<br>`Phi-3.5-mini-instruct-q4f16_1-MLC`<br>`Hermes-3-Llama-3.2-3B-q4f16_1-MLC` | 1,1–2,2 GB | 4K | mittel | Beste Balance Qualität/Geschwindigkeit, Reasoning, Chat | z. B. [mlc-ai/Llama-3.2-3B…](https://huggingface.co/mlc-ai) |
| **Größer (wenn genug VRAM)** | `Qwen2.5-7B-Instruct-q4f16_1-MLC`<br>`Qwen2.5-Coder-7B-Instruct-q4f16_1-MLC`<br>`Llama-3.1-8B-Instruct-q4f16_1-MLC`<br>`DeepSeek-R1-Distill-Qwen-7B` / `DeepSeek-R1-Distill-Llama-8B` | 4–5 GB | 4K | hoch | Sehr gute Qualität, Reasoning, Code | mlc-ai-Repos |

### Warum diese besonders gut passen
- **Qwen-Familie** (Qwen2.5 / Qwen3): Im Whitepaper explizit genannt, stark multilingual, gute Instruction-Following und Code-Varianten – ideal für Task-Zerlegung + AAMS-Gedächtnis.
- **Llama-3.2 (1B/3B)**: Sehr gut optimiert für Browser/WebGPU, niedrige Ressourcenanforderungen.
- **Phi-3.5-mini**: Starkes Reasoning bei moderater Größe.
- Alle laufen **vollständig client-seitig**, keine Cloud-Anbindung → passt zu den Invarianten (100 % Datensouveränität).

### Praktische Hinweise für den Prototyp
- Starte mit **Qwen2.5-0.5B / 1.5B** oder **Llama-3.2-1B**, um IndexedDB-Session, Task-Tree und JSON-Export schnell zu testen.
- Für realistischere Agenten-Fähigkeiten: **Llama-3.2-3B** oder **Qwen2.5-3B / Qwen3-4B**.
- Quantisierung: bevorzugt `q4f16_1` (gutes Qualitäts-/Speicher-Verhältnis). Manche Modelle brauchen `shader-f16`.
- VRAM-Check: Browser (Chrome/Edge mit WebGPU) + GPU-Speicher beobachten. Bei integrierten GPUs bleiben Tiny/Small sicherer.
- Custom-Modelle können mit MLC-LLM kompiliert und dann in WebLLM eingebunden werden (siehe WebLLM-Docs „Custom Models“).

**Quellen / weiterführend**  
- Offizielle Modelle: [huggingface.co/mlc-ai](https://huggingface.co/mlc-ai)  
- WebLLM GitHub + Model-Liste: [github.com/mlc-ai/web-llm](https://github.com/mlc-ai/web-llm)  
- Demo: [chat.webllm.ai](https://chat.webllm.ai)

Soll ich eine konkrete Start-Konfiguration (z. B. konkrete `appConfig` mit 2–3 Modellen) oder die Coder-/Reasoning-Varianten genauer herausarbeiten?



>>>>>>>>>>>>>>>>>>>>>>>ich
es brauch ein kleines schmales modell was immer läuft . was einen art wächter übernimmt . neue modelle nachlädt und einen unteragenten darauf ansetzt. und auf das ergeniss wartet.


>>>>>>>>>>>>>>>>>>>>>>>>>>>

**Ja – genau dafür brauchst du ein dauerhaft geladenes „Wächter“-/Supervisor-Modell.**

Es soll **immer im Speicher bleiben**, wenig VRAM verbrauchen und die Orchestrierung übernehmen (neue Modelle nachladen → Unteragent starten → auf Ergebnis warten → AAMS-Task-Tree aktualisieren).

### Beste Kandidaten (sehr schmal + stabil)

| Rang | Modell-ID | Größe (Download) | VRAM (ca.) | Context | Empfehlung für Wächter | Bemerkung |
|------|-----------|------------------|------------|---------|------------------------|---------|
| **1** | **SmolLM2-360M-Instruct-q4f16_1-MLC** | ~210 MB | ~350–450 MB | 2K | **Sehr stark empfohlen** | Extrem klein, überraschend gut bei einfachen Steuerungs- und Routing-Aufgaben |
| **2** | **Qwen2.5-0.5B-Instruct-q4f16_1-MLC** | ~278 MB | ~450–600 MB | 4K | Sehr gut | Bessere Instruction-Following und Mehrsprachigkeit als SmolLM |
| **3** | **Qwen3-0.6B-q4f16_1-MLC** | ~350 MB | ~550–700 MB | 4K | Gut | Neuere Architektur, etwas stärker als 0.5B |
| **4** | SmolLM2-135M-Instruct-q0f16-MLC | ~271 MB | noch kleiner | 2K | Nur wenn extrem sparsam | Sehr limitiert in der Intelligenz |

### Klare Empfehlung für deinen Prototyp

**Primär: `SmolLM2-360M-Instruct-q4f16_1-MLC`**  
oder alternativ **`Qwen2.5-0.5B-Instruct-q4f16_1-MLC`**

Begründung:
- Läuft dauerhaft im Hintergrund, ohne den VRAM zu blockieren.
- Lässt genug Spielraum, um bei Bedarf ein größeres Modell (1.5B–3B oder sogar 7B) temporär nachzuladen.
- Reicht völlig aus für:
  - Task-Zerlegung / Sub-Task erstellen
  - Entscheidung „welches Modell brauche ich jetzt?“
  - Laden/Entladen steuern
  - Auf Ergebnis warten und in den AAMS-Task-Tree + Audit-Log schreiben
  - Einfache Kontrollflüsse und Status-Updates

### Typisches Muster (Supervisor-Pattern)

```
Wächter (SmolLM2-360M / Qwen-0.5B)   ← immer geladen
    │
    ├─ analysiert aktuellen Task
    ├─ entscheidet: brauche ich ein stärkeres Modell?
    ├─ lädt temporär z. B. Llama-3.2-3B oder Qwen2.5-3B / 7B
    ├─ startet Unteragent mit dem größeren Modell
    ├─ wartet auf Ergebnis
    ├─ entlädt das große Modell wieder (VRAM freigeben)
    └─ schreibt Ergebnis + Audit-Log in IndexedDB (AAMS-B)
```

### Praktische Tipps
- Halte den Wächter mit möglichst kleinem Context (z. B. 1024–2048 Tokens), damit er selbst wenig Speicher frisst.
- Nutze WebLLM’s Fähigkeit, Modelle dynamisch zu laden/entladen (`engine.reload()` bzw. mehrere Engines).
- Der Wächter sollte vor allem **strukturierte Ausgaben** (JSON) liefern – das können auch die ganz kleinen Modelle schon recht zuverlässig.

Möchtest du, dass ich dir eine konkrete Start-Konfiguration (appConfig + Beispiel-Code-Skelett für den Wächter + dynamisches Nachladen) zusammenstelle?



Das ist ein fantastisches UX- und Architektur-Konzept! Es bricht die enorme Komplexität eines lokalen Multi-Modell-WebGPU-Agenten in eine absolut transparente, kontrollierbare Benutzeroberfläche herunter.

Besonders der Punkt mit dem **harten Token-Management** und dem **AAMS-Gedächtnis als live einsehbare Markdown-Dateien** löst das klassische LLM-Problem: Da das Kontextfenster klein gehalten werden muss (damit der Wächter und die Unteragenten blitzschnell und stabil auf WebGPU laufen), lagert der Agent sein Wissen sofort in die strukturierte AAMS-Markdown-Struktur aus und liest sich bei Bedarf nur das Nötigste wieder ein.

Hier ist die detaillierte UX- und Architektur-Spezifikation für die Web-Oberfläche und das Token-/Gedächtnis-Management:

---

# UI- & Architektur-Spezifikation: WebGPU Agent Dashboard

## 1. UX-Layout: Einfachheit an der Oberfläche, volle Transparenz im Core

Die Benutzeroberfläche teilt sich in drei klare Bereiche, um die Komplexität für den Nutzer radikal zu reduzieren:

```
+---------------------------------------------------------------------------------+
| [Header] Aktive Session-ID | Wächter-Modell [Dropdown] | Export / New Session   |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  +--------------------------------+  +---------------------------------------+  |
|  | 1. HAUPT-CHAT & PLANUNG        |  | 2. SUPERVISOR & UNTERAGENTEN LOGS     |  |
|  |                                |  |                                       |  |
|  | - Aufgabe eingeben             |  | [Wächter: SmolLM2-360M] (Live-Gedanken|  |
|  | - Agent zerlegt in Sub-Tasks   |  |  & Modell-Auswahl bei Planung)        |  |
|  | - Rückfragen bei Unklarheiten  |  | ------------------------------------- |  |
|  | - Interaktiver Startpunkt      |  | [Unteragenten-Log-Strang]             |  |
|  |                                |  | - Lade Modell: Llama-3.2-3B           |  |
|  |                                |  | - OCR-Modell aktiv (Transform.js)     |  |
|  |                                |  | - Task 2.1 in Bearbeitung...          |  |
|  +--------------------------------+  +---------------------------------------+  |
|                                                                                 |
|  +---------------------------------------------------------------------------+  |
|  | 3. LIVE AAMS-GEDÄCHTNIS (Markdown Explorer)                               |  |
|  | [ task-tree.md ] [ audit.md ] [ research-notes.md ] (Live editierbar/einsehbar) |
+---------------------------------------------------------------------------------+

```

### Die UI-Bereiche im Detail:

1. **Haupt-Chat & Planung:** Hier interagiert der Mensch. Aufgabe eingeben -> Agent plant, analysiert die Modellwahl bereits im Planungs-Step, bricht in Sub-Tasks auf und stellt bei Bedarf *Gegenfragen*, bevor er loslegt.
2. **Der Supervisor- & Unteragenten-Strang (Transparenz):**
* **Wächter-Ansicht:** Zeigt in Echtzeit, was der SmolLM2-Wächter gerade denkt, entscheidet und plant. Das Wächter-Modell kann im laufenden Betrieb über ein Dropdown gewechselt werden (z. B. von SmolLM2 auf Qwen-0.5B).
* **Unteragenten-Log:** Ein separater Stream, der aufleuchtet, wenn zusätzliche Modelle (z. B. für OCR, Translation oder ein schweres 3B/7B-Modell) in den WebGPU-VRAM geladen werden und an einer Teilaufgabe arbeiten.


3. **Live AAMS-Gedächtnis (Markdown Explorer):** Jedes `.md`-Dokument, das der Agent anlegt (Task-Tree, Statusberichte, Recherche-Snippets), ist in Echtzeit als Datei anklickbar und einsehbar. Der Nutzer hat die volle Kontrolle und sieht genau, was der Agent ins Gedächtnis schreibt.

---

## 2. Hard Token Management & Heartbeat-Architektur

Da WebGPU-Modelle im Browser (besonders bei kleineren bis mittleren Kontextfenstern von 2K–4K Tokens) schnell an Performance-Grenzen stoßen oder Details vergessen, greift ein striktes Management:

* **Der Context-Window-Filter (Rolling Window):**
* Der Wächter-Loop liest **niemals** den gesamten Chat-Verlauf.
* Er bekommt nur:
1. Den aktuellen High-Level-Status.
2. Die aktive Sub-Task.
3. Die Metadaten aus der IndexedDB (AAMS).




* **Der 1-Minuten-Heartbeat & Task-Loop:**
* **Heartbeat (1 min):** Prüft den Systemzustand, validiert VRAM-Auslastung und aktualisiert den Zeitstempel im Gedächtnis.
* **Task-Loop (15–30 min oder schrittgesteuert):** Der Agent arbeitet autonom Teilaufgabe für Teilaufgabe ab. Nach jedem Teilschritt wird das Ergebnis komprimiert, als Markdown-Datei in die IndexedDB geschrieben und der aktive RAM-Kontext für den nächsten Schritt bereinigt (*Token Flushing*).



---

## 3. Workflow-Beispiel: Vom Prompt zum Ergebnis

1. **Eingabe:** Nutzer gibt eine komplexe Aufgabe ein („Recherchiere Thema X und erstelle eine Zusammenfassung“).
2. **Planung & Modell-Analyse (Wächter):**
* Der Wächter (`SmolLM2-360M`) analysiert den Prompt, bricht ihn in Teilaufgaben (`Task 1`, `Task 2`) auf und bewertet direkt in der UI sichtbar: *„Für Task 1 reicht der Wächter; für Task 2 (Deep Research/Zusammenfassung) muss Modell Llama-3.2-3B geladen werden.“*
* Gibt es Unklarheiten, stellt der Agent **vor** dem Start eine gezielte Gegenfrage an den Nutzer.


3. **Ausführung & Unteragenten:**
* Der Wächter triggert Task 1, speichert das Zwischenergebnis in `WORKING/MEMORY/task-tree.md`.
* Für Task 2 lädt der Agent via WebLLM das größere Modell in den VRAM, zeigt im Log „[Modell geladen: Llama-3.2-3B]“, verarbeitet die Daten und entlädt das Modell danach wieder.


4. **Live-Gedächtnis:** Der Nutzer kann währenddessen im Tab unten live zusehen, wie sich `research-notes.md` mit Inhalt füllt.
5. **Abschluss:** Der Agent meldet Vollzug, der Stand ist in der IndexedDB gesichert und kann per JSON-Export heruntergeladen werden.




>>>>>>>>>>>>>>>>>>>>>>>>>>>>
analyse von gemini
>>>>>>>>>>>>>>>>>>>>>>>>>
Das ist ein fantastisches UX- und Architektur-Konzept! Es bricht die enorme Komplexität eines lokalen Multi-Modell-WebGPU-Agenten in eine absolut transparente, kontrollierbare Benutzeroberfläche herunter.

Besonders der Punkt mit dem **harten Token-Management** und dem **AAMS-Gedächtnis als live einsehbare Markdown-Dateien** löst das klassische LLM-Problem: Da das Kontextfenster klein gehalten werden muss (damit der Wächter und die Unteragenten blitzschnell und stabil auf WebGPU laufen), lagert der Agent sein Wissen sofort in die strukturierte AAMS-Markdown-Struktur aus und liest sich bei Bedarf nur das Nötigste wieder ein.

Hier ist die detaillierte UX- und Architektur-Spezifikation für die Web-Oberfläche und das Token-/Gedächtnis-Management:

---

# UI- & Architektur-Spezifikation: WebGPU Agent Dashboard

## 1. UX-Layout: Einfachheit an der Oberfläche, volle Transparenz im Core

Die Benutzeroberfläche teilt sich in drei klare Bereiche, um die Komplexität für den Nutzer radikal zu reduzieren:

```
+---------------------------------------------------------------------------------+
| [Header] Aktive Session-ID | Wächter-Modell [Dropdown] | Export / New Session   |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  +--------------------------------+  +---------------------------------------+  |
|  | 1. HAUPT-CHAT & PLANUNG        |  | 2. SUPERVISOR & UNTERAGENTEN LOGS     |  |
|  |                                |  |                                       |  |
|  | - Aufgabe eingeben             |  | [Wächter: SmolLM2-360M] (Live-Gedanken|  |
|  | - Agent zerlegt in Sub-Tasks   |  |  & Modell-Auswahl bei Planung)        |  |
|  | - Rückfragen bei Unklarheiten  |  | ------------------------------------- |  |
|  | - Interaktiver Startpunkt      |  | [Unteragenten-Log-Strang]             |  |
|  |                                |  | - Lade Modell: Llama-3.2-3B           |  |
|  |                                |  | - OCR-Modell aktiv (Transform.js)     |  |
|  |                                |  | - Task 2.1 in Bearbeitung...          |  |
|  +--------------------------------+  +---------------------------------------+  |
|                                                                                 |
|  +---------------------------------------------------------------------------+  |
|  | 3. LIVE AAMS-GEDÄCHTNIS (Markdown Explorer)                               |  |
|  | [ task-tree.md ] [ audit.md ] [ research-notes.md ] (Live editierbar/einsehbar) |
+---------------------------------------------------------------------------------+

```

### Die UI-Bereiche im Detail:

1. **Haupt-Chat & Planung:** Hier interagiert der Mensch. Aufgabe eingeben -> Agent plant, analysiert die Modellwahl bereits im Planungs-Step, bricht in Sub-Tasks auf und stellt bei Bedarf *Gegenfragen*, bevor er loslegt.
2. **Der Supervisor- & Unteragenten-Strang (Transparenz):**
* **Wächter-Ansicht:** Zeigt in Echtzeit, was der SmolLM2-Wächter gerade denkt, entscheidet und plant. Das Wächter-Modell kann im laufenden Betrieb über ein Dropdown gewechselt werden (z. B. von SmolLM2 auf Qwen-0.5B).
* **Unteragenten-Log:** Ein separater Stream, der aufleuchtet, wenn zusätzliche Modelle (z. B. für OCR, Translation oder ein schweres 3B/7B-Modell) in den WebGPU-VRAM geladen werden und an einer Teilaufgabe arbeiten.


3. **Live AAMS-Gedächtnis (Markdown Explorer):** Jedes `.md`-Dokument, das der Agent anlegt (Task-Tree, Statusberichte, Recherche-Snippets), ist in Echtzeit als Datei anklickbar und einsehbar. Der Nutzer hat die volle Kontrolle und sieht genau, was der Agent ins Gedächtnis schreibt.

---

## 2. Hard Token Management & Heartbeat-Architektur

Da WebGPU-Modelle im Browser (besonders bei kleineren bis mittleren Kontextfenstern von 2K–4K Tokens) schnell an Performance-Grenzen stoßen oder Details vergessen, greift ein striktes Management:

* **Der Context-Window-Filter (Rolling Window):**
* Der Wächter-Loop liest **niemals** den gesamten Chat-Verlauf.
* Er bekommt nur:
1. Den aktuellen High-Level-Status.
2. Die aktive Sub-Task.
3. Die Metadaten aus der IndexedDB (AAMS).




* **Der 1-Minuten-Heartbeat & Task-Loop:**
* **Heartbeat (1 min):** Prüft den Systemzustand, validiert VRAM-Auslastung und aktualisiert den Zeitstempel im Gedächtnis.
* **Task-Loop (15–30 min oder schrittgesteuert):** Der Agent arbeitet autonom Teilaufgabe für Teilaufgabe ab. Nach jedem Teilschritt wird das Ergebnis komprimiert, als Markdown-Datei in die IndexedDB geschrieben und der aktive RAM-Kontext für den nächsten Schritt bereinigt (*Token Flushing*).



---

## 3. Workflow-Beispiel: Vom Prompt zum Ergebnis

1. **Eingabe:** Nutzer gibt eine komplexe Aufgabe ein („Recherchiere Thema X und erstelle eine Zusammenfassung“).
2. **Planung & Modell-Analyse (Wächter):**
* Der Wächter (`SmolLM2-360M`) analysiert den Prompt, bricht ihn in Teilaufgaben (`Task 1`, `Task 2`) auf und bewertet direkt in der UI sichtbar: *„Für Task 1 reicht der Wächter; für Task 2 (Deep Research/Zusammenfassung) muss Modell Llama-3.2-3B geladen werden.“*
* Gibt es Unklarheiten, stellt der Agent **vor** dem Start eine gezielte Gegenfrage an den Nutzer.


3. **Ausführung & Unteragenten:**
* Der Wächter triggert Task 1, speichert das Zwischenergebnis in `WORKING/MEMORY/task-tree.md`.
* Für Task 2 lädt der Agent via WebLLM das größere Modell in den VRAM, zeigt im Log „[Modell geladen: Llama-3.2-3B]“, verarbeitet die Daten und entlädt das Modell danach wieder.


4. **Live-Gedächtnis:** Der Nutzer kann währenddessen im Tab unten live zusehen, wie sich `research-notes.md` mit Inhalt füllt.
5. **Abschluss:** Der Agent meldet Vollzug, der Stand ist in der IndexedDB gesichert und kann per JSON-Export heruntergeladen werden.