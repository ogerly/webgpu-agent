/**
 * Minimale UI-Verdrahtung (Scaffold).
 * Session-Header (ID/Status) + Task-Liste + JSON-Export/Import (WH-001 §4 Export).
 *
 * Bewusst schlank: Die "Intelligenz" liegt in src/aams + src/agent, nicht in der UI.
 */
import type { AAMSDocument } from "../aams/schema";
import { downloadJSON, parseJSON } from "../aams/io";
import type { Agent } from "../agent/agent";

function escape(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;"
  );
}

/** Rendert Session-Header + Task-Liste (nur #tasks + #session-id, keine Listener). */
export function render(app: HTMLElement, doc: AAMSDocument): void {
  const s = doc.session;
  const sessionEl = app.querySelector<HTMLElement>("#session-id");
  if (sessionEl) {
    sessionEl.textContent = `${s.title} · ${s.id} · ${s.status}`;
  }
  const tasksEl = app.querySelector<HTMLElement>("#tasks");
  if (!tasksEl) return;
  if (s.tasks.length === 0) {
    tasksEl.innerHTML = "<ul><li>(noch keine Aufgaben)</li></ul>";
    return;
  }
  tasksEl.innerHTML =
    "<ul>" +
    s.tasks
      .map((t) => {
        const indent = t.parentId ? "&nbsp;&nbsp;&nbsp;↳ " : "";
        const mark = t.status === "done" ? "✅" : t.status === "in_progress" ? "▶️" : "⏳";
        const result = t.result ? ` — <i>${escape(t.result)}</i>` : "";
        return `<li>${indent}${mark} ${escape(t.title)}${result}</li>`;
      })
      .join("") +
    "</ul>";
}

/** Verdrahtet die Toolbar-Buttons (einmalig, kein Re-Attach). */
export function wireControls(doc: AAMSDocument, agent: Agent, app: HTMLElement): void {
  app.querySelector<HTMLButtonElement>("#export")?.addEventListener("click", () => {
    downloadJSON(doc);
  });

  const importFile = app.querySelector<HTMLInputElement>("#import");
  importFile?.addEventListener("change", async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const parsed = parseJSON(await file.text());
      // Restore (idee.md §3A): ersetzt die aktive Session in-place.
      // In einer vollen Version: Bestätigungsdialog + ggf. Agent-Reload.
      Object.assign(doc.session, parsed.session);
      render(app, doc);
    } catch (err) {
      alert(`Import fehlgeschlagen: ${(err as Error).message}`);
    }
  });

  app.querySelector<HTMLButtonElement>("#run")?.addEventListener("click", async () => {
    await agent.runStep();
    render(app, doc);
  });

  app.querySelector<HTMLButtonElement>("#plan")?.addEventListener("click", async () => {
    const goal = prompt("Aufgabe / Ziel eingeben:");
    if (!goal) return;
    await agent.plan(goal);
    render(app, doc);
  });
}
