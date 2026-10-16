/**
 * Agent-Core (WH-001 §1 Scope: Single-Agent, autonomer Loop; idee.md §3B).
 *
 * Zerlegt Eingaben in Sub-Tasks (Task-Queue) und führt sie im autonomen Loop aus.
 * Nutzt **nur** die LLMEngine-Interface (austauschbar) + den AAMS(B)-Store.
 *
 * WH-001 §3: Der Agent ist AAMS-nativ — sein Gedächtnis/Task-Modell IST AAMS(B).
 */
import type { AAMSDocument } from "../aams/schema";
import { aamsStore } from "../aams/store";
import type { LLMEngine } from "../llm/engine";
import { TaskQueue } from "./task-queue";

export interface AgentCallbacks {
  onStatus?: (msg: string) => void;
  onTaskChange?: () => void;
}

export class Agent {
  private queue: TaskQueue;

  constructor(
    private doc: AAMSDocument,
    private llm: LLMEngine,
    private cb: AgentCallbacks = {}
  ) {
    this.queue = new TaskQueue(doc.session);
  }

  /**
   * Komplexe Eingabe in Sub-Tasks zerlegen (idee.md §3B).
   * Scaffold: legt eine Wurzel + Platzhalter-Sub-Task an.
   * → Nächster Schritt: LLM-gestützte Zerlegung (Planer) via `this.llm`.
   */
  async plan(goal: string): Promise<void> {
    this.cb.onStatus?.(`Zerlege Aufgabe: ${goal}`);
    const root = this.queue.create(goal, "Wurzel-Aufgabe (Ziel)");
    this.queue.create("Sub-Task (Platzhalter)", "Wird durch LLM-Plan ersetzt", root.id);
    await this.persist();
    this.cb.onTaskChange?.();
  }

  /**
   * Autonomer Loop — ein Schritt (idee.md §3B): nächste Aufgabe ausführen, speichern.
   * Scaffold: markiert die nächste Aufgabe als done (Platzhalter-Ergebnis).
   * → Nächster Schritt: echte Ausführung (LLM-Aufruf / Tool / Helfer-Modell).
   */
  async runStep(): Promise<void> {
    const next = this.queue.next();
    if (!next) {
      this.cb.onStatus?.("Keine offenen Aufgaben mehr — Session abgeschlossen.");
      return;
    }
    this.queue.setStatus(next.id, "in_progress");
    const result = `Ausgeführt: ${next.title} (Scaffold-Platzhalter)`;
    this.queue.setStatus(next.id, "done", result);
    await this.persist();
    this.cb.onTaskChange?.();
    this.cb.onStatus?.(`Fertig: ${next.title}`);
  }

  /** LLM-Readiness prüfen (z.B. vor der echten Ausführung). */
  async ensureLLM(): Promise<void> {
    if (!this.llm.ready()) {
      this.cb.onStatus?.(`Lade LLM: ${this.llm.modelName} (WebGPU/WebLLM)…`);
      await this.llm.load();
      this.cb.onStatus?.(`LLM bereit: ${this.llm.modelName}`);
    }
  }

  private async persist(): Promise<void> {
    this.doc.session.updatedAt = Date.now();
    await aamsStore.save(this.doc);
  }
}
