/**
 * Agent-Core (WH-001 §1 Scope: Single-Agent, autonomer Loop; idee.md §3B).
 *
 * Zerlegt Eingaben in Sub-Tasks (Task-Queue) und führt sie im autonomen Loop aus.
 * Nutzt **nur** das LLMEngine-Interface via **Modell-Pool** (austauschbar) + den AAMS(B)-Store.
 *
 * WP-BENCH-IMPL (ersetzt die Scaffold-Platzhalter):
 *   - **plan(goal, expectedSubtasks?):**
 *       L1 (1 Teilaufgabe, explizit) → **Wächter allein** (Planer wird nicht geladen).
 *       L2+ → **Planer** liefert kompaktes Planer-JSON → Task-Tree in AAMS-B →
 *       Planer wird **entladen** (VRAM frei). `verstaendnis` → memory (decision).
 *   - **runStep():** Executor-Regel (abgeleitet, ohne Schema-Änderung):
 *       Teilaufgabe (`parentId ≠ null`) → **Planer** (on-demand) ·
 *       Wurzel ohne offene Kinder → **Wächter**.
 *     Ergebnis → `task.result` · Audit `llm.execute` mit **echten Token-Zahlen**.
 *     Fehler → Task zurück auf `pending` + Audit `llm.error` (Loop kann weiter).
 *   - Wurzel schließt sich auto (alle Kinder done → `task.root_done`).
 *
 * WP-UI-DASH (Chat = einziger Dialogkanal):
 *   - **chat(text):** Intent-gesteuert:
 *       status → Template aus AAMS (0 LLM-Tokens) ·
 *       **ausfuehrung** („beginne"/„start"/„ok" …) → `runAll()` (alle offenen Tasks ausführen) ·
 *       task → `plan(goal)`, Anzahl Teilaufgaben = Planer-Entscheidung ·
 *       frage → **Planer** beantwortet (on-demand, danach entladen — User-Entscheidung 2026-10-16:
 *         „der ist wohl etwas schlauner"); sonst Wächter-Frage „was ist die neue Aufgabe?".
 *     Audit: `chat.user` / `chat.reply` / `chat.error`.
 */
import type { AAMSDocument, MemoryEntry } from "../aams/schema";
import { aamsStore } from "../aams/store";
import { extractHTMLArtifact } from "../artifact/extract";
import { catalogModel } from "../llm/catalog";
import type { LLMEngine } from "../llm/engine";
import type { ModelPool } from "../llm/pool";
import { TaskQueue } from "./task-queue";

export interface AgentCallbacks {
  onStatus?: (msg: string) => void;
  onTaskChange?: () => void;
  /** Ausführung (Chat „beginne") gestartet/beendet — „Zuschauen“-Karte (WP-UI-DASH). */
  onWork?: (working: boolean) => void;
  /**
   * Live-Zeilen **im Chatfenster** (Ziel #1: Workflow + Ergebnis sichtbar, nicht
   * nur im Zuschauen-Tab): Schrittstart, ✓-Ergebnis je Task, Plan + Abschluss.
   */
  onChat?: (text: string, badge?: ChatReply["badge"]) => void;
}

/** Chat-Antwort (WP-UI-DASH §3.4): Text + Rolle, die gesprochen hat (Badge im Chat). */
export interface ChatReply {
  text: string;
  badge: "waechter" | "planer";
}

/** Ergebnis-Zeile für den Chat: 1 Zeile, Kommas zusammengefasst, begrenzt. */
function excerpt(s: string, max = 220): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max).trimEnd() + "…" : t;
}

/** Intent-Hinweise (deterministische Klassifikation — WP-UI-DASH §3.4). */
const STATUS_HINTS = /status|aktueller stand|^stand|fortschritt|was (läuft|laeuft)/;
/** „Loslegen“-Kommandos → Ausführung starten. */
const EXECUTE_HINTS =
  /\b(ok|okay|beginne|beginnen|starte?|starten|los|weiter|go|fahre? fort|fahre? weiter|mach es|ausf[uü]hren|durchf[uü]hren)\b/;
