/**
 * WGA (WP-UI-DASH §3.5) — typisierte Adapter-Schnittstelle zwischen UI und Agent.
 *
 * Das Muster stammt aus dem Exemplar (`window.WGA`, observe/client-index-example.html) —
 * hier als modulbasierte, typisierte Klasse:
 *   - **Anzeige** (UI ← Daten): progress/ready/unloaded/error/degraded/log/tasks/
 *     memory/context/loop/session/say/typing/chatState/live
 *   - **Hooks** (UI → Agent): onSend/onLoad/onUnload/onLoop/onStep/onReset/onExport/onImport
 * → Die UI weiß nichts vom Agenten, der Agent nichts vom DOM.
 *
 * Ergänzungen gegenüber dem Exemplar (WP-UI-DASH §4):
 *   - DEGRADED-State (echte Pool-Semantik)
 *   - Task-**Tree** (parentId → Einrückung) statt flacher Liste
 *   - Memory mit `kind` + `tags` (echtes AAMS-Schema)
 *   - „Zuschauen“: „Gerade“-Karte (live) + chronologischer Feed
 */
import type { AAMSTask, AuditEntry, MemoryEntry } from "../aams/schema";
import { extractHTMLArtifact, type HTMLArtifact } from "../artifact/extract";
import { downloadArtifact } from "../artifact/io";
import { catalogModel } from "../llm/catalog";
import type { PoolProgress, RoleId } from "../llm/pool";
import { stageFromText } from "../llm/pool";

export type LogKind = "llm" | "task" | "guard" | "session" | "error";
export type LogFilter = LogKind | "all";
export type Badge = "waechter" | "planer";

type RoleStateId = "idle" | "loading" | "ready" | "error" | "degraded";

interface RoleView {
  status: RoleStateId;
  label: string;
  mb: number;
  pct: number;
  stage: number;
  time: number;
  raw: string;
}

interface LogEntry {
  kind: LogKind;
  name: string;
  msg: string;
  t: string;
}

const STAGES = ["Download", "Cache", "Shader", "Bereit"];

function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;"
  );
}
const hhmmss = (): string => new Date().toLocaleTimeString("de-DE");

/** Audit-Aktion → Feed-Kategorie (WP-UI-DASH §5 Mapping). */
export function kindFromAction(action: string): LogKind {
  if (action.startsWith("llm")) return "llm";
  if (
    action.startsWith("plan") ||
    action.startsWith("task") ||
    action.startsWith("chat") ||
    action.startsWith("artifact") // V4: Artefakt-Aktionen = Task-Kontext
  )
    return "task";
  if (action.startsWith("tokenwatcher") || action.startsWith("loop") || action.startsWith("kern")) return "guard";
  return "session"; // session.*, pool.*, sonst
}

export class WGA {
  // Hooks (UI → Agent) — von main.ts gesetzt (der echte Agent implementiert sie).
  onSend: ((text: string) => void) | null = null;
  onLoad: ((role: RoleId) => void) | null = null;
  onUnload: ((role: RoleId) => void) | null = null;
  onLoop: ((on: boolean) => void) | null = null;
  onStep: (() => void) | null = null;
  onReset: (() => void) | null = null;
  onExport: (() => void) | null = null;
  onImport: ((file: File) => void) | null = null;
  /** V4 Schritt 1: User-Aktion auf ein Artefakt (→ Audit in main.ts). */
  onArtifact: ((taskId: string, action: "preview" | "download") => void) | null = null;

  private roles: Record<RoleId, RoleView> = {
    waechter: { status: "idle", label: "", mb: 0, pct: 0, stage: 0, time: 0, raw: "" },
    planer: { status: "idle", label: "", mb: 0, pct: 0, stage: 0, time: 0, raw: "" },
  };
  private taskList: AAMSTask[] = [];
  private logs: LogEntry[] = [];
  private memList: MemoryEntry[] = [];
  private filter: LogFilter = "all";
  private budget = 4096;
  private liveSince: number | null = null;
  private liveTimer: ReturnType<typeof setInterval> | null = null;
  /** V4: aktuell in der Vorschau gezeigtes Artefakt (für Download aus dem Modal). */
  private pvArtifact: HTMLArtifact | null = null;
  private pvTaskId: string | null = null;

