/**
 * Modell-Pool (WP-BENCH-IMPL / BENCH-PLAN §5): Wächter resident + Planer on-demand.
 *
 * Ground-Truth (WebLLM 0.2.86, prebuilt config — s. `catalog.ts`):
 *   Qwen2.5-0.5B   944,62 MB · Qwen2.5-1.5B 1629,75 MB · Llama-3.2-3B 2263,69 MB · …
 *
 * Regeln:
 *   - **Modelle wählbar** (Katalog `catalog.ts`) — Wächter + Planer, jede Rolle einzeln.
 *   - **Wächter:** resident — `ensureWaechter()` lädt automatisch; manuell laden/entladen
 *     über die UI möglich.
 *   - **Planer:** on-demand — `ensurePlanner()` lädt, `unloadPlanner()` gibt VRAM frei.
 *   - **Fallback:** nur beim Standard-Planer (Llama-3.2-3B) → Qwen2.5-1.5B als
 *     Sicherheitsnetz. Explizit gewählte Modelle werden respektiert (kein Fallback).
 *     Scheitert trotzdem → **Degraded** (Wächter übernimmt, gekennzeichnet).
 *   - **Download-Fortschritt:** `InitProgressReport` (progress/text/timeElapsed) wird
 *     als Event gemeldet → saubere Anzeige in der UI.
 */
import type { InitProgressCallback } from "@mlc-ai/web-llm";
import type { LLMEngine } from "./engine";
import { WebLLMEngine } from "./webllm";
import {
  catalogModel,
  DEFAULT_PLANER,
  DEFAULT_WAECHTER,
  PLANER_FALLBACK,
  VRAM_BUDGET_MB,
} from "./catalog";

export interface PoolProgress {
  model: string;
  text: string; // Schritt (z. B. "Downloading model weights")
  progress: number; // 0..1 (wie von WebLLM gemeldet)
  timeElapsed: number; // Sekunden
}

/** Rollen-ID (wird in Events als `note` mitgegeben). */
export type RoleId = "waechter" | "planer";

/**
 * Fortschrittsstufe aus dem WebLLM-Progress-Text (WP-UI-DASH §3.3).
 *
 * Ground-Truth (WebLLM 0.2.86): Download = „Fetching param cache[…]: … MB fetched“ (0–100 %),
 * danach „Creating model …“ / „Compiling shaders / finish loading on GPU“.
 * Heuristik ist bewusst **isoliert + testbar** (im Exemplar inline-Regex, WP-UI-DASH §4.8);
 * Fallback: Stufe 1 (reiner %-Balken bleibt trotzdem korrekt).
 */
export function stageFromText(text: string, pct: number): number {
  if (pct >= 100) return 3;
  const t = (text ?? "").toLowerCase();
  if (/shader|compil|pipeline|finish/.test(t)) return 2;
  if (/cache|creating model|loading model/.test(t)) return 1;
  if (/fetch|download/.test(t)) return 0;
  return 1;
}

export interface PoolEvent {
  action:
    | "select"
    | "load"
    | "ready"
    | "unload"
    | "fallback"
    | "degraded"
    | "error"
    | "progress";
  model?: string;
  note?: string;
}

export interface ModelPoolOptions {
  /** Zielprofil-VRAM (Default: 4096 MB). */
  vramBudgetMB?: number;
  /** Ereignisse → UI/Status/Audit (Beobachtung!). */
  onEvent?: (e: PoolEvent) => void;
}

export interface RoleState {
  model: string;
  loaded: boolean;
  vramMB: number;
}

export interface PoolStatus {
  waechter: RoleState;
  planer: RoleState;
  degraded: boolean;
  vram: { loadedMB: number; budgetMB: number };
}

export class ModelPool {
  private waechterModel: string = DEFAULT_WAECHTER;
  private planerSelected: string = DEFAULT_PLANER;
  private planerLoadedModel: string | null = null;
  private waechter: WebLLMEngine | null = null;
  private planer: WebLLMEngine | null = null;
  private loading: Promise<LLMEngine> | null = null;
  private loadingRole: RoleId | null = null;
  private degraded = false;
  private progress: PoolProgress | null = null;

  constructor(private opts: ModelPoolOptions = {}) {}

  get budgetMB(): number {
    return this.opts.vramBudgetMB ?? VRAM_BUDGET_MB;
  }

  // ---------- Auswahl ----------

  getWaechterModel(): string {
    return this.waechterModel;
  }

  getPlannerModel(): string {
    return this.planerSelected;
  }

  /** Tatsächlich geladenes Planer-Modell (kann Fallback sein) — für Audit/Events. */
  getLoadedPlannerModel(): string {
    return this.planerLoadedModel ?? this.planerSelected;
  }

  selectWaechter(modelId: string): void {
    if (this.waechterModel === modelId || !catalogModel(modelId)) return;
    this.waechterModel = modelId;
    this.emit("select", modelId, "waechter");
  }

  selectPlanner(modelId: string): void {
    if (this.planerSelected === modelId || !catalogModel(modelId)) return;
    this.planerSelected = modelId;
    this.emit("select", modelId, "planer");
  }

