# WP-2026-10-16-UI-DASH — Harte Analyse: Client-Dashboard vs. Exemplar (client-index-example.html)

**Status:** open
**BY:** — / opencode / qwen/qwen3.8-27b / local
**Continued from:** `WP-2026-10-16-BENCH-IMPL-modell-pool-echter-agent-loop.md` (UI-Grundlage)
**TOPIC:** UI · **Sub-Topic:** DASH
**Erstellt:** 2026-10-16
**Charakter:** **Analyse + Design-Spezifikation** — harter Vergleich des aktuellen Dashboards
(`index.html` + `src/ui/app.ts` + `src/main.ts`) mit dem Exemplar
`WORKING/WORKPAPER/observe/client-index-example.html` (weiter „Exemplar“).
Ergebnis: **Style-Migration** auf die Design-DNA des Exemplars + **Chat als einziger Textkanal**
+ **Wächter-/Planer-Karten** + neuer **„Zuschauen“-Bereich** (Agenten live verfolgen).
Das Exemplar ist **Stil- und Strukturmaßstab, aber kein Produktionscode** — es fehlt jede echte
Agenten-Semantik (s. §4 „Was nicht übernommen wird“).

## session_goal

> „Erstell ein neues workpaper. Nimm unser client dashboard. Und mach eine harte analyse.
> Hier ist ein example: WORKING\WORKPAPER\observe\client-index-example.html.
> Bitte die analyse auf das example ziehen. Das sieht viel moderner aus. Zeigt auch schon einen chat
> an — das ist das einzige, womit ein user mit dem agenten tool schreibt. Und der agent auch da
> antwortet oder gegenfragt. Die Wächter-Ansicht und Planer-Ansicht kommt besser rüber, und ein
> Teil, wo man den agenten zuschauen kann. Lass uns also den style anpassen.“

→ Das Ziel fixiert **vier Entscheidungen** vorweg:
1. **Chat = einziger Textkanal** zwischen User und Agent (Agent antwortet dort, **stellt Gegenfragen**).
2. **Wächter-Ansicht + Planer-Ansicht** müssen besser rüberkommen (heute: ein Wort + ein Button).
3. **Ein „Zuschauen“-Bereich** — den Agenten bei der Arbeit zusehen können.
4. **Style anpassen** — das Exemplar (dunkel, App-Frame, Karten) ist der Maßstab für „modern“.

## 0. Hartes Urteil (Kernaussage)

Das aktuelle Dashboard ist eine **Werkzeug-Konsole** (Buttons + `prompt()`-Dialoge + eine
Status-Zeile). Das Exemplar ist ein **Agent-Cockpit** (Chat im Zentrum, Rollen-Karten, VRAM-Bar,
Live-Ansichten). Der Kern-Versprechen des Projekts (idee.md §3B: *autonomer Agent, dem man
Aufgaben anvertraut*) ist im aktuellen UI **gar nicht sichtbar** — der User muss die Button-Reihenfolge
kennen (① laden → ③ planen (2× prompt) → ③ Schritt → ② Loop). Das Exemplar macht den Agenten
zum Protagonisten. → **Migration auf die Design-DNA des Exemplars ist begründet und gewünscht.**
Aber: das Exemplar ist eine **Demo ohne echten Agenten** (im File selbst notiert: „nur Simulation —
ersetzt keinen echten Agenten“) — es bringt den Stil, wir bringen die Semantik (§4, §5).

## 1. Vergleichsobjekte (Ground-Truth)

| | **Aktuelles Dashboard** | **Exemplar** |
|---|---|---|
| Dateien | `index.html` (125 Z.) · `src/ui/app.ts` (269 Z.) · `src/main.ts` (164 Z.) | `observe/client-index-example.html` (438 Z., self-contained) |
| Stack | Vite + TS, DOM via `querySelector`, `prompt/confirm/alert` | Plain HTML/CSS/JS, `window.WGA`-Adapter-API |
| Daten | **echt**: AAMS-B (IndexedDB), `ModelPool`, `Agent`, `KernSupervisor` | **simuliert**: Demo-Modus, kein AAMS, kein WebLLM |
| Layout | Dokument: `max-width:820px`, hell, `color-scheme: light dark` | App: `100vh`-Frame, dunkel, 3-Spalten-Grid |
| Agent-Kommunikation | Status-Zeile `#status` (1 Zeile, überschrieben) | Chat (Mehrzeilen, Rollen-Badges, Typing, Chips) |
| Modell-Ansicht | 2 Zeilen (Wort-Status) + gemeinsamer Download-Kasten | 2 Rollen-Karten (Stufen, %, MB/s, ETA, Raw) + VRAM-Bar |
| Beobachtung | 3 Textboxen (KERN-Log, Audit, Memory), unfilterbar | Tabs Arbeit/Audit/Gedächtnis + Filter-Chips |
| VRAM-Budget | „geladen: X MB“ im Panel-Header | **2-Segment-Balken in der Topbar** (Wächter/Planer) |