  constructor(public readonly root: HTMLElement) {
    // V4 Schritt 1: Artefakt-Buttons im Tab „Arbeit" (Delegation —
    // renderTasks() ersetzt innerHTML, einzelne Listeners wären verloren).
    this.root.addEventListener("click", (e) => this.onArtifactClick(e));
    this.el("pvClose")?.addEventListener("click", () => this.closePreview());
    this.el("pvDownload")?.addEventListener("click", () => this.pvDownload());
  }

  // ---------- Modell-Pool (Rollen-Karten + VRAM-Bar) ----------

  progress(role: RoleId, p: PoolProgress, mb: number): void {
    const r = this.roles[role];
    r.status = "loading";
    r.mb = mb;
    r.pct = Math.min(100, (p.progress || 0) * 100);
    r.time = p.timeElapsed || r.time;
    r.raw = p.text || "";
    r.stage = stageFromText(p.text, r.pct);
    if (r.pct >= 100) r.stage = 3;
    if (p.model) r.label = catalogModel(p.model)?.label ?? p.model;
    this.renderRole(role);
    this.renderVram();
  }

  ready(role: RoleId, label?: string): void {
    const r = this.roles[role];
    r.status = "ready";
    r.pct = 100;
    r.stage = 3;
    if (label) r.label = label;
    this.renderRole(role);
    this.renderVram();
  }

  unloaded(role: RoleId): void {
    const r = this.roles[role];
    r.status = "idle";
    r.pct = 0;
    r.stage = 0;
    r.time = 0;
    r.raw = "";
    this.renderRole(role);
    this.renderVram();
  }

  error(role: RoleId, msg: string): void {
    const r = this.roles[role];
    r.status = "error";
    r.raw = msg;
    this.renderRole(role);
    this.renderVram();
  }

  /** DEGRADED (WP-UI-DASH §4.2): Planer nicht ladbar → Wächter übernimmt (gekennzeichnet). */
  degraded(role: RoleId, msg: string): void {
    const r = this.roles[role];
    r.status = "degraded";
    r.raw = msg;
    this.renderRole(role);
  }

  vramBudget(n: number): void {
    this.budget = n;
    this.renderVram();
  }

  // ---------- Log: „Zuschauen“-Feed + Audit-Tab (ein Store, zwei Ansichten) ----------

  log(kind: LogKind, name: string, msg: string): void {
    this.logs.push({ kind, name, msg, t: hhmmss() });
    if (this.logs.length > 1000) this.logs.shift();
    this.renderFeed();
    this.renderAudit();
  }

  /** Historie aus AAMS-Audit laden (Boot/Import/Reset). */
  seedLogs(entries: AuditEntry[]): void {
    this.logs = entries.map((a) => ({
      kind: kindFromAction(a.action),
      name: a.action,
      msg: a.note ?? a.target ?? "",
      t: new Date(a.ts).toLocaleTimeString("de-DE"),
    }));
    this.renderFeed();
    this.renderAudit();
  }

  setFilter(f: LogFilter): void {
    this.filter = f;
    this.renderAudit();
  }

  // ---------- Arbeit (Task-Tree) ----------

  tasks(list: AAMSTask[]): void {
    this.taskList = list.slice();
    this.renderTasks();
  }

  // ---------- Gedächtnis ----------

  memory(items: MemoryEntry[]): void {
    this.memList = items.slice();
    this.renderMem();
  }

  // ---------- KERN (Context + Loop) ----------

  context(used: number, max: number, threshold = 0.8): void {
    const txt = this.el("ctxTxt");
    if (txt) {
      txt.textContent = max
        ? `${used} / ${max} Tokens (${Math.round((used / max) * 100)}% · Schwelle ${Math.round(threshold * 100)}%)`
        : `${used} Tokens`;
    }
    const bar = this.el("ctxBar");
    if (bar) {
      const pct = max ? Math.min(100, (used / max) * 100) : 0;
      bar.style.width = `${pct}%`;
      bar.style.background = pct > 85 ? "var(--err)" : pct > 65 ? "var(--warn)" : "var(--ok)";
    }
  }

