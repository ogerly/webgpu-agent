/**
 * KERN-Prototyp (explorativ): mechanischer Supervisor-Loop + Tokenwächter.
 *
 * - Loop = mechanischer Arbeitszyklus (läuft, wenn gestartet — „wenn was eingestellt ist").
 * - Jede Runde: ein Arbeitsschritt (simuliert) → verbraucht Context-Tokens.
 * - Tokenwächter prüft: Context fast voll? → sichert in AAMS-B (IndexedDB) + flush.
 *
 * WH-Referenz: WP-…-ARCH-WAEC (KERN, explorativ).
 * Prototyp: kein LLM — simuliert Arbeit + Context, um die Mechanik zu beobachten.
 */
import type { AAMSDocument } from "../aams/schema";
import { aamsStore } from "../aams/store";
import { TokenWatcher, type ContextWindow } from "./context";

export interface KernTickInfo {
  step: number;
  tokens: number;
  limit: number;
  ratio: number;
  threshold: number;
  flushed: boolean;
  reason?: string;
}

export interface KernCallbacks {
  onTick?: (info: KernTickInfo) => void;
}

export class KernSupervisor {
  private ctx: ContextWindow = { tokens: 0, limit: 4096 };
  private step = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private watcher: TokenWatcher;

  constructor(
    private doc: AAMSDocument,
    private tickMs = 1500,
    private tokensPerStep = 600,
    private threshold = 0.8,
    private cb: KernCallbacks = {}
  ) {
    this.watcher = new TokenWatcher(this.ctx, this.threshold, (reason) => this.flush(reason));
  }

  get running(): boolean {
    return this.timer !== null;
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(this.tick, this.tickMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    void aamsStore.save(this.doc).catch(() => {});
  }

  /** Ein mechanischer Tick: Arbeit → Context → Tokenwächter-Check. */
  private tick = (): void => {
    this.step++;
    const now = Date.now();

    // 1) Arbeit (simuliert): ein Arbeitsschritt, verbraucht Context.
    const title = `KERN-Loop Schritt ${this.step}`;
    this.doc.session.tasks.push({
      id: `t_kern_${now}`,
      parentId: null,
      title,
      status: "done",
      result: "Arbeitsschritt (simuliert)",
      createdAt: now,
      updatedAt: now,
    });
    this.doc.session.auditLog.push({
      id: `a_step_${now}`,
      ts: now,
      actor: "agent",
      action: "loop.step",
      target: title,
      note: "mechanischer Loop-Schritt (simuliert)",
    });
    this.watcher.consume(this.tokensPerStep);

    // 2) Tokenwächter (mechanisch): Context fast voll? → sichern + flush.
    const res = this.watcher.check();

    this.cb.onTick?.({
      step: this.step,
      tokens: this.ctx.tokens,
      limit: this.ctx.limit,
      ratio: this.watcher.ratio(),
      threshold: this.threshold,
      flushed: res.triggered,
      reason: res.reason,
    });
  };

  /** Tokenwächter-Flush: aktiven Context in AAMS-B sichern + persistieren. */
  private flush(reason: string): void {
    const now = Date.now();
    this.doc.session.memory.push({
      id: `m_flush_${now}`,
      ts: now,
      kind: "note",
      content: `Tokenwächter-Flush: ${reason}`,
      tags: ["tokenwaechter", "flush"],
    });
    this.doc.session.auditLog.push({
      id: `a_flush_${now}`,
      ts: now,
      actor: "agent",
      action: "tokenwatcher.flush",
      note: reason,
    });
    void aamsStore.save(this.doc).catch(() => {});
  }
}
