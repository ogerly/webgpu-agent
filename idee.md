# Project Whitepaper: Local-First WebGPU Agent (AAMS Single-Agent Prototype)

## 1. Vision & Executive Summary

Dieses Projekt spezifiziert einen vollständig clientseitigen, autonomen Webagenten, der direkt im Browser über **WebGPU** läuft. Er kombiniert das **Autonomous Agent Mesh System (AAMS)** als strukturiertes, session-bezogenes Gedächtnis mit lokalen Open-Source-LLMs (via WebLLM) und agentischen Grundfähigkeiten. Das System kommt komplett ohne Cloud-APIs oder Serverinfrastruktur aus und garantiert maximale Datensouveränität.

---

## 2. Kernarchitektur & Scope

```
+-----------------------------------------------------------------+
|                       Browser Environment                       |
|                                                                 |
|  +-----------------------------------------------------------+  |
|  | Session & Project Header (Aktive Session-ID / Status)     |  |
|  +-----------------------------------------------------------+  |
|                                 |                               |
|  +--------------------+         v          +-----------------+  |
|  | WebGPU LLM Runtime | <----------------> | AAMS State &    |  |
|  | (WebLLM / Qwen)    |  (Task & Reasoning)| Task-Engine     |  |
|  +--------------------+                    +-----------------+  |
|            |                                        |           |
|            v                                        v           |
|  +------------------------------------+    +-----------------+  |
|  | Helfer-Modelle & Tools (On-Demand) |    | IndexedDB       |  |
|  | - OCR / Translation / Web-Fetch    |    | (Lokaler Cache) |  |
|  +------------------------------------+    +-----------------+  |
|                                                     |           |
|                                                     v           |
|                                            +-----------------+  |
|                                            | JSON Export     |  |
|                                            | (Backup/Restore)|  |
|                                            +-----------------+  |
+-----------------------------------------------------------------+

```

---

## 3. Zentrale Komponenten & Funktionsweise

### A. Session- & Projekt-Management

* **Klare Identität:** Jede Arbeitsphase besitzt eine eindeutige **Session-ID** / Projektbezeichnung, die im UI permanent sichtbar ist.
* **Session-Reset ("Neue Session"):** Löst einen sauberen, symbolischen Reset aus. Das Arbeitsgedächtnis wird für die neue Instanz geleert, und der Agent beginnt frisch mit einer leeren Task-Queue.
* **Export-Sicherung:** Da auf komplexe, geräteübergreifende Datenbanksysteme für alte Historien bewusst verzichtet wird, erfolgt die Sicherung alter Stände über einen manuellen **JSON-Export**, der das komplette AAMS-Gedächtnis der Session lokal abspeichert.

### B. Agentische Fähigkeiten & Task-Zerlegung

* **Teilaufgaben (Sub-Task-Tree):** Der Agent nimmt eine komplexe Eingabe entgegen, bricht diese in logische Teilaufgaben herunter und verwaltet den Status (`pending`, `in_progress`, `completed`).
* **Autonomer Loop:** Ein gesteuerter Task-Loop (z. B. alle 15–30 Minuten oder schrittweise per manueller Auslösung) führt die nächsten Schritte aus, dokumentiert Zwischenstände und speichert sie ab.

### C. WebGPU-Inferenz & Helfer-Modelle

* **Haupt-LLM:** Ausführung kompakter Open-Source-Modelle (z. B. Qwen oder Llama) direkt auf der lokalen GPU über WebLLM.
* **Helfer-Modelle (On-Demand):** Bei Bedarf lädt der Agent spezialisierte Helfer (z. B. via Transformers.js für OCR oder Textübersetzung) in den Browser-Speicher, um spezifische Teilaufgaben zu lösen, und gibt den VRAM anschließend wieder frei.

### D. Persistenz

* **Laufzeit:** Asynchrone Zwischenspeicherung in der browserinternen `IndexedDB`.
* **Portabilität:** Export und Import der Session als `.json`-Datei zur Datenübernahme oder Langzeitsicherung.



EXAMPLE AAMS: https://github.com/ogerly/AAMS
EXAMPLE WebGPU arena: https://github.com/ogerly/webgpu-arena