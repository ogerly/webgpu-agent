/**
 * LLM-Engine-Abstraktion (WH-001 §2 Decision #2: lokale Inferenz, keine Server-APIs).
 *
 * Trennt den Agenten von der konkreten Inferenz-Bibliothek (WebLLM/WebGPU).
 * → Der Agent spricht nur diese Interface; die Engine ist austauschbar
 *   (WebLLM heute, ggf. ein anderes lokales Backend morgen).
 *
 * WP-BENCH-IMPL: `unload()` (VRAM frei, für Modell-Pool) + echte Token-Usage.
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

/** Echte Token-Zahlen (aus der Inferenz, `usage` — keine Schätzung). */
export interface ChatUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface ChatResult {
  content: string;
  usage?: ChatUsage;
}

export interface LLMEngine {
  /** Name/ID des geladenen (oder konfigurierten) Modells. */
  readonly modelName: string;
  /** True, wenn das Modell bereit ist (geladen + initialisiert). */
  ready(): boolean;
  /** Modell laden + initialisieren (WebGPU). Kann dauern + viel VRAM belegen. */
  load(): Promise<void>;
  /** Ein Chat-Vorhersage-Aufruf (mit echten Token-Zahlen, falls verfügbar). */
  chat(messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResult>;
  /** Modell entladen → VRAM frei (Modell-Pool: on-demand Laden/Entladen). */
  unload(): Promise<void>;
}
