/**
 * Entry-Point (Scaffold + KERN-Prototyp).
 * Boot: AAMS-B-Store (laden/neu) → WebLLM-Engine (lazy) → Agent → KERN-Supervisor → UI.
 */
import { aamsStore } from "./aams/store";
import { newSessionId } from "./aams/reset";
import type { AAMSDocument } from "./aams/schema";
import { WebLLMEngine } from "./llm/webllm";
import { Agent } from "./agent/agent";
import { KernSupervisor } from "./kern/supervisor";
import { renderSession, renderMemory, renderAudit, renderKern, wire } from "./ui/app";

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

  // 2) LLM-Engine (lazy — WebLLM/WebGPU wird erst bei load() geladen).
  const llm = new WebLLMEngine({
    initProgressCallback: (p) => setProgress(`LLM-Load ${Math.round(p.progress * 100)}% — ${p.text}`),
  });

  // 3) Agent (Panel ②).
  const agent = new Agent(doc, llm, {
    onStatus: setProgress,
    onTaskChange: () => {
      renderSession(app, doc);
      renderMemory(app, doc);
      renderAudit(app, doc);
    },
  });

  // 4) KERN-Supervisor (Panel ① + ③): mechanischer Loop + Tokenwächter.
  const kern = new KernSupervisor(doc, 1500, 600, 0.8, {
    onTick: (info) => {
      renderKern(app, info);
      renderSession(app, doc);
      renderMemory(app, doc);
      renderAudit(app, doc);
    },
  });

  wire(app, doc, agent, kern);
  renderSession(app, doc);
  renderMemory(app, doc);
  renderAudit(app, doc);
  setProgress("KERN-Prototyp bereit. ▶ Loop starten, um Tokenwächter + Live-Gedächtnis live zu sehen.");
}

boot().catch((e: unknown) => {
  setProgress(`Fehler: ${e instanceof Error ? e.message : String(e)}`);
});