  loop(on: boolean): void {
    this.el("led")?.classList.toggle("on", on);
    const txt = this.el("loopTxt");
    if (txt) txt.textContent = on ? "läuft" : "gestoppt";
  }

  // ---------- Session (Topbar) ----------

  session(id: string, title: string, state: string): void {
    const el = this.el("sess");
    if (el) el.innerHTML = `Session ${esc(id)} · ${esc(title)} · <b>${esc(state)}</b>`;
  }

  // ---------- Chat (einziger Textkanal) ----------

  say(role: "user" | "agent" | "sys", text: string, badge?: Badge): void {
    const msgs = this.el("msgs");
    if (!msgs) return;
    const d = document.createElement("div");
    d.className = "m " + role;
    if (role === "agent") {
      const b = badge ? `<span class="badge ${badge === "planer" ? "p" : "w"}">${badge === "planer" ? "Planer" : "Wächter"}</span>` : "";
      d.innerHTML = `<div class="who">Agent ${b}</div>` + esc(text);
    } else {
      d.textContent = text;
    }
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  typing(on: boolean): void {
    const msgs = this.el("msgs");
    if (!msgs) return;
    msgs.querySelector(".typing-wrap")?.remove();
    if (on) {
      const d = document.createElement("div");
      d.className = "m agent typing-wrap";
      d.innerHTML = `<span class="typing"><i></i><i></i><i></i></span>`;
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
    }
  }

  chatState(text: string): void {
    const el = this.el("chatState");
    if (el) el.textContent = text;
  }

  // ---------- „Zuschauen“: „Gerade“-Karte (live) ----------

  live(action: string | null, detail = ""): void {
    this.liveSince = action ? Date.now() : null;
    this.el("liveNow")?.classList.toggle("busy", action !== null);
    const act = this.el("lnAction");
    if (act) act.textContent = action ?? "bereit";
    const det = this.el("lnDetail");
    if (det) det.textContent = action ? detail : "warte auf Aufgabe";
    const tim = this.el("lnTime");
    if (tim) tim.textContent = "";
    if (this.liveTimer) {
      clearInterval(this.liveTimer);
      this.liveTimer = null;
    }
    if (action) {
      this.liveTimer = setInterval(() => {
        if (!this.liveSince) return;
        const s = Math.round((Date.now() - this.liveSince) / 1000);
        const t = this.el("lnTime");
        if (t) t.textContent = `${s} s`;
      }, 1000);
    }
  }

  // ---------- V4 Schritt 1: Artefakt (HTML-Vorschau + Download) ----------

  private onArtifactClick(e: Event): void {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-art]");
    if (!btn) return;
    const task = this.taskList.find((t) => t.id === btn.dataset.art);
    const art = task ? extractHTMLArtifact(task.result) : null;
    if (!task || !art) return;
    if (btn.dataset.artact === "download") {
      downloadArtifact(art);
      this.onArtifact?.(task.id, "download");
    } else {
      this.showPreview(task.id, task.title, art);
      this.onArtifact?.(task.id, "preview");
    }
  }

  /** Öffnet die Sandbox-Vorschau (iframe `sandbox="allow-scripts"`, ohne `allow-same-origin`). */
  showPreview(taskId: string, taskTitle: string, art: HTMLArtifact): void {
    this.pvArtifact = art;
    this.pvTaskId = taskId;
    const t = this.el("pvTitle");
    if (t) t.textContent = `${art.filename} — ${taskTitle}`;
    const frame = this.el("pvFrame") as HTMLIFrameElement | null;
    if (frame) frame.srcdoc = art.html;
    this.el("pvModal")?.classList.add("open");
  }

  /** Schließt die Vorschau + stoppt den Sandbox-Code (srcdoc leeren). */
  closePreview(): void {
    this.el("pvModal")?.classList.remove("open");
    const frame = this.el("pvFrame") as HTMLIFrameElement | null;
    if (frame) frame.srcdoc = "";
    this.pvArtifact = null;
    this.pvTaskId = null;
  }

  private pvDownload(): void {
    if (this.pvArtifact) {
      downloadArtifact(this.pvArtifact);
      if (this.pvTaskId) this.onArtifact?.(this.pvTaskId, "download");
    }
  }

