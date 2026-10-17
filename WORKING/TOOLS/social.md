# social.md — Postings für webgpu-agent (Stand: 2026-10-17)

> **Zweck:** Fertige, sofort nutzbare Textbausteine für Social Media & Foren.
> **Regel Nr. 1:** Ehrlich über den WIP-Status — **privates Forschungsprojekt / Experiment, kein Produkt.**
> Keine Hype-Wörter, keine Versprechen.
> **Screenshot:** `src/public/images/screenshot.png` (für X, WhatsApp, Telegram, Reddit anhängen).
> **Fix-Links (überall gleich):**
> - **Demo:** `https://huggingface.co/spaces/ogerl/webgpu-agent`
> - **Doku:** `https://ogerl-webgpu-agent.static.hf.space/doku.html` (Unterseite der App — Warum/Ziel/Stand/Forschung/Probleme)
> - **Code:** `https://github.com/ogerly/webgpu-agent`

---

## 0. Kernbotschaft (Basis für alle Kanäle)

**DE:** webgpu-agent ist ein privates Forschungsprojekt: ein autonomer Webagent, der zu 100 % im
Browser läuft. Lokale LLMs auf der GPU (WebGPU/WebLLM): ein 0,5-B-„Wächter" läuft resident, ein
3-B-„Planer" lädt on-demand nach. Der Agent zerlegt Aufgaben selbst, führt sie aus, führt ein Audit-Log
und hat ein strukturiertes Gedächtnis (IndexedDB, JSON-Export/Import). Keine Cloud, kein Server — die
Daten bleiben auf dem Gerät. Status: Prototyp (WIP), MIT-lizenziert, Mitarbeit willkommen.

**EN:** webgpu-agent is a private research project: an autonomous web agent running 100% in the browser.
Local LLMs on the GPU (WebGPU/WebLLM): a 0.5B "supervisor" runs resident, a 3B "planner" loads on demand.
The agent decomposes tasks on its own, executes them, keeps an audit log and has structured memory
(IndexedDB, JSON export/import). No cloud, no server — data stays on the device. Status: prototype (WIP),
MIT licensed, contributions welcome.

**Fakten, die immer mitgedacht werden (Ehrlichkeits-Basis):**
- WebGPU-Pflicht → Chrome/Edge (Firefox/Safari: aktuell nein)
- Erster Start lädt ≈ 945 MB (Wächter) + ≈ 2,3 GB (Planer) — **einmalig**, danach Browser-Cache
- Modell-Katalog mit ≤ 4-GB-VRAM-Profil; Kontext aktuell 4096 Tokens pro Modell

---

## 1. X (Twitter)

> Links zählen auf X als je 23 Zeichen (t.co) → beide Varianten liegen unter 280.
> Screenshot `src/public/images/screenshot.png` **anhängen**.

**Variante DE:**
```
Ich baue einen Agenten, der 100 % im Browser läuft: lokale LLMs über WebGPU (0,5 B Wächter + 3 B Planer), strukturiertes Gedächtnis, echte Task-Zerlegung & Ausführung — keine Cloud. WIP-Experiment:
https://huggingface.co/spaces/ogerl/webgpu-agent
https://github.com/ogerly/webgpu-agent
#WebGPU
```

**Variante EN:**
```
Building an agent that runs 100% in your browser: local LLMs on WebGPU (0.5B supervisor + 3B planner), structured memory, real task decomposition & execution. No cloud, no server. WIP experiment:
https://huggingface.co/spaces/ogerl/webgpu-agent
https://github.com/ogerly/webgpu-agent
#WebGPU
```

---

## 2. WhatsApp / Telegram (persönlicher Kreis, Gruppen)

```
🧪 webgpu-agent — ein Agent, der 100 % im Browser läuft

Keine Cloud, kein Server: Die LLMs (0,5 B „Wächter" + 3 B „Planer") laufen lokal auf der GPU (WebGPU).
Der Agent zerlegt Aufgaben selbst, führt sie aus, führt ein Audit-Log — und hat ein strukturiertes
Gedächtnis (IndexedDB, JSON-Export/Import). Die Daten bleiben auf dem Gerät.

Status: Prototyp / privates Forschungsprojekt (WIP) — aber lauffähig:
▶ Demo: https://huggingface.co/spaces/ogerl/webgpu-agent
▶ Code: https://github.com/ogerly/webgpu-agent

Braucht: Chrome/Edge (WebGPU). Erster Start lädt ≈ 3 GB Modelle (einmalig, danach Cache).
Screenshot im Anhang 📸
```

---

## 3. LinkedIn

