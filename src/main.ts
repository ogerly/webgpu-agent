/**
 * Entry-Point (Scaffold).
 *
 * Bootstrap: AAMS(B)-Store laden (oder neue Session anlegen) →
 *            WebLLM-Engine (lazy) → Agent → UI.
 *
 * WH-001: Single-Agent, AAMS-nativ, local-first (kein Build-/Cloud-Laufzeitbedarf).
 */
import { aamsStore } from "./aams/store";
import type { AAMSDocument } from "./aams/schema";
import { WebLLMEngine } from "./llm/webllm";
import { Agent } from "./agent/agent";
import { render, wireControls } from "./ui/app";

function newSession(title: string): AAMSDocument {
  const now = Date.now();
  return {
    version: "0.1.0",
    session: {
      id: `s_${now}_${Math.random().toString(36).slice(2, 8)}`,
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

  // 1) AAMS(B)-Store: aktive Session laden, sonst neue anlegen.
  const stored = await aamsStore.load();
  const doc = stored ?? newSession("Neue Session");
  await aamsStore.save(doc);

  // 2) LLM-Engine (lazy — WebLLM/WebGPU wird erst bei load() geladen).
  const llm = new WebLLMEngine({
    initProgressCallback: (p) => setProgress(`LLM-Load ${Math.round(p.progress * 100)}% — ${p.text}`),
  });

  // 3) Agent + UI.
  const agent = new Agent(doc, llm, {
    onStatus: setProgress,
    onTaskChange: () => render(app, doc),
  });
  wireControls(doc, agent, app);
  render(app, doc);
  setProgress("Scaffold bereit. LLM noch nicht geladen (lazy).");
}

boot().catch((e: unknown) => {
  setProgress(`Fehler: ${e instanceof Error ? e.message : String(e)}`);
});
