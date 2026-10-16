/**
 * Entry-Point (Modell-Pool + KERN-Prototyp + Agent).
 * Boot: AAMS-B-Store (laden/neu) → Modell-Pool (lazy) → Agent → KERN-Supervisor → UI.
 */
import { aamsStore } from "./aams/store";
import { newSessionId } from "./aams/reset";
import type { AAMSDocument } from "./aams/schema";
import { ModelPool, type RoleId } from "./llm/pool";
import { catalogModel } from "./llm/catalog";
import { Agent, pushAudit } from "./agent/agent";
import { KernSupervisor } from "./kern/supervisor";
import {
  renderSession,
  renderMemory,
  renderAudit,
  renderKern,
  renderPool,
  renderProgress,
  setRoleState,
  wire,
} from "./ui/app";

function newSession(title: string): AAMSDocument {
  const now = Date.now();
  return {
    version: "0.1.0",
    session: {
      id: newSessionId(),
      title,
      createdAt: now,
      updatedAt: now,
      status: "active",
      tasks: [],
      auditLog: [],
      memory: [],
      knowledge: [],
    },
  };
}

function setProgress(msg: string): void {
  const el = document.getElementById("status");
  if (el) el.textContent = msg;
}

async function boot(): Promise<void> {
  const app = document.getElementById("app");
  if (!app) throw new Error("#app nicht gefunden");

  // 1) AAMS-B-Store: aktive Session laden, sonst neue anlegen.
  const stored = await aamsStore.load();
  const doc = stored ?? newSession("Neue Session");
  await aamsStore.save(doc);

  // 2) Modell-Pool (WP-BENCH-IMPL): Wächter resident + Planer on-demand.
  //    Lazy: WebLLM/Weights werden erst bei ensureWaechter()/ensurePlanner() geladen.
  const renderAll = (): void => {
    renderSession(app, doc);
    renderMemory(app, doc);
    renderAudit(app, doc);
  };
  const pool = new ModelPool({
    onEvent: (e) => {
      const label = (m?: string): string => (m ? (catalogModel(m)?.label ?? m) : "");
      const roleLabel = (r?: string): string => (r === "waechter" ? "Wächter" : "Planer");

      // 1) Download-Fortschritt → saubere Anzeige im Panel ①
      if (e.action === "progress") {
        const role = (e.note as RoleId) ?? "planer";
        setRoleState(app, role, "loading");
        renderProgress(app, pool.getProgress());
        return;
      }

      // 2) Alle übrigen Events → Audit (Beobachtung!)
      if (e.action === "ready") {
        renderPool(app, pool);
        renderProgress(app, null);
        renderAll();
        setProgress(`${roleLabel(e.note)} bereit: ${label(e.model)}`);
        return;
      }
      const withRole = e.action === "select" || e.action === "load" || e.action === "unload";
      const auditNote = [
        e.model ? `model=${e.model}` : null,
        withRole && e.note ? `role=${e.note}` : null,
        !withRole && e.note ? e.note : null,
      ]
        .filter(Boolean)
        .join(" ");
      pushAudit(doc, e.action === "select" ? "pool.select" : `llm.${e.action}`, undefined, auditNote || undefined);

      if (e.action === "select") {
        renderPool(app, pool);
        renderAll();
        setProgress(`${roleLabel(e.note)} gewählt: ${label(e.model)}`);
        return;
      }
      if (e.action === "load") {
        setRoleState(app, (e.note as RoleId) ?? "planer", "loading");
        setProgress(`${roleLabel(e.note)}: lade ${label(e.model)} …`);
        renderAll();
        return;
      }
      if (e.action === "unload") {
        renderPool(app, pool);
        renderProgress(app, null);
        renderAll();
        setProgress(`${label(e.model)} entladen — VRAM frei`);
        return;
      }
      if (e.action === "fallback") {
        setProgress(`Fallback: ${label(e.model)} nicht ladbar → nächstes Modell …`);
        renderAll();
        return;
      }
      if (e.action === "degraded") {
        renderPool(app, pool);
        renderProgress(app, null);
        renderAll();
        setProgress(`DEGRADED: Planer nicht ladbar — Wächter übernimmt (${e.note ?? ""})`);
        return;
      }
      // error
      renderPool(app, pool);
      renderProgress(app, null);
      renderAll();
      setProgress(`Fehler: ${e.note ?? label(e.model)}`);
    },
  });

  // 3) Agent (Panel ③) — echter Loop (WP-BENCH-IMPL): Planer-JSON + Ausführung.
  const agent = new Agent(doc, pool, {
    onStatus: setProgress,
    onTaskChange: () => {
      renderSession(app, doc);
      renderMemory(app, doc);
      renderAudit(app, doc);
    },
  });

  // 4) KERN-Supervisor (Panel ② + ④): mechanischer Loop + Tokenwächter.
  const kern = new KernSupervisor(doc, 1500, 600, 0.8, {
    onTick: (info) => {
      renderKern(app, info);
      renderSession(app, doc);
      renderMemory(app, doc);
      renderAudit(app, doc);
    },
  });

  wire(app, doc, agent, kern, pool);
  renderPool(app, pool);
  renderSession(app, doc);
  renderMemory(app, doc);
  renderAudit(app, doc);
  setProgress(
    "Bereit. ① Modell wählen + laden (Downloadstand live sichtbar) · ③ Aufgabe planen · ② KERN-Loop."
  );
}

boot().catch((e: unknown) => {
  setProgress(`Fehler: ${e instanceof Error ? e.message : String(e)}`);
});