## 2. Harte Analyse je Dimension

### 2.1 Interaktion: Buttons + Dialoge vs. Chat

**Ist-Zustand (harte Kritik):**
- 6 Aktions-Buttons + 2 Dropdowns; Freitext **nur** über `prompt()` („Aufgabe / Ziel eingeben:“,
  „Erwartete Teilaufgaben:“) — blockierende Browser-Dialoge, nicht stylbar, kein Kontext, keine
  Gesprächsführung.
- Die einzige „Stimme“ des Agenten = die `#status`-Zeile ganz unten (eine Zeile, wird bei jedem
  Ereignis **überschrieben** → nichts kumuliert, nichts bleibt lesbar).
- Fehleranzeige via `alert()` (Import).
- Der User muss die Reihenfolge der Buttons kennen und die Bedeutung jedes Dropdowns.
  → Das ist ein **Tool-Panel für Kenner**, nicht die Oberfläche eines Agenten.

**Exemplar:**
- Chat in der Mitte = einziger Textkanal. Agent antwortet mit **Rollen-Badge** (Wächter/Planer),
  Systemereignisse als `sys`-Bubble (z. B. „Planer: lade Llama-3.2-3B …“), **Typing-Indikator**
  (3 Punkte), **Chips** für typische Fragen, Zustand im Chat-Header („bereit“/„denkt …“).
- `window.WGA.onSend` = Hook: UI → Agent, Agent → `WGA.say()`. Sauber getrennt.

