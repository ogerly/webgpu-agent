/**
 * UI-Verdrahtung (KERN-Prototyp + Scaffold).
 * ① KERN-Loop + Tokenwächter · ② Session & Tasks · ③ Live AAMS-Gedächtnis.
 */
import type { AAMSDocument } from "../aams/schema";
import { downloadJSON, parseJSON } from "../aams/io";
import { resetSession } from "../aams/reset";
import type { Agent } from "../agent/agent";
import type { KernSupervisor, KernTickInfo } from "../kern/supervisor";

function escape(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;"
  );
}

// ② Session + Tasks
export function renderSession(app: HTMLElement, doc: AAMSDocument): void {
  const s = doc.session;
  const sessionEl = app.querySelector<HTMLElement>("#session-id");
  if (sessionEl) sessionEl.textContent = `${s.title} · ${s.id} · ${s.status}`;
  const tasksEl = app.querySelector<HTMLElement>("#tasks");
  if (!tasksEl) return;
  tasksEl.innerHTML = s.tasks.length
    ? "<ul>" +
      s.tasks
        .map((t) => `<li>${t.status === "done" ? "✅" : "⏳"} ${escape(t.title)}${t.result ? ` — <i>${escape(t.result)}</i>` : ""}</li>`)
        .join("") +
      "</ul>"
    : "<ul><li>(noch keine Aufgaben)</li></ul>";
}

// ③ Live-Gedächtnis
export function renderMemory(app: HTMLElement, doc: AAMSDocument): void {
  const el = app.querySelector<HTMLElement>("#memory");
  if (!el) return;
  const mem = [...doc.session.memory].reverse();
  el.innerHTML = mem.length
    ? mem.map((m) => `<div class="line"><small>${new Date(m.ts).toLocaleTimeString()}</small> ${escape(m.content)}</div>`).join("")
    : '<div class="line">— leer —</div>';
}

export function renderAudit(app: HTMLElement, doc: AAMSDocument): void {
  const el = app.querySelector<HTMLElement>("#audit");
  if (!el) return;
  const log = [...doc.session.auditLog].reverse();
  el.innerHTML = log.length
    ? log
        .map(
          (a) =>
            `<div class="line ${a.action.startsWith("tokenwatcher") ? "flush" : "step"}"><small>${new Date(a.ts).toLocaleTimeString()}</small> ${escape(a.action)}${a.note ? ` — ${escape(a.note)}` : ""}</div>`
        )
        .join("")
    : '<div class="line">— leer —</div>';
}

// ① KERN log + Context-Balken
export function renderKern(app: HTMLElement, info: KernTickInfo): void {
  const ctx = app.querySelector<HTMLElement>("#context");
  if (ctx) {
    ctx.textContent = `Context: ${info.tokens}/${info.limit} Tokens (${Math.round(info.ratio * 100)}%) · Schwellwert ${Math.round(info.threshold * 100)}%`;
  }
  const fill = app.querySelector<HTMLElement>("#ctx-fill");
  if (fill) fill.style.width = `${Math.min(100, Math.round(info.ratio * 100))}%`;
  const log = app.querySelector<HTMLElement>("#kern-log");
  if (!log) return;
  const cls = info.flushed ? "flush" : "step";
  const msg = info.flushed
    ? `⚡ Tokenwächter: ${info.reason} → in AAMS-B gesichert, Context geflusht`
    : `Schritt ${info.step}: ${info.tokens}/${info.limit} Tokens (${Math.round(info.ratio * 100)}%)`;
  log.insertAdjacentHTML("afterbegin", `<div class="line ${cls}">${escape(msg)}</div>`);
  while (log.children.length > 100) log.lastChild?.remove();
}