/** „Aufgabe“-Kommandos → neue Planung. */
const TASK_HINTS = /^(plane|mache?|erledige|schreibe|fasse|prüfe|pruefe|erstelle|baue|recherchiere)\b/;

/** Audit-Eintrag (geteilt: Agent + Pool-Events in `main.ts`). */
export function pushAudit(doc: AAMSDocument, action: string, target?: string, note?: string): void {
  doc.session.auditLog.push({
    id: `a_${action.replace(/\./g, "_")}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ts: Date.now(),
    actor: "agent",
    action,
    target,
    note,
  });
}

interface PlannerPlan {
  verstaendnis?: string;
  teilaufgaben?: { id?: string; beschreibung?: string; prioritaet?: number }[];
  vorentscheidungen?: string[];
  risiken_oder_offen?: string[];
}

/** Fixer Planer-Prompt (Reproduzierbarkeit, s. WP-…-ARCH-WAEC §4b). */
function plannerPrompt(goal: string, expected?: number): string {
  return [
    "Du bist der Planer. Zerlege die Aufgabe in Teilaufgaben.",
    expected ? `Erwarte genau ${expected} Teilaufgaben.` : "Bestimme die passende Anzahl.",
    "Antworte NUR mit kompaktem JSON (kein Markdown, kein Extra-Text):",
    '{"verstaendnis":"…","teilaufgaben":[{"id":"T1","beschreibung":"…","prioritaet":1}],"vorentscheidungen":["…"],"risiken_oder_offen":["…"]}',
    `Aufgabe: ${goal}`,
  ].join("\n");
}

function executePrompt(goal: string | null, task: { title: string; detail?: string }): string {
  return [
    "Erledige die Teilaufgabe vollständig und praktisch nutzbar.",
    goal ? `Gesamtaufgabe: ${goal}` : null,
    `Teilaufgabe: ${task.title}`,
    task.detail ? `Details: ${task.detail}` : null,
    "Regeln: Die Antwort IST das Ergebnis (kompakt, direkt nutzbar). Bei Code: vollständiger Code, keine Erklärungen.",
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
}

export class Agent {
  private queue: TaskQueue;
  /** Ausführung läuft gerade (nur ein Loop zur Zeit — kein Racing). */
  private working = false;

  constructor(
    private doc: AAMSDocument,
    private pool: ModelPool,
    private cb: AgentCallbacks = {}
  ) {
    this.queue = new TaskQueue(doc.session);
  }

  /**
   * Aufgabe zerlegen (idee.md §3B) — **echt** (WP-BENCH-IMPL):
   * L1 → Wächter (kein Planer-Load) · L2+ → Planer-JSON → Task-Tree → Planer entladen.
   * @param goal Ziel/Aufgabe (Szenario-Text beim Benchmark).
   * @param expectedSubtasks 1 = einfache Aufgabe (Wächter) · 2+ = zerlegen · undefined = Planer bestimmt.
   */
  async plan(goal: string, expectedSubtasks?: number): Promise<void> {
    // L1: Wächter allein — Planer wird NICHT geladen (spart VRAM + Zeit).
    if (expectedSubtasks === 1) {
      const w = await this.pool.ensureWaechter();
      const root = this.queue.create(goal, "Einfache Aufgabe (Executor: Wächter)");
      pushAudit(this.doc, "plan.created", root.id, `simple · model=${w.modelName} · Executor=Wächter`);
      this.cb.onStatus?.(`Aufgabe geplant (Wächter): ${goal}`);
      await this.persist();
      this.cb.onTaskChange?.();
      return;
    }

    // L2+: Planer zerlegt → Planer-JSON → AAMS-B → Planer entladen (VRAM frei).
    const planner = await this.pool.ensurePlanner();
    const degraded = this.pool.status().degraded;
    this.cb.onStatus?.(`Planer bereit: ${planner.modelName}${degraded ? " (DEGRADED)" : ""}`);

    let parsed: PlannerPlan | null = null;
    let lastRaw = "";
    for (let attempt = 1; attempt <= 2 && !parsed; attempt++) {
      const prompt =
        attempt === 1
          ? plannerPrompt(goal, expectedSubtasks)
          : plannerPrompt(goal, expectedSubtasks) + "\n\nWICHTIG: Antworte NUR mit dem JSON-Objekt.";
      const res = await planner.chat([{ role: "user", content: prompt }]);
      lastRaw = res.content;
      parsed = this.tryParsePlan(res.content);
    }

    if (!parsed || !parsed.teilaufgaben?.length) {
      // Nichts halbfertig: Fehler ist in Audit + Status sichtbar.
      pushAudit(this.doc, "plan.error", undefined, `Planer-JSON unlesbar nach 2 Versuchen: ${lastRaw.slice(0, 200)}`);
      this.cb.onStatus?.("Planer-JSON unlesbar — Abbruch (Audit: plan.error). Planer wird entladen.");
      await this.pool.unloadPlanner();
      await this.persist();
      this.cb.onTaskChange?.();
      return;
    }

    const root = this.queue.create(goal, parsed.verstaendnis ?? "Ziel");
    // Ausführungsorte (Priorität aufsteigend) — für Queue UND Chat-Zeile identisch.
    const ordered = parsed.teilaufgaben
      .slice()
      .sort((a, b) => (a.prioritaet ?? 99) - (b.prioritaet ?? 99));
    ordered.forEach((t) => this.queue.create(t.beschreibung ?? "Teilaufgabe", undefined, root.id));

    if (parsed.verstaendnis) {
      this.memory("decision", `Plan: ${parsed.verstaendnis}`, ["planer", "plan"]);
    }
    pushAudit(
      this.doc,
      "plan.created",
      root.id,
      `model=${planner.modelName} · ${ordered.length} Teilaufgaben${degraded ? " · DEGRADED" : ""}`
    );

    await this.pool.unloadPlanner(); // VRAM frei (BENCH-PLAN §5 Regel 2)

    // Workflow im Chatfenster (Ziel #1): der Plan ist direkt sichtbar.
    this.cb.onChat?.(
      `Plan: ${ordered.length} Teilaufgaben — ` +
        ordered.map((t, i) => `${i + 1}) ${t.beschreibung ?? "…"}`).join(" · "),
      "planer"
    );
    this.cb.onStatus?.(`Plan fertig: ${ordered.length} Teilaufgaben · Planer entladen (VRAM frei).`);
    await this.persist();
    this.cb.onTaskChange?.();
  }

  /**
   * Einen Schritt ausführen (idee.md §3B) — **echt** (WP-BENCH-IMPL):
   * Executor-Regel: Teilaufgabe → Planer (on-demand) · Wurzel → Wächter.
   */
  async runStep(): Promise<void> {
    const task = this.queue.nextExecutable();
    if (!task) {
      this.cb.onStatus?.("Keine offenen Aufgaben mehr — Session abgeschlossen.");
      return;
    }

    const root = task.parentId
      ? this.doc.session.tasks.find((t) => t.id === task.parentId) ?? null
      : null;
    if (root && root.status === "pending") this.queue.setStatus(root.id, "in_progress");

    this.queue.setStatus(task.id, "in_progress");
    const executor: LLMEngine =
      task.parentId !== null ? await this.pool.ensurePlanner() : await this.pool.ensureWaechter();

    // Workflow im Chatfenster (Ziel #1): Schrittstart + Position (Fortschritt sichtbar).
    // Teilaufgabe → „i/n" über die Geschwister (stabil) · Einzel-Wurzel → „1/1".
    const badge: ChatReply["badge"] = task.parentId !== null ? "planer" : "waechter";
    let pos = 1;
    let total = 1;
    if (task.parentId) {
      const siblings = this.doc.session.tasks.filter((t) => t.parentId === task.parentId);
      total = siblings.length;
      pos = siblings.findIndex((t) => t.id === task.id) + 1;
    } else {
      const open = this.doc.session.tasks.filter((t) => t.status !== "done");
      total = open.length;
      pos = open.indexOf(task) + 1;
    }
    this.cb.onChat?.(`⏳ ${pos}/${total} · ${task.title} …`, badge);

    try {
      const t0 = Date.now();
      const goal = root ? root.title : null;
      const res = await executor.chat([{ role: "user", content: executePrompt(goal, task) }]);
      this.queue.setStatus(task.id, "done", res.content);
      const tok =
        res.usage?.totalTokens ??
        (res.usage ? (res.usage.promptTokens ?? 0) + (res.usage.completionTokens ?? 0) : undefined);
      const secs = Math.round((Date.now() - t0) / 1000);
      pushAudit(this.doc, "llm.execute", task.id, `model=${executor.modelName} · ${secs} s${tok !== undefined ? ` · tokens=${tok}` : ""}`);
      // Ergebnis-Zeile im Chat (kompakt; Volltext im Tab „Arbeit").
      this.cb.onChat?.(`✓ ${task.title} — ${excerpt(res.content)}`, badge);
      // V4 Schritt 1: Artefakt (aus dem Ergebnis abgeleitet, kein Schema-Eingriff)
      // → Vorschau + Download im Tab „Arbeit" (WP-…-ARTIFACT).
      const artifact = extractHTMLArtifact(res.content);
      if (artifact) {
        pushAudit(this.doc, "artifact.ready", task.id, `html · ${artifact.filename} · ${artifact.bytes} B`);
        this.cb.onChat?.(`📦 ${artifact.filename} bereit — Vorschau & Download im Tab „Arbeit"`, badge);
      }
      this.cb.onStatus?.(`Fertig: ${task.title} (${executor.modelName}${tok !== undefined ? `, ${tok} Tokens` : ""}).`);
    } catch (err) {
      // Fehler-sicher: Task zurück auf pending (Loop kann weiter) + Audit.
      this.queue.setStatus(task.id, "pending");
      pushAudit(this.doc, "llm.error", task.id, (err as Error).message);
      this.cb.onChat?.(`✗ ${task.title} — ${(err as Error).message}`, badge);
      this.cb.onStatus?.(`Fehler bei „${task.title}": ${(err as Error).message}`);
    }

    // Wurzel auto-abschließen: alle Kinder done.
    if (root && this.queue.allChildrenDone(root.id)) {
      const n = this.queue.children(root.id).length;
      this.queue.setStatus(root.id, "done", `Ziel erreicht: ${n}/${n} Teilaufgaben`);
      pushAudit(this.doc, "task.root_done", root.id, `${n}/${n}`);
    }

    await this.persist();
    this.cb.onTaskChange?.();
  }

  /**
   * Chat (WP-UI-DASH §3.4, Ziel #1) — der **einzige** Dialogkanal des Users.
   *
   * Intent-Klassifikation (deterministisch, 0.5B-tauglich):
   *   - **status**       → Template-Antwort aus AAMS-B (deterministisch, 0 LLM-Tokens)
   *   - **ausfuehrung**  → „beginne"/„start"/„ok" … → `runAll()` (alle offenen Tasks
   *                        werden nacheinander ausgeführt — User-Beobachtung 2026-10-16:
   *                        „nachdem der Planer durch ist, gibt es nichts, was den Prozess
   *                        wirklich startet und laufen lässt")
   *   - **task**         → `plan(goal)` — **Anzahl der Teilaufgaben bestimmt der Planer**
   *                        (WP-UI-DASH §7.1) → danach **automatisch Ausführung**
   *                        (autonomer Loop, idee.md §3B: Planen → Ausführen → weiter)
   *   - **frage**        → **Planer** beantwortet (on-demand, danach entladen —
   *                        User-Entscheidung 2026-10-16: „der ist wohl etwas schlauner");
   *                        DEGRADED → Wächter antwortet.
   *
   * Beobachtbar: `chat.user` / `chat.reply` / `chat.error` im Audit → „Zuschauen“-Feed.
   *
   * **Workflow im Chatfenster** (Ziel #1, User-Feedback 2026-10-16: „das Ende und der
   * Workflow im Chat leicht sichtbar, smart reicht"): `cb.onChat` bekommt —
   *   - nach `plan()`:  die Teilaufgaben-Liste,
   *   - je `runStep()`: „⏳ i/n · Title …" → „✓ Title — Ergebnis-Zeile" (bzw. „✗ …"),
   *   - nach `runAll()`: die Abschluss-Antwort (Fertig/Pausiert + Ergebnis je Task).
   */
  async chat(text: string): Promise<ChatReply> {
    const raw = text.trim();
    pushAudit(this.doc, "chat.user", undefined, raw.slice(0, 200));
    const lower = raw.toLowerCase();

    // 1) Status → Template aus AAMS-B (deterministisch, kein LLM nötig).
    if (STATUS_HINTS.test(lower)) {
      const reply = this.statusReply();
      pushAudit(this.doc, "chat.reply", undefined, "intent=status · Template (0 LLM-Tokens)");
      return { text: reply, badge: "waechter" };
    }

    // 2) Ausführung starten („ok beginne", „start", „weiter" …).
    if (EXECUTE_HINTS.test(lower)) {
      if (!this.hasOpenTasks()) {
        pushAudit(this.doc, "chat.reply", undefined, "intent=ausfuehrung · keine offenen Aufgaben");
        return {
          text: "Keine offenen Aufgaben. Was ist die neue Aufgabe? Beschreib kurz, was ich erledigen soll — ich plane und starte sie.",
          badge: "waechter",
        };
      }
      pushAudit(this.doc, "chat.reply", undefined, "intent=ausfuehrung · Ausführung gestartet");
      void this.runAll();
      return {
        text: "Alles klar — ich beginne jetzt. Du siehst jeden Schritt hier im Chat, am Ende bekommst du das Ergebnis.",
        badge: "waechter",
      };
    }

    // 3) Neue Aufgabe → Planer zerlegt → **danach läuft die Ausführung automatisch**.
    if (TASK_HINTS.test(lower) || raw.length > 80) {
      const short = raw.length > 120 ? raw.slice(0, 120) + "…" : raw;
      pushAudit(this.doc, "chat.reply", undefined, `intent=task · goal="${raw.slice(0, 120)}"`);
      void (async () => {
        await this.plan(raw); // Planer-JSON → Task-Tree → Planer entladen
        if (this.hasOpenTasks()) await this.runAll(); // → Ausführung (nichts wartet)
      })();
      return {
        text:
          `Aufgabe angenommen: „${short}“ — ich zerlege sie in Teilaufgaben (Planer) ` +
          "und starte danach die Ausführung. Jeder Schritt erscheint hier im Chat, am Ende das Ergebnis.",
        badge: "planer",
      };
    }

    // 4) Frage/Sonstiges → Planer antwortet (on-demand; danach VRAM frei).
    try {
      const planner = await this.pool.ensurePlanner();
      const degraded = !this.pool.planerReady(); // Wächter hat übernommen (DEGRADED)
      const res = await planner.chat(
        [
          {
            role: "user",
            content: [
              "Du bist der Planer — der kluge Assistent des Users.",
              "Antworte auf die Nachricht kurz, präzise und in Deutsch (max. 4 Sätze).",
              "Wenn die Nachricht eine Aufgabe zu sein scheint, beschreibe kurz, wie du sie umsetzen würdest — und bitte um das Kommando „beginne“.",
              "Wenn unklar ist, was der User will, stell eine kurze Gegenfrage.",
              `Nachricht: ${raw}`,
            ].join("\n"),
          },
        ],
        { temperature: 0.5, maxTokens: 250 }
      );
      const reply =
        res.content.trim() || "Was ist die neue Aufgabe? Beschreib kurz, was ich erledigen soll.";
      pushAudit(
        this.doc,
        "chat.reply",
        undefined,
        `intent=frage · model=${planner.modelName} · tokens=${res.usage?.totalTokens ?? "?"}${degraded ? " · DEGRADED" : ""}`
      );
      // VRAM frei (BENCH-Regel) — aber nicht, wenn gerade ausgeführt wird (sonst sofort Reload).
      if (!degraded && !this.working) await this.pool.unloadPlanner();
      return { text: reply, badge: degraded ? "waechter" : "planer" };
    } catch (err) {
      pushAudit(this.doc, "chat.error", undefined, (err as Error).message);
      return {
        text: `Das habe ich gerade nicht beantwortet (${(err as Error).message}). Was ist die neue Aufgabe?`,
        badge: "waechter",
      };
    }
  }

  /** True, wenn es offene Aufgaben gibt (pending/in_progress). */
  hasOpenTasks(): boolean {
    return this.doc.session.tasks.some((t) => t.status !== "done");
  }

  /**
   * Alle offenen Aufgaben ausführen (WP-UI-DASH §3.4 — „was den Prozess wirklich
   * startet und laufen lässt").
   *
   * Loop: `runStep()` bis nichts mehr auszuführen ist (Executor-Regel je Schritt:
   * Teilaufgabe → Planer · Wurzel → Wächter). Ergebnisse landen in `task.result`,
   * jeder Schritt im Audit (`llm.execute`/`llm.error`) + „Zuschauen“-Feed.
   *
   * Sicherheit: nur **ein** Ausführungs-Loop zur Zeit (kein Racing), Obergrenze
   * 20 Schritte + Stopp ohne Fortschritt (Fehler-Loop) → Zustand bleibt im Audit.
   *
   * @returns Anzahl ausgeführter Schritte.
   */
  async runAll(): Promise<number> {
    if (this.working) {
      this.cb.onStatus?.("Ausführung läuft bereits — ich kümmere mich drum.");
      return 0;
    }
    this.working = true;
    this.cb.onWork?.(true);
    // Snapshot: welche Tasks waren schon fertig? (für die Abschluss-Zeile im Chat)
    const doneBefore = new Set(
      this.doc.session.tasks.filter((t) => t.status === "done").map((t) => t.id)
    );
    let steps = 0;
    try {
      while (steps < 20) {
        const open = this.doc.session.tasks.filter((t) => t.status !== "done").length;
        if (open === 0) break;
        await this.runStep();
        steps++;
        const after = this.doc.session.tasks.filter((t) => t.status !== "done").length;
        if (after >= open) break; // kein Fortschritt (z. B. Fehler-Loop) → stoppen
      }
    } finally {
      this.working = false;
      this.cb.onWork?.(false);
    }
    const remaining = this.doc.session.tasks.filter((t) => t.status !== "done").length;
    this.cb.onStatus?.(
      remaining === 0
        ? `Ausführung abgeschlossen: ${steps} ${steps === 1 ? "Schritt" : "Schritte"}, alle Aufgaben erledigt.`
        : `Ausführung pausiert nach ${steps} ${steps === 1 ? "Schritt" : "Schritten"} — ${remaining} Aufgaben offen (Audit: llm.error prüfen).`
    );

    // **Ende im Chatfenster** (Ziel #1): echte Abschluss-Antwort mit Ergebnis je Task.
    if (steps > 0) {
      const fresh = this.doc.session.tasks
        .filter((t) => t.status === "done" && !doneBefore.has(t.id))
        .sort((a, b) => a.createdAt - b.createdAt);
      const lines: string[] = [
        remaining === 0
          ? `Fertig — alle ${fresh.length} Aufgabe${fresh.length === 1 ? "" : "n"} erledigt:`
          : `Pausiert nach ${steps} ${steps === 1 ? "Schritt" : "Schritten"} — ${remaining} Aufgabe${remaining === 1 ? "" : "n"} noch offen:`,
      ];
      for (const t of fresh) {
        lines.push(t.result ? `• ${t.title}: ${excerpt(t.result, 200)}` : `• ${t.title}`);
      }
      if (remaining > 0) {
        for (const t of this.doc.session.tasks.filter((x) => x.status !== "done")) {
          if (!fresh.some((f) => f.id === t.id)) lines.push(`• offen: ${t.title} (Audit: llm.error)`);
        }
      }
      if (remaining === 0 && fresh.some((t) => t.result)) lines.push("(Volltext je Teilaufgabe: Tab „Arbeit“)");
      this.cb.onChat?.(
        lines.join("\n"),
        fresh.some((t) => t.parentId !== null) ? "planer" : "waechter"
      );
    }
    return steps;
  }

  /** Status-Antwort als **Template** aus AAMS-B (deterministisch, keine LLM-Tokens). */
  private statusReply(): string {
    const s = this.doc.session;
    const st = this.pool.status();
    const open = s.tasks.filter((t) => t.status !== "done").length;
    const done = s.tasks.length - open;
    const wLabel = catalogModel(st.waechter.model)?.label ?? st.waechter.model;
    const pLabel = catalogModel(st.planer.model)?.label ?? st.planer.model;
    const lines = [
      `Session ${s.id} · ${s.title} · ${s.status}`,
      `Aufgaben: ${s.tasks.length} gesamt · ${open} offen · ${done} erledigt`,
      `Wächter: ${st.waechter.loaded ? `bereit (${wLabel})` : "nicht geladen"} · ${
        st.waechter.loaded ? Math.round(st.waechter.vramMB) + " MB VRAM" : "0 MB"
      }`,
      `Planer: ${
        st.planer.loaded
          ? `bereit (${pLabel})`
          : st.degraded
            ? "DEGRADED (Wächter übernimmt)"
            : "nicht geladen"
      } · ${st.planer.loaded ? Math.round(st.planer.vramMB) + " MB VRAM" : "0 MB"}`,
      `VRAM-Budget: ${Math.round(st.vram.loadedMB)} / ${st.vram.budgetMB} MB`,
    ];
    if (open > 0) lines.push(`→ Sag „beginne“, um die Ausführung zu starten.`);
    if (st.degraded) lines.push("Achtung: DEGRADED — Planer nicht ladbar, Wächter übernimmt Aufgaben.");
    return lines.join("\n");
  }

  /** Robustes Planer-JSON-Parsing (Code-Fences, umgebender Text). */
  private tryParsePlan(raw: string): PlannerPlan | null {
    if (!raw) return null;
    const text = raw.replace(/```json/gi, "```").replace(/```/g, "").trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      const obj: unknown = JSON.parse(text.slice(start, end + 1));
      if (obj && typeof obj === "object" && Array.isArray((obj as PlannerPlan).teilaufgaben)) {
        return obj as PlannerPlan;
      }
      return null;
    } catch {
      return null;
    }
  }

  private memory(kind: MemoryEntry["kind"], content: string, tags: string[]): void {
    const now = Date.now();
    this.doc.session.memory.push({
      id: `m_${now}_${Math.random().toString(36).slice(2, 6)}`,
      ts: now,
      kind,
      content,
      tags,
    });
  }

  private async persist(): Promise<void> {
    this.doc.session.updatedAt = Date.now();
    await aamsStore.save(this.doc);
  }
}
