/**
 * Modell-Katalog (Ground-Truth: WebLLM 0.2.86, prebuilt config — lokal extrahiert 2026-10-16).
 *
 * Auswahl: **Instruct**-Modelle, Quantisierung `q4f16_1` (Empfehlung WP-…-ARCH-WAEC),
 * die ins **Zielprofil ≤ 4096 MB VRAM** passen (`vram_required_MB` aus der Lib-Metadaten).
 * → Damit die UI-Auswahl sauber bleibt: keine 7B/8B-Modelle, keine q0f/q4f32-Varianten.
 */
export interface CatalogModel {
  /** Modell-ID (WebLLM-Prebuilt). */
  id: string;
  /** Anzeigename (kurz). */
  label: string;
  /** `vram_required_MB` (WebLLM-Metadaten — ≈ Modellgröße, keine exakte Messung). */
  vramMB: number;
  /** Kontextfenster (Prebuilt-Config). */
  contextWindow: number;
}

export const MODEL_CATALOG: CatalogModel[] = [
  { id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC", label: "Qwen2.5 0.5B Instruct", vramMB: 944.62, contextWindow: 4096 },
  { id: "Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC", label: "Qwen2.5-Coder 0.5B Instruct", vramMB: 944.62, contextWindow: 4096 },
  { id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", label: "Qwen2.5 1.5B Instruct", vramMB: 1629.75, contextWindow: 4096 },
  { id: "Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC", label: "Qwen2.5-Coder 1.5B Instruct", vramMB: 1629.75, contextWindow: 4096 },
  { id: "Llama-3.2-3B-Instruct-q4f16_1-MLC", label: "Llama-3.2 3B Instruct", vramMB: 2263.69, contextWindow: 4096 },
  { id: "Qwen2.5-3B-Instruct-q4f16_1-MLC", label: "Qwen2.5 3B Instruct", vramMB: 2504.76, contextWindow: 4096 },
  { id: "Qwen2.5-Coder-3B-Instruct-q4f16_1-MLC", label: "Qwen2.5-Coder 3B Instruct", vramMB: 2504.76, contextWindow: 4096 },
];

/** Zielprofil: ≤ 4 GB VRAM (BENCH-PLAN §6). */
export const VRAM_BUDGET_MB = 4096;

/** Standard-Rollen (WP-BENCH-IMPL). */
export const DEFAULT_WAECHTER = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
export const DEFAULT_PLANER = "Llama-3.2-3B-Instruct-q4f16_1-MLC";
/** Sicherheits-Netz unter dem Planer (klein, zuverlässig). */
export const PLANER_FALLBACK = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

export function catalogModel(id: string): CatalogModel | undefined {
  return MODEL_CATALOG.find((m) => m.id === id);
}
