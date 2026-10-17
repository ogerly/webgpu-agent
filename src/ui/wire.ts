/**
 * UI-Verdrahtung (WP-UI-DASH): Controls → WGA-Hooks + Modell-Pool.
 *
 * - Modell-Auswahl (Katalog) + Laden/Entladen (via WGA-Hooks → Pool-Events → Router)
 * - KERN-Start/Stop + Schritt (via Hooks)
 * - Session: Export/Import/Reset (via Hooks — Reset-Semantik in main.ts)
 * - Chat: Compose + Chips (Enter = senden, Shift+Enter = Zeilenumbruch)
 * - Tabs + Audit-Filter
 *
 * Wichtig: hier gibt es **keinen Freitext-Dialog mehr** (keine prompt()/alert()) —
 * Freitext läuft nur über den Chat (WP-UI-DASH §2.1, Ziel #1).
 * `confirm()` bleibt nur bei der destruktiven Aktion „Reset“ (main.ts).
 */
import { MODEL_CATALOG } from "../llm/catalog";
import type { ModelPool, RoleId } from "../llm/pool";
import type { LogFilter, WGA } from "./api";

export function wire(wga: WGA, pool: ModelPool): void {
  const $ = <T extends HTMLElement>(id: string): T | null => wga.root.querySelector("#" + id);

  // ① Modell-Pool: Katalog in die Selects + aktuelle Auswahl (Pool als Quelle).
  const selW = $<HTMLSelectElement>("sel-waechter");
  const selP = $<HTMLSelectElement>("sel-planer");
  const fill = (sel: HTMLSelectElement | null, current: string): void => {
    if (!sel) return;
    sel.innerHTML = MODEL_CATALOG.map(
      (m) => `<option value="${m.id}">${m.label} · ≈ ${Math.round(m.vramMB)} MB</option>`
    ).join("");
    sel.value = current;
  };
  fill(selW, pool.getWaechterModel());
  fill(selP, pool.getPlannerModel());
  selW?.addEventListener("change", () => pool.selectWaechter(selW.value));
  selP?.addEventListener("change", () => pool.selectPlanner(selP.value));

  // Laden/Entladen über WGA-Hooks (Pool-Events → main.ts-Routing → Anzeige).
  wga.onLoad = (role: RoleId): void => {
    if (role === "waechter") void pool.loadWaechter();
    else void pool.ensurePlanner();
  };
  wga.onUnload = (role: RoleId): void => {
    if (role === "waechter") void pool.unloadWaechter();
    else void pool.unloadPlanner();
  };
  wga.root.querySelectorAll<HTMLButtonElement>("[data-load]").forEach((b) =>
    b.addEventListener("click", () => wga.onLoad?.(b.dataset.load as RoleId))
  );
  wga.root.querySelectorAll<HTMLButtonElement>("[data-unload]").forEach((b) =>
    b.addEventListener("click", () => wga.onUnload?.(b.dataset.unload as RoleId))
  );

  // ② KERN-Loop + Schritt (Hooks setzen main.ts).
  $("kern-start")?.addEventListener("click", () => wga.onLoop?.(true));
  $("kern-stop")?.addEventListener("click", () => wga.onLoop?.(false));
  $("step-btn")?.addEventListener("click", () => wga.onStep?.());

  // ③ Session (Hooks setzen main.ts — Reset/Safety-Export bleiben dort).
  $("export-btn")?.addEventListener("click", () => wga.onExport?.());
  $("reset-btn")?.addEventListener("click", () => wga.onReset?.());
  const importFile = $<HTMLInputElement>("import-file");
  $("import-btn")?.addEventListener("click", () => importFile?.click());
  importFile?.addEventListener("change", (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) wga.onImport?.(file);
    (e.target as HTMLInputElement).value = "";
  });

  // Chat (einziger Textkanal).
  const inp = $<HTMLTextAreaElement>("inp");
  const send = (): void => {
    if (!inp) return;
    const v = inp.value.trim();
    if (!v) return;
    inp.value = "";
    wga.onSend?.(v);
  };
  $("send")?.addEventListener("click", send);
  inp?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
  wga.root.querySelectorAll<HTMLButtonElement>("[data-q]").forEach((c) =>
    c.addEventListener("click", () => {
      if (inp) inp.value = c.dataset.q ?? "";
      send();
    })
  );

  // Tabs (Zuschauen · Arbeit · Audit · Gedächtnis).
  wga.root.querySelectorAll<HTMLButtonElement>(".tab").forEach((t) =>
    t.addEventListener("click", () => {
      wga.root.querySelectorAll<HTMLButtonElement>(".tab").forEach((x) => x.classList.toggle("act", x === t));
      wga.root.querySelectorAll<HTMLElement>(".pane").forEach((p) =>
        p.classList.toggle("act", p.id === "pane-" + (t.dataset.tab ?? ""))
      );
    })
  );

  // Audit-Filter.
  wga.root.querySelectorAll<HTMLButtonElement>("[data-f]").forEach((c) =>
    c.addEventListener("click", () => {
      wga.root.querySelectorAll<HTMLButtonElement>("[data-f]").forEach((x) => x.classList.toggle("on", x === c));
      wga.setFilter((c.dataset.f ?? "all") as LogFilter);
    })
  );
}
