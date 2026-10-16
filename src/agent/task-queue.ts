/**
 * Task-Queue — Sub-Task-Tree (WH-001 §1 Scope; idee.md §3B).
 *
 * Zerlegt komplexe Eingaben in Teilaufgaben und verwaltet deren Status
 * (pending / in_progress / done). Spiegelt AAMS(A) WORKPAPER (Aufgaben) in AAMS(B).
 */
import type { AAMSTask, AAMSSession, TaskStatus } from "../aams/schema";

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export class TaskQueue {
  constructor(private session: AAMSSession) {}

  private all(): AAMSTask[] {
    return this.session.tasks;
  }

  /** Neue Aufgabe anlegen (Wurzel, wenn parentId = null). */
  create(title: string, detail?: string, parentId: string | null = null): AAMSTask {
    const now = Date.now();
    const task: AAMSTask = {
      id: uid("t"),
      parentId,
      title,
      detail,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    this.session.tasks.push(task);
    this.audit("task.created", task.id, title);
    return task;
  }

  /** Direkt-Kinder einer Aufgabe (parentId = null → Wurzel-Kinder). */
  children(parentId: string | null): AAMSTask[] {
    return this.all().filter((t) => t.parentId === parentId);
  }

  /** Status ändern (+ optional Ergebnis). */
  setStatus(id: string, status: TaskStatus, result?: string): AAMSTask | undefined {
    const t = this.all().find((x) => x.id === id);
    if (!t) return undefined;
    t.status = status;
    t.updatedAt = Date.now();
    if (result !== undefined) t.result = result;
    this.audit(`task.${status}`, t.id);
    return t;
  }

  /** Offene (pending) Aufgaben. */
  pending(): AAMSTask[] {
    return this.all().filter((t) => t.status === "pending");
  }

  /** Nächste auszuführende Aufgabe (FIFO über createdAt). */
  next(): AAMSTask | undefined {
    return this.pending().sort((a, b) => a.createdAt - b.createdAt)[0];
  }

  /** Offene (pending) Kinder einer Aufgabe. */
  pendingChildren(parentId: string): AAMSTask[] {
    return this.pending().filter((t) => t.parentId === parentId);
  }

  /**
   * Nächste **ausführbare** Aufgabe (WP-BENCH-IMPL): erste offene (FIFO), die
   * **keine offenen Kinder** hat. (Wurzel mit offenen Kindern = Container → überspringen.)
   */
  nextExecutable(): AAMSTask | undefined {
    const candidates = this.pending().sort((a, b) => a.createdAt - b.createdAt);
    return candidates.find((t) => this.pendingChildren(t.id).length === 0);
  }

  /** True, wenn die Aufgabe mindestens ein Kind hat und alle Kinder done sind. */
  allChildrenDone(id: string): boolean {
    const kids = this.children(id);
    return kids.length > 0 && kids.every((k) => k.status === "done");
  }

  private audit(action: string, target?: string, note?: string): void {
    this.session.auditLog.push({
      id: uid("a"),
      ts: Date.now(),
      actor: "agent",
      action,
      target,
      note,
    });
    this.session.updatedAt = Date.now();
  }
}