// ① KERN nach Reset: Context-Balken 0 + „zurückgesetzt"-Zeile im Log
export function renderKernReset(app: HTMLElement): void {
  const ctx = app.querySelector<HTMLElement>("#context");
  if (ctx) ctx.textContent = "Context: 0 Tokens (0%) — zurückgesetzt";
  const fill = app.querySelector<HTMLElement>("#ctx-fill");
  if (fill) fill.style.width = "0%";
  const log = app.querySelector<HTMLElement>("#kern-log");
  if (log) {
    log.innerHTML =
      '<div class="line flush">↺ Gedächtnis zurückgesetzt — Loop gestoppt, Context leer</div>';
  }
}

// Alle Controls verdrahten (einmalig)
export function wire(app: HTMLElement, doc: AAMSDocument, agent: Agent, kern: KernSupervisor): void {
  const renderAll = (): void => {
    renderSession(app, doc);
    renderMemory(app, doc);
    renderAudit(app, doc);
  };

  // ① KERN
  app.querySelector<HTMLButtonElement>("#kern-start")?.addEventListener("click", () => {
    kern.start();
    setProgress("KERN-Loop gestartet (mechanisch).");
  });
  app.querySelector<HTMLButtonElement>("#kern-stop")?.addEventListener("click", () => {
    kern.stop();
    setProgress("KERN-Loop gestoppt. Stand in AAMS-B (IndexedDB).");
  });

  // ② Session/Tasks
  app.querySelector<HTMLButtonElement>("#plan")?.addEventListener("click", async () => {
    const goal = prompt("Aufgabe / Ziel eingeben:");
    if (!goal) return;
    await agent.plan(goal);
    renderAll();
  });
  app.querySelector<HTMLButtonElement>("#run")?.addEventListener("click", async () => {
    await agent.runStep();
    renderAll();
  });
  app.querySelector<HTMLButtonElement>("#export")?.addEventListener("click", () => downloadJSON(doc));
  // ② Gedächtnis komplett & sauber zurücksetzen (WP-SESS-RESET):
  //    Bestätigung → KERN-Stop → Safety-Export → In-Place-Reset (+Rollback bei Fehler) → Render.
  app.querySelector<HTMLButtonElement>("#reset")?.addEventListener("click", () => {
    const s = doc.session;
    const ok = confirm(
      "Gedächtnis KOMPLETT zurücksetzen?\n\n" +
        `Wird gelöscht: ${s.tasks.length} Tasks · ${s.auditLog.length} Audit-Einträge · ` +
        `${s.memory.length} Memory-Einträge · ${s.knowledge.length} Wissen.\n` +
        "Der KERN-Loop wird gestoppt. Ein Safety-Export (JSON) wird automatisch ausgelöst."
    );
    if (!ok) return;
    (async () => {
      try {
        kern.reset(); // 1) Timer stoppen + tokens/step nullen (keine Waisen-Write)
        downloadJSON(doc, `aams-safety-${doc.session.id}.json`); // 2) Safety-Export (alter Zustand)
        const report = await resetSession(doc); // 3) In-Place-Reset + Persist (Rollback bei Fehler)
        renderKernReset(app); // 4) KERN-Panel neu
        renderAll(); // 5) Session/Tasks/Memory/Audit neu
        setProgress(
          `Gedächtnis zurückgesetzt → neue Session ${report.newId} ` +
            `(${report.previousCounts.tasks} Tasks + ${report.previousCounts.auditLog} Audit der alten Session exportiert).`
        );
      } catch (err) {
        // Rollback hat den alten Zustand wiederhergestellt → einfach neu rendern (kein „zurückgesetzt"!).
        renderAll();
        setProgress(`Fehler: ${(err as Error).message}`);
      }
    })();
  });
  const importFile = app.querySelector<HTMLInputElement>("#import");
  importFile?.addEventListener("change", async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const parsed = parseJSON(await file.text());
      Object.assign(doc.session, parsed.session);
      renderAll();
    } catch (err) {
      alert(`Import fehlgeschlagen: ${(err as Error).message}`);
    }
  });
}

function setProgress(msg: string): void {
  const el = document.getElementById("status");
  if (el) el.textContent = msg;
}
