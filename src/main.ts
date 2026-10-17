/**
 * Entry-Point (WP-UI-DASH): Boot + Event-Router (UI ↔ Agent über WGA).
 *
 * Boot: AAMS-B-Store (laden/neu) → WGA (UI) → Modell-Pool → Agent → KERN-Supervisor → Verdrahtung.
 *
 * WP-UI-DASH §2.5/§3.5: die UI weiß nichts vom Agenten, der Agent nichts vom DOM.
 * Dieser Router übersetzt alle Ereignisse (Pool/Agent/KERN/Reset) in WGA-Aufrufe
 * (ersetzt den alten ~100-Zeilen-onEvent-Switch + die #status-Zeile).
 */
import "./ui/theme.css";
import { aamsStore } from "./aams/store";
import { newSessionId, resetSession } from "./aams/reset";
import type { AAMSDocument } from "./aams/schema";
import { downloadJSON, parseJSON } from "./aams/io";
import { extractHTMLArtifact } from "./artifact/extract";
import { catalogModel } from "./llm/catalog";
import { ModelPool, type RoleId } from "./llm/pool";
import { Agent, pushAudit } from "./agent/agent";
import { KernSupervisor } from "./kern/supervisor";
import { WGA } from "./ui/api";
import { wire } from "./ui/wire";

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

const label = (id?: string): string => (id ? (catalogModel(id)?.label ?? id) : "–");
const roleLabel = (r?: string): string => (r === "waechter" ? "Wächter" : "Planer");

async function boot(): Promise<void> {
  const root = document.getElementById("app");
  if (!root) throw new Error("#app nicht gefunden");

  // 1) AAMS-B-Store: aktive Session laden, sonst neue anlegen.
  const stored = await aamsStore.load();
  const doc = stored ?? newSession("Neue Session");
  await aamsStore.save(doc);

  // 2) WGA (UI): Zustand + Hooks.
  const wga = new WGA(root);
  wga.vramBudget(4096);
  wga.session(doc.session.id, doc.session.title, doc.session.status);
  wga.seedLogs(doc.session.auditLog);
  wga.tasks(doc.session.tasks);
  wga.memory(doc.session.memory);
  wga.loop(false);
  wga.context(0, 4096);

  // 3) Modell-Pool: Events → WGA (Anzeige) + Audit (Wahrheit).
  const pool = new ModelPool({
    onEvent: (e) => {
      const role = (e.note as RoleId) ?? "planer";
      switch (e.action) {
        case "select":
          pushAudit(doc, "pool.select", undefined, `${roleLabel(e.note)}: ${label(e.model)}`);
          wga.log("session", "pool.select", `${roleLabel(e.note)}: ${label(e.model)}`);
          return;
        case "load":
          pushAudit(doc, "llm.load", undefined, `model=${e.model} role=${e.note}`);
          wga.log("llm", "llm.load", `${roleLabel(e.note)}: ${label(e.model)}`);
          wga.live(`${roleLabel(e.note)} lädt …`, label(e.model));
          return;
        case "progress": {
          const p = pool.getProgress();
          if (p) wga.progress(role, p, catalogModel(p.model)?.vramMB ?? 0);
          return;
        }
        case "ready":
          pushAudit(doc, "llm.ready", undefined, `model=${e.model} role=${e.note}`);
          wga.ready(role, label(e.model));
          wga.log("llm", "llm.ready", `${roleLabel(e.note)}: ${label(e.model)} bereit`);
          wga.live(null);
          return;
        case "unload":
          pushAudit(doc, "llm.unload", undefined, `model=${e.model}`);
          wga.unloaded(role);
          wga.log("llm", "llm.unload", `${label(e.model)} — VRAM frei`);
          wga.live(null);
          return;
        case "fallback":
          pushAudit(doc, "llm.fallback", undefined, `${label(e.model)} nicht ladbar — nächstes Modell (${e.note})`);
          wga.log("guard", "llm.fallback", `${label(e.model)} → nächstes Modell`);
          return;
        case "degraded":
          pushAudit(doc, "llm.degraded", undefined, e.note ?? "Planer nicht ladbar");
          wga.degraded(role, e.note ?? "Planer nicht ladbar");
          wga.log("guard", "llm.degraded", "DEGRADED: Planer nicht ladbar — Wächter übernimmt");
          wga.live(null);
          return;
        case "error":
        default:
          pushAudit(doc, "llm.error", undefined, e.note ?? label(e.model));
          wga.error(role, e.note ?? "Fehler");
          wga.log("error", "llm.error", e.note ?? "Fehler");
          wga.live(null);
      }
    },
  });

  // 4) Agent: Callbacks → WGA.
  const agent = new Agent(doc, pool, {
    onStatus: (msg) => wga.log("task", "agent", msg),
    onTaskChange: () => {
      wga.tasks(doc.session.tasks);
      wga.memory(doc.session.memory);
    },
    onWork: (working) => {
      if (working) wga.live("führt Aufgabe aus …", "Agent");
      else wga.live(null);
    },
    // Workflow + Ergebnis **im Chatfenster** (Ziel #1): Plan, je Schritt, Abschluss.
    onChat: (text, badge) => wga.say("agent", text, badge ?? "waechter"),
  });

  // 5) KERN-Supervisor: Ticks → WGA.
  const kern = new KernSupervisor(doc, 1500, 600, 0.8, {
    onTick: (info) => {
      wga.context(info.tokens, info.limit, info.threshold);
      if (info.flushed) {
        wga.log("guard", "tokenwatcher.flush", info.reason ?? "Context fast voll → in AAMS-B gesichert");
      }
      wga.tasks(doc.session.tasks);
      wga.memory(doc.session.memory);
    },
  });

  // 6) Hooks (UI → Agent) — hier treffen sich WGA und echte Systemteile.
  wga.onSend = (text) => void handleChat(text, agent, wga);
  wga.onLoop = (on) => {
    if (on) kern.start();
    else kern.stop();
    wga.loop(on);
    wga.log("session", "kern.loop", on ? "KERN-Loop gestartet" : "KERN-Loop gestoppt");
  };
  wga.onStep = () => {
    wga.live("führe nächsten Schritt aus …", "Agent");
    void agent.runStep().finally(() => wga.live(null));
  };
  wga.onExport = () => {
    downloadJSON(doc);
    wga.log("session", "session.export", "JSON-Export gestartet");
  };
  wga.onImport = (file) => void handleImport(file, doc, wga);
  wga.onReset = () => void handleReset(doc, wga, kern);
  // V4 Schritt 1: User-Aktionen auf Artefakte (Vorschau/Download) → Audit (AAMS-B).
  wga.onArtifact = (taskId, action) => {
    wga.log("task", `artifact.${action}`, "Artefakt-Aktion (Vorschau/Download)");
    void (async () => {
      const t = doc.session.tasks.find((x) => x.id === taskId);
      const a = t ? extractHTMLArtifact(t.result) : null;
      pushAudit(doc, `artifact.${action}`, taskId, a ? `html · ${a.filename} · ${a.bytes} B` : "–");
      await aamsStore.save(doc);
    })();
  };

  // 7) Verdrahtung (Controls) + Chat-Aufmacher (Agent fragt nach der neuen Aufgabe).
  wire(wga, pool);
  wga.say(
    "agent",
    "Hallo! Ich bin dein lokaler Agent (WebGPU, AAMS). Was ist die neue Aufgabe? " +
      "Beschreib kurz, was ich erledigen soll — ich zerlege sie in Teilaufgaben (Planer) " +
      "und starte danach die Ausführung. Du siehst jeden Schritt hier im Chat, " +
      "am Ende bekommst du das Ergebnis. „Was ist dein aktueller Stand?“ zeigt dir den Fortschritt.",
    "waechter"
  );
}