  // ---------- intern: DOM ----------

  private el(id: string): HTMLElement | null {
    return this.root.querySelector("#" + id);
  }

  private renderRole(role: RoleId): void {
    const r = this.roles[role];
    const card = this.el("m-" + role);
    const pill = this.el("pill-" + role);
    const box = this.el("load-" + role);
    if (!card || !pill || !box) return;
    card.classList.toggle("loading", r.status === "loading");
    card.classList.toggle("ready", r.status === "ready");
    card.classList.toggle("error", r.status === "error");
    card.classList.toggle("degraded", r.status === "degraded");
    pill.className =
      "pill " +
      ({ idle: "idle", loading: "loading", ready: "ready", error: "error", degraded: "degraded" }[r.status]);
    pill.textContent =
      {
        idle: "nicht geladen",
        loading: "lädt …",
        ready: "bereit",
        error: "Fehler",
        degraded: "⚠ DEGRADED",
      }[r.status];

    if (r.status === "idle") {
      box.innerHTML = "";
      return;
    }
    if (r.status === "error") {
      box.innerHTML = `<div class="raw err" title="${esc(r.raw)}">${esc(r.raw)}</div>`;
      return;
    }
    if (r.status === "degraded") {
      box.innerHTML = `<div class="raw warn">Wächter übernimmt: ${esc(r.raw || "Planer nicht ladbar")}</div>`;
      return;
    }

    const fetched = (r.mb * r.pct) / 100;
    const speed = r.time > 0 ? fetched / r.time : 0; // Ø MB/s
    const eta = r.status === "loading" && speed > 0 ? Math.max(0, Math.round((r.mb - fetched) / speed)) : null;
    const steps = STAGES.map((s, i) => {
      const c =
        r.status === "ready" || i < r.stage ? "done" : i === r.stage && r.status === "loading" ? "act" : "";
      return `<div class="step ${c}"><i></i>${s}</div>`;
    }).join("");
    box.innerHTML = `
      <div class="steps">${steps}</div>
      <div class="pct"><b>${Math.round(r.pct)}%</b><span>${esc(r.label)} · ≈ ${Math.round(r.mb)} MB</span></div>
      <div class="pbar"><i style="width:${r.pct}%"></i></div>
      <div class="stats" style="margin-top:10px">
        <div class="stat"><small>Geladen</small><b>${Math.round(fetched)} MB</b></div>
        <div class="stat"><small>Tempo</small><b>${speed ? speed.toFixed(1) + " MB/s" : "–"}</b></div>
        <div class="stat"><small>${r.status === "ready" ? "Dauer" : "Restzeit"}</small><b>${
          r.status === "ready" ? Math.round(r.time) + " s" : eta != null ? "~" + eta + " s" : "–"
        }</b></div>
      </div>
      ${r.raw ? `<div class="raw" title="${esc(r.raw)}">${esc(r.raw)}</div>` : ""}`;
  }

  private renderVram(): void {
    const seg = (role: RoleId): number => {
      const r = this.roles[role];
      if (r.status === "ready") return r.mb;
      if (r.status === "loading") return (r.mb * r.pct) / 100;
      return 0;
    };
    const w = seg("waechter");
    const p = seg("planer");
    const vW = this.el("vW");
    const vP = this.el("vP");
    const vramTxt = this.el("vramTxt");
    if (vW) vW.style.width = `${(w / this.budget) * 100}%`;
    if (vP) vP.style.width = `${(p / this.budget) * 100}%`;
    if (vramTxt) vramTxt.textContent = `${Math.round(w + p)} / ${this.budget} MB`;
  }

  private renderFeed(): void {
    const feed = this.el("feed");
    if (feed) {
      const stick = feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 40;
      const list = this.logs.slice(-200);
      feed.innerHTML = list
        .map(
          (l) =>
            `<div class="log ${l.kind}"><time>${l.t}</time><span class="k">${esc(l.name)}</span><span class="msg">${esc(l.msg)}</span></div>`
        )
        .join("");
      if (stick) feed.scrollTop = feed.scrollHeight;
    }
    const n = this.el("nLive");
    if (n) n.textContent = String(this.logs.length);
  }