  // ---------- Wächter (resident) ----------

  waechterReady(): boolean {
    return this.waechter !== null && this.waechter.ready();
  }

  /** Wächter laden (falls nicht geladen). */
  async loadWaechter(): Promise<void> {
    if (this.waechterReady()) return;
    const model = this.waechterModel;
    this.waechter = this.createEngine(model);
    this.loadingRole = "waechter";
    this.emit("load", model, "waechter");
    try {
      await this.waechter.load();
    } catch (err) {
      this.waechter = null;
      this.loadingRole = null;
      this.emit("error", model, (err as Error).message);
      throw err;
    }
    this.loadingRole = null;
    this.emit("ready", model, "waechter");
  }

  /** Wächter entladen (UI — VRAM frei). */
  async unloadWaechter(): Promise<void> {
    if (this.waechter && this.waechter.ready()) {
      await this.waechter.unload();
      this.emit("unload", this.waechterModel, "waechter");
    }
    this.waechter = null;
  }

  /** Residentes Modell für den Agenten: geladen, wenn noch nicht. */
  async ensureWaechter(): Promise<LLMEngine> {
    if (!this.waechterReady()) await this.loadWaechter();
    return this.waechter as LLMEngine;
  }

  // ---------- Planer (on-demand) ----------

  planerReady(): boolean {
    return this.planer !== null && this.planer.ready();
  }

  /**
   * Planer on-demand. Ladder: Standard → 3B + Fallback 1,5B · explizite Auswahl →
   * wird respektiert (kein Fallback). Scheitert → Degraded (Wächter, gekennzeichnet).
   */
  async ensurePlanner(): Promise<LLMEngine> {
    if (this.planerReady()) return this.planer as LLMEngine;
    if (this.loading) return this.loading;

    this.loading = (async (): Promise<LLMEngine> => {
      const ladder = this.planerLadder();
      let lastErr: unknown = null;
      for (const cand of ladder) {
        const eng = this.createEngine(cand.model);
        this.loadingRole = "planer";
        try {
          this.emit("load", cand.model, "planer");
          await eng.load();
          this.planer = eng;
          this.planerLoadedModel = cand.model;
          this.loadingRole = null;
          this.emit("ready", cand.model, "planer");
          return eng;
        } catch (err) {
          lastErr = err;
          this.emit("fallback", cand.model, (err as Error).message);
        }
      }
      // Degraded: Wächter übernimmt — als solches gekennzeichnet (nichts versteckt).
      this.degraded = true;
      const w = await this.ensureWaechter();
      this.emit("degraded", undefined, lastErr ? (lastErr as Error).message : "Planer nicht ladbar");
      return w;
    })();

    try {
      return await this.loading;
    } finally {
      this.loading = null;
    }
  }

  /** Planer entladen → VRAM frei (BENCH-PLAN §5 Regel 2). */
  async unloadPlanner(): Promise<void> {
    if (this.planer && this.planer.ready()) {
      await this.planer.unload();
      this.emit("unload", this.getLoadedPlannerModel(), "planer");
    }
    this.planer = null;
    this.planerLoadedModel = null;
    this.degraded = false;
  }

  // ---------- Status & Fortschritt ----------

  getProgress(): PoolProgress | null {
    return this.progress;
  }

  status(): PoolStatus {
    const w = catalogModel(this.waechterModel);
    const p = catalogModel(this.planerSelected);
    const loadedMB =
      (this.waechterReady() ? w?.vramMB ?? 0 : 0) +
      (this.planerReady() ? (catalogModel(this.getLoadedPlannerModel())?.vramMB ?? p?.vramMB ?? 0) : 0);
    return {
      waechter: { model: this.waechterModel, loaded: this.waechterReady(), vramMB: w?.vramMB ?? 0 },
      planer: { model: this.planerSelected, loaded: this.planerReady(), vramMB: p?.vramMB ?? 0 },
      degraded: this.degraded,
      vram: { loadedMB, budgetMB: this.budgetMB },
    };
  }

  // ---------- intern ----------

  private planerLadder(): { model: string; vramMB: number }[] {
    const sel = this.planerSelected;
    if (sel === DEFAULT_PLANER) {
      // Standard: Llama-3.2-3B + Sicherheitsnetz Qwen2.5-1.5B.
      return [
        { model: sel, vramMB: catalogModel(sel)?.vramMB ?? 0 },
        { model: PLANER_FALLBACK, vramMB: catalogModel(PLANER_FALLBACK)?.vramMB ?? 0 },
      ];
    }
    // Explizit gewählt → respektieren (kein Fallback).
    return [{ model: sel, vramMB: catalogModel(sel)?.vramMB ?? 0 }];
  }

  private createEngine(model: string): WebLLMEngine {
    const cb: InitProgressCallback = (r) => {
      this.progress = { model, text: r.text, progress: r.progress, timeElapsed: r.timeElapsed };
      this.emit("progress", model, this.loadingRole ?? "planer");
    };
    return new WebLLMEngine({ model, initProgressCallback: cb });
  }

  private emit(action: PoolEvent["action"], model?: string, note?: string): void {
    this.opts.onEvent?.({ action, model, note });
  }
}