/** Chat-Runde: User-Nachricht → Agent.chat() → Antwort (Badge) — WP-UI-DASH §3.3. */
async function handleChat(text: string, agent: Agent, wga: WGA): Promise<void> {
  wga.say("user", text);
  wga.chatState("denkt …");
  wga.typing(true);
  try {
    const reply = await agent.chat(text);
    wga.say("agent", reply.text, reply.badge);
  } catch (err) {
    wga.say("sys", `Fehler: ${(err as Error).message}`);
  } finally {
    wga.typing(false);
    wga.chatState("bereit");
  }
}

/** Import: echte Schema-Prüfung (parseJSON) → Session-Objekt in Place aktualisieren. */
async function handleImport(file: File, doc: AAMSDocument, wga: WGA): Promise<void> {
  try {
    const parsed = parseJSON(await file.text());
    Object.assign(doc.session, parsed.session);
    wga.session(doc.session.id, doc.session.title, doc.session.status);
    wga.tasks(doc.session.tasks);
    wga.memory(doc.session.memory);
    wga.seedLogs(doc.session.auditLog);
    wga.log("session", "session.import", `Import: ${file.name}`);
  } catch (err) {
    wga.say("sys", `Import fehlgeschlagen: ${(err as Error).message}`);
  }
}

/**
 * Reset (WP-SESS-RESET, Semantik unverändert — WP-UI-DASH §4.7):
 * Confirm → KERN-Stop → Safety-Export → resetSession (Rollback bei Fehler) → Render.
 */
async function handleReset(doc: AAMSDocument, wga: WGA, kern: KernSupervisor): Promise<void> {
  const s = doc.session;
  const ok = confirm(
    "Gedächtnis KOMPLETT zurücksetzen?\n\n" +
      `Wird gelöscht: ${s.tasks.length} Tasks · ${s.auditLog.length} Audit-Einträge · ` +
      `${s.memory.length} Memory-Einträge · ${s.knowledge.length} Wissen.\n` +
      "Der KERN-Loop wird gestoppt. Ein Safety-Export (JSON) wird automatisch ausgelöst."
  );
  if (!ok) return;
  try {
    kern.reset(); // 1) Timer stoppen + tokens/step nullen (keine Waisen-Write)
    downloadJSON(doc, `aams-safety-${doc.session.id}.json`); // 2) Safety-Export (alter Zustand)
    wga.log("session", "session.reset", "Zurücksetzen … (Safety-Export ausgelöst)");
    const report = await resetSession(doc); // 3) In-Place-Reset + Persist (Rollback bei Fehler)
    // 4) UI neu — inkl. Chat-Spur über den Reset.
    wga.session(doc.session.id, doc.session.title, doc.session.status);
    wga.tasks(doc.session.tasks);
    wga.memory(doc.session.memory);
    wga.seedLogs(doc.session.auditLog);
    wga.context(0, 4096);
    wga.loop(false);
    wga.live(null);
    wga.say(
      "sys",
      `Gedächtnis zurückgesetzt → neue Session ${report.newId} (alter Stand als Safety-Export gesichert).`
    );
  } catch (err) {
    // Rollback hat den alten Zustand wiederhergestellt → einfach neu rendern (kein „zurückgesetzt“!).
    wga.tasks(doc.session.tasks);
    wga.memory(doc.session.memory);
    wga.seedLogs(doc.session.auditLog);
    wga.say("sys", `Fehler: ${(err as Error).message}`);
  }
}

boot().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  const box = document.querySelector<HTMLDivElement>("#msgs");
  if (box) {
    const d = document.createElement("div");
    d.className = "m sys";
    d.textContent = `Boot fehlgeschlagen: ${msg}`;
    box.appendChild(d);
  }
});
