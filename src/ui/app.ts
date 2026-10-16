/**
 * UI-Verdrahtung (Modell-Pool + KERN-Prototyp + Agent).
 * ① Modell-Pool (WebGPU) · ② KERN-Loop + Tokenwächter · ③ Session & Tasks · ④ Live AAMS-Gedächtnis.
 */
import type { AAMSDocument } from "../aams/schema";
import { downloadJSON, parseJSON } from "../aams/io";
import { resetSession } from "../aams/reset";
import type { Agent } from "../agent/agent";
import type { KernSupervisor, KernTickInfo } from "../kern/supervisor";
import { MODEL_CATALOG } from "../llm/catalog";
import type { ModelPool, PoolProgress } from "../llm/pool";

function escape(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;"
  );
}

// ③ Session + Tasks
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

// ④ Live-Gedächtnis
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

// ② KERN log + Context-Balken
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

// ① Modell-Pool (WebGPU): Auswahl, Rolle-Zustände, VRAM-Budget
type RoleId = "waechter" | "planer";
type RoleStateId = "off" | "loading" | "on" | "degraded";

export function setRoleState(app: HTMLElement, role: RoleId, state: RoleStateId): void {
  const el = app.querySelector<HTMLElement>(`#${role}-state`);
  if (!el) return;
  const texts: Record<RoleStateId, string> = {
    off: "○ nicht geladen",
    loading: "◌ lädt …",
    on: "● bereit",
    degraded: "⚠ DEGRADED (Wächter übernimmt)",
  };
  const cls: Record<RoleStateId, string> = {
    off: "state",
    loading: "state loading",
    on: "state on",
    degraded: "state loading",
  };
  el.textContent = texts[state];
  el.className = cls[state];
}

export function renderPool(app: HTMLElement, pool: ModelPool): void {
  const selW = app.querySelector<HTMLSelectElement>("#waechter-select");
  const selP = app.querySelector<HTMLSelectElement>("#planer-select");
  if (selW && selP && selW.options.length === 0) {
    for (const m of MODEL_CATALOG) {
      const o = document.createElement("option");
      o.value = m.id;
      o.textContent = `${m.label} · ≈ ${Math.round(m.vramMB)} MB`;
      selW.appendChild(o);
      selP.appendChild(o.cloneNode(true) as HTMLOptionElement);
    }
  }
  if (selW) selW.value = pool.getWaechterModel();
  if (selP) selP.value = pool.getPlannerModel();
  const st = pool.status();
  setRoleState(app, "waechter", st.waechter.loaded ? "on" : "off");
  setRoleState(app, "planer", st.degraded ? "degraded" : st.planer.loaded ? "on" : "off");
  const used = app.querySelector<HTMLElement>("#pool-used");
  if (used) used.textContent = String(Math.round(st.vram.loadedMB));
}

// ① Modell-Pool: Download-Fortschritt (saubere Anzeige)
export function renderProgress(app: HTMLElement, p: PoolProgress | null): void {
  const box = app.querySelector<HTMLElement>("#dl");
  if (!box) return;
  if (!p) {
    box.classList.add("hidden");
    return;
  }
  box.classList.remove("hidden");
  const cat = MODEL_CATALOG.find((m) => m.id === p.model);
  const setText = (id: string, v: string): void => {
    const el = app.querySelector<HTMLElement>(id);
    if (el) el.textContent = v;
  };
  setText("#dl-title", cat?.label ?? p.model);
  setText("#dl-pct", `${Math.round(p.progress * 100)}%`);
  setText("#dl-text", p.text);
  setText("#dl-time", `${Math.round(p.timeElapsed)} s`);
  setText("#dl-size", `≈ ${Math.round(cat?.vramMB ?? 0)} MB`);
  const fill = app.querySelector<HTMLElement>("#dl-fill");
  if (fill) fill.style.width = `${Math.round(p.progress * 100)}%`;
}

// ② KERN nach Reset: Context-Balken 0 + „zurückgesetzt"-Zeile im Log
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
export function wire(
  app: HTMLElement,
  doc: AAMSDocument,
  agent: Agent,
  kern: KernSupervisor,
  pool: ModelPool
): void {
  const renderAll = (): void => {
    renderSession(app, doc);
    renderMemory(app, doc);
    renderAudit(app, doc);
  };

  // ① Modell-Pool (WebGPU): Auswahl + Laden/Entladen
  const selW = app.querySelector<HTMLSelectElement>("#waechter-select");
  const selP = app.querySelector<HTMLSelectElement>("#planer-select");
  selW?.addEventListener("change", () => {
    pool.selectWaechter(selW.value);
    renderPool(app, pool);
  });
  selP?.addEventListener("change", () => {
    pool.selectPlanner(selP.value);
    renderPool(app, pool);
  });
  app.querySelector<HTMLButtonElement>("#waechter-load")?.addEventListener("click", () => {
    void pool.loadWaechter();
  });
  app.querySelector<HTMLButtonElement>("#waechter-unload")?.addEventListener("click", async () => {
    await pool.unloadWaechter();
    renderPool(app, pool);
  });
  app.querySelector<HTMLButtonElement>("#planer-load")?.addEventListener("click", () => {
    void pool.ensurePlanner();
  });
  app.querySelector<HTMLButtonElement>("#planer-unload")?.addEventListener("click", async () => {
    await pool.unloadPlanner();
    renderPool(app, pool);
  });

  // ② KERN
  app.querySelector<HTMLButtonElement>("#kern-start")?.addEventListener("click", () => {
    kern.start();
    setProgress("KERN-Loop gestartet (mechanisch).");
  });
  app.querySelector<HTMLButtonElement>("#kern-stop")?.addEventListener("click", () => {
    kern.stop();
    setProgress("KERN-Loop gestoppt. Stand in AAMS-B (IndexedDB).");
  });

  // ③ Session/Tasks
  app.querySelector<HTMLButtonElement>("#plan")?.addEventListener("click", async () => {
    const goal = prompt("Aufgabe / Ziel eingeben:");
    if (!goal) return;
    // WP-BENCH-IMPL: 1 = einfache Aufgabe (Wächter, kein Planer-Load) · 2+ = zerlegen · leer = Planer bestimmt
    const nRaw = prompt("Erwartete Teilaufgaben (1 = einfach · 2+ = zerlegen · leer = Planer bestimmt):");
    const parsed = nRaw === null ? NaN : Number.parseInt(nRaw.trim(), 10);
    const expected = Number.isFinite(parsed) && parsed >= 1 ? parsed : undefined;
    await agent.plan(goal, expected);
    renderAll();
  });
  app.querySelector<HTMLButtonElement>("#run")?.addEventListener("click", async () => {
    await agent.runStep();
    renderAll();
  });
  app.querySelector<HTMLButtonElement>("#export")?.addEventListener("click", () => downloadJSON(doc));
  // ③ Gedächtnis komplett & sauber zurücksetzen (WP-SESS-RESET):
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