**DE:**
```
Was, wenn dein Agent gar keine Cloud braucht?

Ich arbeite an einem Experiment, das ich hier teilen möchte: webgpu-agent — ein autonomer
Webagent, der zu 100 % im Browser läuft.

Warum mich das beschäftigt: Bei herkömmlichen Agents geht jede Aufgabe, jeder Dateiinhalt,
jedes Gedächtnis über Server. Hier läuft alles lokal auf der GPU des eigenen Geräts —
Datensouveränität ist keine Einstellung, sondern die Architektur.

Was drinsteckt (aktueller Stand):
• Lokale LLMs via WebGPU (WebLLM): 0,5-B-„Wächter" (resident) + 3-B-„Planer" (on-demand),
  Modell-Katalog mit ≤ 4-GB-VRAM-Profil
• Echter Agent-Loop: Der Planer zerlegt Aufgaben in Teilaufgaben, ein Executor führt sie aus —
  mit Audit-Log und echter Token-Usage
• Strukturiertes Gedächtnis in IndexedDB (Session, Tasks, Audit, Memory) — portierbar
  per JSON-Export/Import
• HTML-Artefakte: Ergebnisse als echte Dateien, Sandbox-Vorschau + Download
• Dashboard: Modell-Pool, VRAM-Budget, Live-Feed, Tabs Zuschauen/Arbeit/Audit/Gedächtnis

Ehrlicher Status: Das ist ein privates Forschungsprojekt, ein Prototyp (WIP) — kein fertiges
Produkt. Aber es läuft, es ist MIT-lizenziert, und Mitarbeit/Feedback ist ausdrücklich
erwünscht.

Demo (Chrome/Edge mit WebGPU): https://huggingface.co/spaces/ogerl/webgpu-agent
Code: https://github.com/ogerly/webgpu-agent

#WebGPU #LocalLLM #AIAgent #Datensouveränität #OpenSource
```

**EN (optional):**
```
What if your AI agent didn't need a cloud at all?

I'm building webgpu-agent — an autonomous web agent running 100% in the browser. Local LLMs on
your GPU (WebGPU/WebLLM): a 0.5B supervisor runs resident, a 3B planner loads on demand. The agent
decomposes tasks, executes them, keeps an audit log — and has structured memory in IndexedDB
(JSON export/import). No cloud, no server: data sovereignty by architecture.

Honest status: private research project, prototype (WIP), not a product. MIT licensed,
contributions welcome.

Demo (Chrome/Edge with WebGPU): https://huggingface.co/spaces/ogerl/webgpu-agent
Code: https://github.com/ogerly/webgpu-agent

#WebGPU #LocalLLM #AIAgent #OpenSource
```

---

## 4. Foren

> **Regeln:** nicht überall gleichzeitig posten · Sub-/Forum-Regeln vorher lesen · Self-Promo
> maßvoll · Feedback aktiv beantworten · **einmalig posten, danach nur antworten.**

### Hacker News (einmalig, kein Re-Post)

**Titel:** `Show HN: Webgpu-agent – AI agent running 100% in the browser (WebGPU + WebLLM)`

```
I built a prototype of an autonomous web agent that runs 100% client-side — no cloud, no server,
no backend. All LLM inference happens locally on the GPU via WebGPU (WebLLM/MLC-Web).

What it does:
- "Supervisor" model (0.5B, resident) + "planner" model (3B, on-demand), catalog limited to a
  ≤ 4 GB VRAM profile
- Real agent loop: the planner decomposes a task into subtasks (JSON), an executor runs them,
  with an audit log and real token usage
- Structured session memory in IndexedDB (tasks, audit, memory) with JSON export/import
- HTML artifacts: results as real files, sandboxed preview (no allow-same-origin) + download
- Dashboard: model pool with download progress, VRAM budget bar, live feed, audit tab

Honest caveats:
- Prototype/WIP — this is a private research project, not a product
- Requires WebGPU (Chrome/Edge); first load downloads ~945 MB (supervisor) + ~2.3 GB (planner),
  then it is cached
- 4096-token context window per model right now

Demo: https://huggingface.co/spaces/ogerl/webgpu-agent
Code (MIT): https://github.com/ogerly/webgpu-agent

Feedback very welcome — especially on the memory model and the agent loop.
```

### Reddit r/LocalLLaMA

**Titel:** `[Show] webgpu-agent – a local-first AI agent that runs entirely in your browser`

```
Local LLMs on the GPU via WebGPU: 0.5B supervisor (resident) + 3B planner (on-demand), ≤ 4 GB VRAM
profile. The agent decomposes tasks on its own, executes them, keeps an audit log and has structured
memory in IndexedDB (JSON export/import). No cloud, no server — your data stays on your machine.

Status: prototype/WIP, private research project. MIT licensed, feedback welcome.

Demo (Chrome/Edge): https://huggingface.co/spaces/ogerl/webgpu-agent
Code: https://github.com/ogerly/webgpu-agent

(Screenshot im zweiten Post anbei.)
```

