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
 */
import type { AAMSDocument, MemoryEntry } from "../aams/schema";
import { aamsStore } from "../aams/store";
import type { LLMEngine } from "../llm/engine";
import type { ModelPool } from "../llm/pool";
import { TaskQueue } from "./task-queue";

export interface AgentCallbacks {
  onStatus?: (msg: string) => void;
  onTaskChange?: () => void;
}

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
    parsed.teilaufgaben
      .slice()
      .sort((a, b) => (a.prioritaet ?? 99) - (b.prioritaet ?? 99))
      .forEach((t) => this.queue.create(t.beschreibung ?? "Teilaufgabe", undefined, root.id));

    if (parsed.verstaendnis) {
      this.memory("decision", `Plan: ${parsed.verstaendnis}`, ["planer", "plan"]);
    }
    pushAudit(
      this.doc,
      "plan.created",
      root.id,
      `model=${planner.modelName} · ${parsed.teilaufgaben.length} Teilaufgaben${degraded ? " · DEGRADED" : ""}`
    );

    await this.pool.unloadPlanner(); // VRAM frei (BENCH-PLAN §5 Regel 2)
    this.cb.onStatus?.(
      `Plan fertig: ${parsed.teilaufgaben.length} Teilaufgaben · Planer entladen (VRAM frei).`
    );
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
      this.cb.onStatus?.(`Fertig: ${task.title} (${executor.modelName}${tok !== undefined ? `, ${tok} Tokens` : ""}).`);
    } catch (err) {
      // Fehler-sicher: Task zurück auf pending (Loop kann weiter) + Audit.
      this.queue.setStatus(task.id, "pending");
      pushAudit(this.doc, "llm.error", task.id, (err as Error).message);
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