**Urteil:** ✅ Chat als **einziger Textkanal** übernehmen (Ziel #1). Alle Freitext-Eingaben
(Ziel, Klärung) gehen in den Chat; die `prompt()`-Dialoge verschwinden. Buttons bleiben nur für
**diskrete Controls** (Laden/Entladen, Start/Stop, Export/Import/Reset).
⚠️ **Konsequenz für den Agenten (neu):** `Agent.chat()` — heute gibt es das nicht. Der Wächter
(0.5B) kann **keine freie Konversation** (VRAM + Qualität) → **Intent-gesteuert**:
klassifizieren (Status | Aufgabe | Frage) → Template / **Gegenfrage** / `plan()` (s. §3.4).
Das `demoReply()` im Exemplar ist explizit Platzhalter — es ist **nicht** die Spezifikation.

### 2.2 Wächter-Ansicht & Planer-Ansicht

**Ist-Zustand (harte Kritik):**
- Pro Rolle: Name + Ein-Wort-Status („○ nicht geladen“ / „● bereit“) + Select + 2 Buttons.
- **Ein gemeinsamer** Download-Kasten (`#dl`) für beide Rollen — räumlich nicht an die Rolle
  gebunden; keine Stufen, kein Tempo, keine Restzeit.
- VRAM: nur „geladen: X MB“ als Gesamtnummer im Panel-Header — wer wie viel belegt, ist
  **nicht** sichtbar (trotzdem ist das 4-GB-Budget WH-002s Kern!).
- ✅ **DEGRADED-State existiert** („⚠ DEGRADED (Wächter übernimmt)“) — das Exemplar hat ihn **nicht**.

**Exemplar:**
- **Karte pro Rolle**: Kopf (Rolle + Modus resident/on-demand + Status-Pille mit Punkt),
  Select (Modell + ≈MB) + Laden/Entladen; beim Laden: **4 Stufen** (Download → Cache →
  Shader → Bereit), **großes %**, Fortschritts-Balken mit Shine, Stats (Geladen MB · Tempo
  MB/s · Dauer/Restzeit), **Raw-Zeile** (echter WebLLM-Progress-Text, 1 Zeile + Tooltip).
- **VRAM-Budget-Balken in der Topbar** mit **2 Segmenten** (Wächter grün `--ok`, Planer lila
  `--acc2`) + „x / 4096 MB“ — das Budget ist permanent sichtbar.
- Pille-States: `nicht geladen | lädt … | bereit | Fehler` (Puls beim Laden).

**Urteil:** ✅ Rollen-Karten + 2-Segment-VRAM-Bar übernehmen.
⚠️ **DEGRADED-Pille ergänzen** (Warn-Farbe, „Wächter übernimmt“) — fehlte im Exemplar,
ist echte Pool-Semantik (`PoolStatus.degraded`, `src/llm/pool.ts:69`).
⚠️ **Stufen-Erkennung** im Exemplar = Regex auf dem Progress-Text (fragil bei WebLLM-Updates)
→ eigene Funktion `stageFromText()` mit Ground-Truth gegen die installierte **WebLLM 0.2.86**
(ground-truth WP-BENCH-IMPL) + Fallback auf reinen %-Balken.

### 2.3 „Den Agenten zuschauen“

**Ist-Zustand (harte Kritik):**
- 3 isolierte Textboxen: `#kern-log` (100 Zeilen, neueste oben), `#audit` (invers, kein Filter),
  `#memory` (invers). Keine Farbcodierung, kein „gerade läuft“-Zustand, nichts kumuliert.
- Der Agent „arbeitet“ unsichtbar: Status-Zeile hin oder her — es gibt **keine Beobachtung**.

**Exemplar:**
- Rechte Spalte mit Tabs: **Arbeit** (Tasks mit Spinner ✓ !) · **Audit-Log** (Filter-Chips
  alle/llm/task/guard/session) · **Gedächtnis**.
- Chat spiegelt Aktivität (Typing-Punkte, „denkt …“ im Header).

**Lücke (Ziel #3 wird vom Exemplar NICHT vollständig abgedeckt):**
- Es gibt **keinen dedizierten Live-Bereich** „Was macht der Agent gerade?“ — Audit-Log ist
  Historie, nicht Gegenwart.

**Urteil:** ✅ Tabs + Filter-Chips übernehmen. ✅ **Neu: Tab „Zuschauen“ (Default!)** mit
„Gerade“-Karte (aktive Aktion + Executor + Modell + Laufzeit, live) + **chronologischem
Ereignis-Feed** (Auto-Scroll, farbcodiert). Datenquellen **existieren bereits**:
`Agent`-Callbacks (`onStatus`!), `ModelPool.onEvent`, `KernSupervisor.onTick`, Reset-Flow —
es fehlt nur die geordnete, kumulative Darstellung (s. §3.3, §5).

### 2.4 Style (der Kern von „lass uns den style anpassen“)

**Ist-Zustand (harte Kritik):**
- **Dokumenten-Layout**: `max-width: 820px`, heller Default-Look, `color-scheme: light dark`
  (unbekannte Zielumgebung!), Standard-Formular-Controls, kein App-Frame, Seite scrollt.
- Keine Design-Tokens, keine Typo-Hierarchie, keine Mono-Ziffern, keine Motion.
- Zustände als Emoji-Glyphen in Fließtext („○ ◌ ● ⚠“) statt als Komponenten.
- Für ein **Dashboard, das man beim Agenten-Anblicken aufhat**, ist die Dokument-Form die
  falsche Bühne: zu viel Weißraum-Rauschen, zu wenig Dauerinformation oben (Session, VRAM).

**Exemplar:**
- **App-Frame**: `100vh` + `overflow:hidden`, Topbar 56 px (Brand · Tags · Session · VRAM-Bar ·
  Aktionen), 3-Spalten-Grid `360px | minmax(420px,1fr) | 420px`, 14 px Karten mit
  Uppercase-Headern, rechte Slots, Chips, Tabs mit Zählern.
- **Design-Tokens** (`:root`): `--bg:#0a0c10 · --panel:#11151c · --panel2:#161b24 ·
  --line:#222a36 · --txt:#e6eaf2 · --mut:#8b95a7 · --acc:#4da3ff · --acc2:#8b7bff ·
  --ok:#3ddc97 · --warn:#ffb454 · --err:#ff6b6b` + `--mono`.
- Accent-Gradiente (blau→lila) für primäre Buttons/User-Bubbles; LED mit Glow;
  Pills mit Punkt; Scrollbar-Styling; Animationen `pulse / slide (Shine) / spin`.

**Urteil:** ✅ Design-DNA **1:1** übernehmen (Tokens + Karten-System + Topbar + 3-Spalten +
Komponenten). **Dunkel als Standard** (Local-First-Desktop-Tool, lange Sitzungen, GPU-Last).
⚠️ Abweichungen: echte AAMS-Daten anzeigen (Task-**Tree**, Memory-`kind`/`tags`, Session-**Title**),
**DEGRADED**-State, **Zuschauen**-Tab, `min-width:1200px` dokumentieren, Chips/Tabs als
echte `<button>` (Accessibilität).

### 2.5 Architektur (Code)

**Ist-Zustand (harte Kritik):**
- `src/ui/app.ts`: 7 Render-Funktionen + `wire()` mit ~12 verstreuten Listeners; `prompt/confirm/alert`;
  `innerHTML` überall; `#status`-Zeile als **Bus** (eigene `setProgress()`-Kopie in `app.ts` **und** `main.ts`).
- `src/main.ts`: ~100-Zeilen `onEvent`-Switch, der Audit + Rendering + Status **vermischt** —
  jedes neue Ereignis = Änderung im Switch.
- Rendering = imperativ, zustandslos, schwer testbar (DOM-IDs als Vertrag).

**Exemplar:**
- `window.WGA` = **Adapter-API**: Anzeige-Funktionen (`progress/ready/unloaded/error/log/task/
  memory/context/session/say`) + **Hooks** (`onSend/onLoad/onUnload/onLoop/onStep/onReset/
  onExport/onImport`). Die UI weiß nichts vom Agenten; der Agent nichts vom DOM.
  Der echte Agent implementiert nur die Hooks (Kommentar im File: „hier an echten Agenten
  anbinden“).

**Urteil:** ✅ **Das stärkste Muster des Exemplars.** Ziel: typisierte `src/ui/api.ts`
(WGA-Interface + DOM-Implementierung); `main.ts` wird zum **dünnen Event-Router**
(Pool/Agent/KERN/Reset → WGA); `wire()` wird aufgeteilt in Controls + Chat.
⚠️ `window.WGA`-Global → in der TS-App **modulbasiert + typisiert** (Window-Bridge nur
optional, z. B. für Console-Debug).

## 3. Design-Spezifikation (die Migration — konkret)

### 3.1 Layout (Ziel-Zustand)

```
+----------------------------------------------------------------------------+
| TOP (56px): ✱ webgpu-agent · local-first/WebGPU/AAMS · Session id+title+   |
|           status (mono) ·········· [VRAM-Budget: 2 Segmente | x / 4096 MB] |
+-------------------+--------------------------------+------------------------+
| 360px (links)     | 1fr (Mitte)                    | 420px (rechts)         |
| ① MODELL-POOL     | CHAT (einziger Textkanal)      | Tabs: Zuschauen·Arbeit |
|   • Wächter-Karte |   • msgs (user/agent/sys)      |   ·Audit·Gedächtnis    |
|   • Planer-Karte  |   • Chips (Schnellprompts)     |                        |
| ② KERN-LOOP       |   • Compose (textarea + send)  | [Zuschauen]            |
|   • ▶/■ + LED     |                                |   „Gerade“-Karte       |
|   • Kontext-Balken|                                |   Ereignis-Feed (live) |
| ③ SESSION         |                                | [Arbeit]               |
|   • Export/Import |                                |   Task-TREE (eingerückt)|
|   • ↺ Reset (dng) |                                | [Audit] Filter-Chips   |
|                   |                                | [Gedächtnis] kind+tags |
+-------------------+--------------------------------+------------------------+
```

- Grid: `grid-template-rows: 56px 1fr` · `grid-template-columns: 360px minmax(420px,1fr) 420px`
  · `gap:14px` · `height:100vh; overflow:hidden` (wie Exemplar).
- **Chat = einziger Textkanal**: „+ Aufgabe planen“ (2× `prompt()`) **verschwindet** →
  Chip „Plane: …“ + Freitext. **Kein „Erwartete Teilaufgaben“-Input mehr** (User-Entscheidung):
  die Anzahl der Teilaufgaben **bestimmt der Planer** aus der Aufgabe; der Wächter fragt
  **was zu tun ist / was die neue Aufgabe ist** — daraufhin beginnt der Chat (§3.4).
- Rechte Spalte: **4 Tabs, „Zuschauen“ = Default** (Ziel #3).

### 3.2 Design-Tokens & Komponenten (1:1 aus dem Exemplar)

Tokens: s. §2.4 (`--bg … --err`, `--mono`). Komponenten (klassennah aus dem Exemplar,
ergänzt um die echten States):

| Komponente | States / Details |
|---|---|
| `.card` | 14 px Radius, 1 px `--line`, H2 12 px Uppercase + rechter Slot |
| `.btn` / `.btn.pri` / `.btn.dng` / `.btn.sm` | pri = Gradient `#2c6fd1→#5a4fd8`; dng = `--err` |
| `.pill` | `idle/loading/ready/error` + **`degraded` (neu, `--warn`, Puls)** |
| `.led` | `on` = `--ok` + Glow (KERN-Loop) |
| `.chip` / `.tab` | Chips = Schnellprompts + Log-Filter; Tabs mit Zähler `.n` |
| `.model` | Rollen-Karte: `.mh` (Rolle+Modus+Pille), `.sel`, `.load`, `.steps` (4 Stufen), `.pct` (groß), `.pbar` (Shine), `.stats` (3), `.raw` |
| `.vbar` | **2 Segmente** `.w` (`--ok`) / `.p` (`--acc2`) in der Topbar |
| `.m.user/.m.agent/.m.sys` | user: Gradient `#25508f→#3d3a99`, rechts; agent: Panel + `.who`-Zeile + Badge (`.badge.w` Wächter / `.badge.p` Planer); sys: zentriert, gestrichelt |
| `.typing` | 3 Punkte, `pulse` (Delays .2/.4 s) |
| `.task` | `.ic`-Icon: Spinner (`.run`) / ✓ (`.done`) / ! (`.err`) — + **`[data-depth]`-Einrückung (neu: Task-Tree!)** |
| `.log` | Zeit (mono, `#586377`) + Key (farbpro-Kategorie) + Msg; Kategorien: `llm`=`--acc`, `session`=`--acc2`, `guard`=`--warn`, `task`=`--ok`, `error`=`--err` |
| `.mem` | `.k` (Kind-Badge: decision/fact/note/skill) + `.v` (mono) + `.tags` (neu) |
| `.live-now` (neu) | „Gerade“-Karte: Aktion + Executor + Modell + Laufzeit (mono, tickend) |
| Animationen | `pulse` · `slide` (Shine) · `spin` |
| Scrollbar | 10 px, `#232c3a`-Thumb |

→ CSS nach **`src/ui/theme.css`** (Vite-Import in `main.ts`), nicht inline in `index.html`.

### 3.3 Komponentenspezifikation (Daten → Anzeige)

**Modell-Karte (Wächter / Planer)**
- Kopf: Rolle (700) + Modus (`resident` / `on-demand`) + Pille:
  `nicht geladen | lädt … | bereit | Fehler | ⚠ DEGRADED (Wächter übernimmt)`
- Select (Katalog mit ≈MB, `src/llm/catalog.ts`) + `▶ Laden` + `■`
- Lade-Bereich (bei loading/ready): **Stufen** (Download/Cache/Shader/Bereit,
  `stageFromText()` gegen WebLLM-0.2.86-Texte, Fallback = %) · **%** (26 px) ·
  „Modell · ≈ X MB“ · Balken (Shine) · Stats: **Geladen MB | Tempo MB/s | Dauer|Restzeit** ·
  Raw-Zeile (echter Progress-Text, 1 Zeile + `title`-Tooltip)
- Quelle: `ModelPool.getProgress()` + `PoolStatus` (`src/llm/pool.ts:60-71`)

**VRAM-Balken (Topbar)**
- 2 Segmente: Wächter `status().waechter.vramMB` (grün) + Planer `status().planer.vramMB` (lila);
  Breite = MB / `status().vram.budgetMB` (4096); Label „x / 4096 MB“ (mono).

**Chat (Mitte)**
- Header: „Chat“ + rechts Zustand: `bereit | denkt … | lädt … | Fehler`
- Nachrichten: `user` (rechts, Gradient) · `agent` (links, `.who` „Agent“ + Badge
  **Wächter**/**Planer**) · `sys` (zentriert, gestrichelt — für Events: laden/bereit/
  Plan erstellt/Reset)
- Typing-Indikator beim Warten; Auto-Scroll (sauber: `scrollTo`, nicht `scrollTop=1e9`)
- Chips: „Was ist dein aktueller Stand?“ · „Plane: Fasse die letzten Logs zusammen.“ ·
  „Prüfe das Gedächtnis auf Widersprüche.“
- Compose: textarea (Enter=Senden, Shift+Enter=Zeilenumbruch) + „Senden ➤“
- **Gegenfrage = Agent-Nachricht mit Wächter-Badge** (Ziel #1, s. §3.4)

**Tab „Zuschauen“ (rechts, Default)**
- **„Gerade“-Karte**: aktuelle Aktion (z. B. `ausführt: T2 „Entwurf schreiben“`) +
  Executor (`Planer · Llama-3.2-3B`) + Laufzeit (mono, tickt) + Spinner; idle:
  „bereit — warte auf Aufgabe“
- **Ereignis-Feed** (chronologisch, Auto-Scroll, max 500): farbcodiert
  `llm`/`task`/`guard`/`session`/`error` + Zeitstempel (mono)
- Quellen (alle **existieren schon**): `Agent`-Callbacks (`onStatus`), `ModelPool.onEvent`,
  `KernSupervisor.onTick`, Reset-Flow, `pushAudit()`

**Tab „Arbeit“**: Task-**Tree** (Wurzel + Kinder, **eingerückt** — echte Daten haben
`parentId`, Exemplar hat nur flache Liste!) mit Status-Icon (Spinner/✓/!), Rollen-Badge,
`result` (kollabiert, auf Klick ausklappen)

**Tab „Audit“**: Audit-Log (echt: `actor/action/target/note`) + Filter-Chips
(alle/llm/plan/task/guard/session)

**Tab „Gedächtnis“**: Memory-Einträge (echt: **`kind`-Badge** decision/fact/note/skill +
**`tags`** + Zeitstempel + Content)

**KERN-Karte (links)**: `▶ Loop starten` / `■ Stoppen` + LED + `läuft/gestoppt` +
Kontext-Balken (`tokens/limit`, Farbe ok→warn→err bei 65/85 %) + Flush-Zeile bei
Tokenwächter-Trigger (`tokenwatcher.flush`)

**Session-Karte (links)**: `⬇ JSON-Export` · `⬆ Import` · `↺ Gedächtnis zurücksetzen` (danger) —
**Reset behält die echte Semantik**: Confirm → KERN-Stop → **Safety-Export** →
`resetSession()` (Rollback bei Fehler) → Render (das `confirm()+Demo` des Exemplars reicht **nicht**)

### 3.4 Agent: `chat()` (neu — Ziel #1)

```ts
// src/agent/agent.ts (neu)
type ChatReply = { text: string; badge: "waechter" | "planer"; action?: "plan" | "step" };
chat(text: string): Promise<ChatReply>
```

- **Intent-Klassifikation (deterministisch, regex — keine freie Konversation):**
  | Intent | Erkennung | Verhalten |
  |---|---|---|
  | `status` | „Stand?“, „Status“, „was läuft?“ | **Template-Antwort aus AAMS-B** (Tasks, Modelle, VRAM) — deterministisch, 0 LLM-Tokens · bei offenen Tasks: „Sag beginne“ |
  | `ausfuehrung` | „beginne“, „start“, „ok“, „weiter“, „los“ … | **`runAll()`** — alle offenen Tasks nacheinander (nur 1 Loop zur Zeit, Cap 20, Stopp ohne Fortschritt) |
  | `task` | „Plane …“, „Mach …“, „Erledige …“ (oder Text > 80 Zeichen) | → `plan(goal)` — **Anzahl Teilaufgaben = Planer-Entscheidung** — **danach automatisch `runAll()`** (autonomer Loop, idee.md §3B) |
  | `frage` | Sonstiges | **Planer** antwortet (on-demand, danach entladen); DEGRADED → Wächter |
  **Reihenfolge:** `ausfuehrung` VOR `task` („mach es“ = starten, nicht neu planen).
- **Harte Regel (VRAM + Zuverlässigkeit):** Der Wächter ist der **Zuverlässige, nicht der Kluge**
  (`observe/waechter-vorschlag.md`) → **Chat-Aufmacher:** er fragt aktiv nach der neuen Aufgabe —
  daraufhin beginnt der Chat (User-Entscheidung 2026-10-16). **Fragen beantwortet der Planer**
  („der ist etwas schlauner“ — User 2026-10-16), on-demand + entladen danach (VRAM frei);
  die **Executor-Regel** bleibt unverändert (Teilaufgabe→Planer, Wurzel→Wächter).
- **Beobachtbar:** jede Chat-Runde → Audit `chat.user` / `chat.reply` (Intent + Modell + Tokens)
  → Feed im „Zuschauen“-Tab.
- Fallback: Wächter nicht geladen → Chat antwortet mit klarer sys-Zeile
  („Wächter nicht geladen — lade … oder starte über Modell-Pool“) und lädt auf Wunsch.

### 3.5 API: Adapter-Pattern (aus dem Exemplar, typisiert)

```ts
// src/ui/api.ts (neu) — UI ↔ Agent-Trennung, wie im Exemplar, aber modulbasiert + typisiert
interface WGA {
  // Anzeige (UI ← Daten)
  progress(role: RoleId, p: PoolProgress, model?: CatalogModel): void;
  ready(role: RoleId, model?: CatalogModel): void;
  unloaded(role: RoleId): void;
  error(role: RoleId, msg: string): void;
  log(kind: "llm" | "task" | "guard" | "session" | "error", name: string, msg: string): void;
  task(id: string, patch: Partial<AAMSTask> & { depth?: number }): void;
  memory(items: MemoryEntry[]): void;
  context(used: number, max: number, threshold?: number): void;
  session(id: string, title: string, state: string): void;
  say(role: "user" | "agent" | "sys", text: string, badge?: "waechter" | "planer"): void;
  // Hooks (UI → Agent) — vom echten Agenten gesetzt (main.ts)
  onSend: ((text: string) => void) | null;
  onLoad: ((role: RoleId) => void) | null;
  onUnload: ((role: RoleId) => void) | null;
  onLoop: ((on: boolean) => void) | null;
  onStep: (() => void) | null;
  onReset: (() => void) | null;
  onExport: (() => void) | null;
  onImport: ((file: File) => void) | null;
}
```

- `main.ts` = **Event-Router** (ersetzt den ~100-Zeilen-Switch + `setProgress`):
  `pool.onEvent → WGA.progress/ready/unloaded/error/log` ·
  `agent (onStatus/chat/plan/runStep) → WGA.say/log/task` ·
  `kern.onTick → WGA.context/log` · Reset-Flow → `WGA.say(sys)+log`.
- **Demo-Modus: WEG** (User-Entscheidung 2026-10-16) — nur echte Agent-Daten. Ohne WebGPU
  zeigt die UI einen klaren Fehler-Status (keine Simulation).

## 4. Was NICHT übernommen wird (harte Kritik am Exemplar)

| # | Lücke im Exemplar | Maßnahme |
|---|---|---|
| 1 | **Demo statt echten Agenten** (im File selbst: „nur Simulation — ersetzt keinen echten Agenten“) | echte Daten aus AAMS-B/Pool/Agent/KERN (§5) |
| 2 | **Kein DEGRADED-State** (Planer nicht ladbar → Wächter übernimmt) | Pille `degraded` (`--warn`) ergänzen |
| 3 | **Keine Tokenwächter-Semantik** (nur statischer Kontext-Balken) | KERN-Card mit Threshold + Flush-Zeile behalten |
| 4 | **Flache Task-Liste** | Task-**Tree** (parentId) mit Einrückung |
| 5 | **Flaches Gedächtnis** (k/v) | echte `kind` (decision/fact/note/skill) + `tags` + ts |
| 6 | **Import ohne Validierung** (bloßes `JSON.parse`) | echte `parseJSON()`-Schema-Prüfung behalten |
| 7 | **Reset ohne Safety** (confirm → sofort weg) | echten Flow behalten: Safety-Export + Rollback |
| 8 | **Stufen-Erkennung per Regex** (fragil bei WebLLM-Updates) | `stageFromText()` isoliert + Ground-Truth 0.2.86 + %-Fallback |
| 9 | **`min-width:1200px`** (kein Tablet/Mobile) | akzeptabel (Local-First-Desktop) → dokumentieren |
| 10 | **Chips als `span`+onclick** | echte `<button>` + `aria-*` (Accessibility) |
| 11 | **`window.WGA`-Global** | modulbasiert + typisiert (Window-Bridge nur optional) |
| 12 | **Kein „Maschine“-Panel (WH-002) / kein Benchmark** | Out-of-scope hier; Layout muss Platz lassen (offene Frage 6) |

## 5. Mapping (echte Daten → UI) — alles schon vorhanden

| WGA-Aufruf | Echte Quelle (besteht) |
|---|---|
| `progress/ready/unloaded/error` | `ModelPool.onEvent` (`main.ts:62-130`) + `pool.getProgress()` |
| `context` | `KernSupervisor.onTick` → `KernTickInfo` (`tokens/limit/threshold/flushed`) |
| `log` | `pushAudit()` — `llm.*`→`llm` · `plan.*`→`task` · `tokenwatcher.*`→`guard` · `session.*`/`pool.*`→`session` |
| `task` | `doc.session.tasks` (**Tree** via `parentId`) |
| `memory` | `doc.session.memory` (`kind` + `tags` + `ts`) |
| `session` | `doc.session.id/title/status` |
| `say` | Chat (neu) + `Agent.onStatus` |
| `onSend` | `Agent.chat()` (**neu**, §3.4) |
| `onLoad/onUnload` | `pool.loadWaechter()/ensurePlanner()/unloadWaechter()/unloadPlanner()` |
| `onLoop` | `kern.start()/stop()` |
| `onStep` | `agent.runStep()` |
| `onReset` | echter Reset-Flow (`wire()` in `app.ts:225-251`) |
| `onExport/onImport` | `downloadJSON()` / `parseJSON()` (`src/aams/io.ts`) |

## 6. Implementierungs-Plan — ✅ umgesetzt (2026-10-16)

| Datei | Änderung | Status |
|---|---|---|
| `src/ui/theme.css` (neu) | Tokens + Komponenten + Animationen (Exemplar-Basis, ergänzt um `degraded`, Task-Tree, `.live-now`) | ✅ |
| `src/ui/api.ts` (neu) | `WGA`-Klasse (typisiert, modulbasiert) + DOM-Implementierung (alle Render-Funktionen) + `kindFromAction()` | ✅ |
| `src/ui/wire.ts` (neu) | Controls (Pool/KERN/Session) + Chat + Tabs + Filter — nur Hooks, keine Agent-Logik | ✅ |
| `src/ui/app.ts` | **gelöscht** (in `api.ts`/`wire.ts` aufgegangen; Referenzen in `reset.ts`-Kommentar korrigiert) | ✅ |
| `src/agent/agent.ts` | **neu: `chat(text)`** (Intent status/task/frage + Wächter-Frage „neue Aufgabe“ + `plan(goal)`) + `statusReply()`-Template + Audit `chat.*` | ✅ |
| `src/main.ts` | Event-Router → WGA (Pool/Agent/KERN/Reset/Import) + Chat-Aufmacher; `setProgress`/`#status`-Zeile weg | ✅ |
| `src/llm/pool.ts` | `stageFromText()` (isoliert, testbar, Ground-Truth WebLLM 0.2.86) | ✅ |
| `index.html` | neuer App-Frame (Topbar + 3 Spalten + 4 Tabs + Chat); `<script type="module" src="/src/main.ts">` bleibt | ✅ |

**Verifikation (automatisiert):** `npm run typecheck` ✅ · `npm run build` ✅ (Chunk-Warnung = WebLLM-Lib, war schon da) ·
Dev-Server-Rauchtest ✅ (Page + theme.css + WGA werden served). **Browser-Checkliste §8 steht noch aus (User).**

## 7. Offene Fragen

1. ✅ **Entschlossen (User, 2026-10-16):** Die Teilaufgaben **arbeitet der Planer aus der Aufgabe
   heraus** (starkes Modell, stück für stück verstanden) — **kein „erwartete Teilaufgaben“-Input**
   mehr (der 2. `prompt()` fällt komplett weg). Der Wächter fragt **was zu tun ist / was die neue
   Aufgabe ist** — daraufhin beginnt der Chat.
2. ✅ **Entschlossen (User, 2026-10-16):** Demo-Modus **weglassen** — nur echte Agent-Daten.
7. ✅ **Entschlossen (User, 2026-10-16, nach Browser-Test):** „ok beginne“ startete nichts
   (Intent `frage` → Wächter plauderte nur) → **neues Intent `ausfuehrung`** (Kommandos „beginne“/
   „start“/„ok“ … → `runAll()`). Und: nach `plan()` läuft die **Ausführung automatisch** an
   (autonomer Loop) — „nachdem der Planer durch ist, gibt es nichts, was den Prozess wirklich
   startet und laufen lässt“.
8. ✅ **Entschlossen (User, 2026-10-16, nach Browser-Test):** **Fragen im Chat antwortet der
   Planer** („der ist wohl etwas schlauner“) — on-demand geladen, danach entladen (VRAM frei).
   Wächter antwortet nur im DEGRADED-Fall.
3. **„Gerade“-Karte:** im „Zuschauen“-Tab oder permanente Streifen unter der Topbar?
   → Neigung: **Tab (Default)** — Topbar bleibt für Dauer-Infos (Session/VRAM).
4. **`min-width:1200px`:** beibehalten (Desktop) oder responsiver Fallback (Spalten stapeln)?
   → Neigung: **behalten + dokumentieren** (Local-First-Desktop-Tool).
5. **KERN-Loop** bleibt „mechanisch/simuliert“ in der UI oder ersetzt der echte Agent-Loop ihn?
   → Neigung: **behalten** (KERN = explorativ, WP-KERN-PROTO) — „Zuschauen“-Feed zeigt beides.
6. **„Maschine“-Panel (WH-002):** 4. Karte links oder 5. Tab rechts? → bei der WH-002-Einheit.

## 8. Verification

**Automatisiert (2026-10-16):**
- [x] `npm run typecheck` ✅
- [x] `npm run build` ✅ (Chunk-Warnung = WebLLM-Lib, war schon da)
- [x] Dev-Server-Rauchtest: Page + theme.css + WGA-Modul werden served
- [x] **Kein** `prompt()`/`alert()` mehr im UI-Code (nur `confirm()` beim Reset — erlaubt, destruktiv)

**Browser-Checkliste (steht noch aus — User):**
- [ ] Topbar: Brand + Session (id + **Title** + Status, mono) + **VRAM-Bar mit 2 Segmenten** + „x / 4096 MB“
- [ ] Links: Wächter-/Planer-Karten — **echtes Laden** (Stufen/%/Tempo/Restzeit/Raw), Pille-States
      **inkl. DEGRADED**, Entladen → Segment leert sich
- [ ] KERN-Karte: Start/Stop + LED + Kontext-Balken + Flush-Zeile bei Trigger
- [ ] Session: Export/Import/Reset mit **echtem Flow** (Safety-Export + Rollback, `confirm` bleibt)
- [ ] Chat (Mitte): **Chat-Aufmacher** = Wächter fragt nach der neuen Aufgabe; User-Nachricht →
      Typing → Agent-Antwort **mit Badge**; „Plane: …“ → Planer zerlegt (Anzahl = Planer) →
      Task in „Arbeit“; Chips klickbar; Enter/Shift+Enter korrekt
- [ ] „Zuschauen“: „Gerade“-Karte während `runStep()` (Aktion + Modell + Laufzeit tickt);
      Feed farbcodiert + Auto-Scroll; nach Reset: sys-Zeile
- [ ] „Arbeit“: Task-**Tree** (eingerückt), Status, Resultate; „Audit“: Filter-Chips;
      „Gedächtnis“: `kind` + `tags`

## 9. next_steps

- [x] Fragen 1–2 vom User entschieden (Planer bestimmt Teilaufgaben · Demo-Modus weg)
- [x] Umsetzung Einheit 1 + 2 (s. §6) — typecheck + build ✅
- [ ] **User:** Browser-Checkliste §8 abhaken (`npm run dev` → http://localhost:5173)
- [ ] danach: WP schließen (→ `closed/`) + README-Status aktualisieren (Steht bereits, siehe README)
- [ ] Folge-Einheit (WH-002, **nicht** dieses WP): „Maschine“-Panel + Benchmark-Seite + erster L1-Testlauf