### Reddit r/webgpu (technischer Winkel)

**Titel:** `Running an agent loop entirely in the browser (WebLLM: 0.5B resident + 3B on-demand)`

```
What I'm curious about: how far can a real agent loop go in-browser? My current setup:

- Model pool on WebGPU: 0.5B resident ("supervisor") + 3B on-demand ("planner"), catalog ≤ 4 GB VRAM
- VRAM budget bar in the UI (two segments), download progress per model, DEGRADED state if OOM
- Agent loop: planner emits a JSON task tree → executor runs subtasks → audit log with real token usage
- Session state in IndexedDB, JSON export/import

First load is ~945 MB + ~2.3 GB of weights (one-time, cached after). Chrome/Edge only (WebGPU).

Demo: https://huggingface.co/spaces/ogerl/webgpu-agent · Code: https://github.com/ogerly/webgpu-agent

Would love to hear where you hit limits with in-browser inference.
```

### Deutschsprachige Foren (z. B. r/programmieren, DD:German, vGx)

```
Ich baue einen Agenten, der komplett im Browser läuft (lokal auf der GPU)

webgpu-agent: lokale LLMs via WebGPU (0,5 B „Wächter" resident + 3 B „Planer" on-demand),
der Agent zerlegt Aufgaben selbst und führt sie aus — mit Audit-Log und strukturiertem
Gedächtnis (IndexedDB, JSON-Export/Import). Keine Cloud, keine Server: die Daten bleiben
auf dem Gerät.

Status: privates Forschungsprojekt / Prototyp (WIP), MIT-lizenziert, Feedback & Mitarbeit
erwünscht.

Demo: https://huggingface.co/spaces/ogerl/webgpu-agent (Chrome/Edge)
Code: https://github.com/ogerly/webgpu-agent
Screenshot anbei.
```

### Lobsters

**Titel:** `webgpu-agent – local-first agent in the browser (WebGPU + WebLLM, 0.5B/3B)`

```
Autonomous agent, 100% client-side: local LLMs on the GPU (0.5B resident supervisor + 3B on-demand
planner, ≤ 4 GB VRAM profile), JSON task decomposition, executor with audit log and real token usage,
structured memory in IndexedDB (JSON export/import), sandboxed HTML artifacts.

Prototype/WIP, private research project, MIT. WebGPU required (Chrome/Edge); first load ≈ 3 GB
weights (cached after).

Demo: https://huggingface.co/spaces/ogerl/webgpu-agent
Code: https://github.com/ogerly/webgpu-agent
```

---

## 5. Do / Don't

**Do:**
- Immer ehrlich: WIP / Prototyp / privates Forschungsprojekt
- Immer: Demo-Link + Code-Link + (wenn Bild möglich) Screenshot
- Feedback aktiv einladen („Mitarbeit erwünscht")
- Technische Grenzen nennen (WebGPU/Chrome-Edge, ≈ 3 GB First-Load)
- „Keine Cloud / Datensouveränität" als Kernargument nutzen

**Don't:**
- Keine Hype-Wörter („revolutionär", „game changer", „AGI")
- Keine Feature-Versprechen, die nicht gebaut sind (PWA, Browser-Extension, OPFS-Sync = noch offen)
- Nicht gleichzeitig auf allen Kanälen posten (2–3 Tage Abstand; HN einmalig)
- Persönliche Daten nicht preisgeben — bei Interesse auf GitHub verweisen

## 6. Veröffentlichungs-Reihenfolge (Vorschlag)

1. GitHub-Repo final (README + Screenshot + LICENSE) ✅
2. X (DE oder EN) — mit Screenshot
3. HN / Reddit (gleicher Tag wie X)
4. LinkedIn (1–2 Tage später)
5. WhatsApp/Telegram (persönlicher Kreis, zuletzt)

## 7. Vor dem Posten prüfen (Checkliste)

- [ ] Demo-URL öffnet im Browser (Chrome/Edge)
- [ ] Screenshot aktuell (`src/public/images/screenshot.png`)
- [ ] GitHub-Repo public, README mit WIP-/Mithilfe-Hinweis, `LICENSE` (MIT) vorhanden
- [ ] X: ≤ 280 Zeichen (Links = je 23 Z.)
- [ ] Eigenen Handle/Profilnamen ergänzen, falls vorhanden
- [ ] Ton-Check: klingt es wie ehrliches Forschungsprojekt — nicht wie Produkt-Anzeige?