  private renderAudit(): void {
    const box = this.el("logs");
    if (box) {
      const stick = box.scrollTop + box.clientHeight >= box.scrollHeight - 40;
      const list = this.logs
        .filter((l) => this.filter === "all" || l.kind === this.filter)
        .slice()
        .reverse();
      box.innerHTML = list.length
        ? list
            .map(
              (l) =>
                `<div class="log ${l.kind}"><time>${l.t}</time><span class="k">${esc(l.name)}</span><span class="msg">${esc(l.msg)}</span></div>`
            )
            .join("")
        : '<div class="empty">Keine Einträge.</div>';
      if (stick) box.scrollTop = box.scrollHeight;
    }
    const n = this.el("nAudit");
    if (n) n.textContent = String(this.logs.length);
  }

  private renderTasks(): void {
    const box = this.el("tasks");
    const n = this.el("nWork");
    if (n) n.textContent = String(this.taskList.length);
    if (!box) return;
    if (!this.taskList.length) {
      box.innerHTML = '<div class="empty">Noch keine Aufgaben.<br>Schreib im Chat oder starte den Loop.</div>';
      return;
    }
    // Task-Tree: Wurzeln (parentId=null) + Kinder, eingeordnet über parentId (WP-UI-DASH §4.4).
    const byParent = new Map<string | null, AAMSTask[]>();
    for (const t of this.taskList) {
      const arr = byParent.get(t.parentId) ?? [];
      arr.push(t);
      byParent.set(t.parentId, arr);
    }
    const walk = (parent: string | null, depth: number): string => {
      const arr = (byParent.get(parent) ?? []).slice().sort((a, b) => a.createdAt - b.createdAt);
      return arr
        .map((t) => {
          const cls = t.status === "done" ? "done" : t.status === "in_progress" ? "run" : "wait";
          const icon = t.status === "done" ? "✓" : t.status === "in_progress" ? "" : "○";
          // Executor-Regel (BENCH-IMPL): Teilaufgabe → Planer · Wurzel → Wächter.
          const badge = t.parentId
            ? '<span class="badge p">Planer</span>'
            : '<span class="badge w">Wächter</span>';
          // V4 Schritt 1: Artefakt-Buttons (abgeleitet aus dem Ergebnis, null = keine).
          const art = extractHTMLArtifact(t.result);
          const artRow = art
            ? `<div class="art">` +
              `<button class="btn sm" data-art="${esc(t.id)}" data-artact="preview">👁 Vorschau</button>` +
              `<button class="btn sm pri" data-art="${esc(t.id)}" data-artact="download">⬇ ${esc(art.filename)}</button>` +
              `</div>`
            : "";
          return (
            `<div class="task ${cls}" style="padding-left:${16 + depth * 18}px">` +
            `<div class="ic">${icon}</div>` +
            `<div><div class="t">${esc(t.title)}</div>` +
            (t.detail ? `<div class="s">${esc(t.detail)}</div>` : "") +
            (t.result ? `<div class="res">${esc(t.result)}</div>` : "") +
            artRow +
            `<div class="s">Executor: ${badge} · ${new Date(t.updatedAt).toLocaleTimeString("de-DE")}</div></div></div>` +
            walk(t.id, depth + 1)
          );
        })
        .join("");
    };
    box.innerHTML = walk(null, 0);
  }

  private renderMem(): void {
    const box = this.el("mem");
    const n = this.el("nMem");
    if (n) n.textContent = String(this.memList.length);
    if (!box) return;
    const list = this.memList.slice().reverse();
    box.innerHTML = list.length
      ? list
          .map(
            (m) =>
              `<div class="mem"><div class="mk"><span class="kind">${esc(m.kind)}</span>` +
              `<time>${new Date(m.ts).toLocaleTimeString("de-DE")}</time>` +
              (m.tags.length ? `<span class="tags">${m.tags.map((t) => `<i>${esc(t)}</i>`).join("")}</span>` : "") +
              `</div><div class="v">${esc(m.content)}</div></div>`
          )
          .join("")
      : '<div class="empty">Gedächtnis ist leer.</div>';
  }
}
