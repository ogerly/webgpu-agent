/**
 * LLM-Engine-Abstraktion (WH-001 §2 Decision #2: lokale Inferenz, keine Server-APIs).
 *
 * Trennt den Agenten von der konkreten Inferenz-Bibliothek (WebLLM/WebGPU).
 * → Der Agent spricht nur diese Interface; die Engine ist austauschbar
 *   (WebLLM heute, ggf. ein anderes lokales Backend morgen).
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface LLMEngine {
  /** Name/ID des geladenen (oder konfigurierten) Modells. */
  readonly modelName: string;
  /** True, wenn das Modell bereit ist (geladen + initialisiert). */
  ready(): boolean;
  /** Modell laden + initialisieren (WebGPU). Kann dauern + viel VRAM belegen. */
  load(): Promise<void>;
  /** Ein Chat-Vorhersage-Aufruf. */
  chat(messages: ChatMessage[], opts?: ChatOptions): Promise<string>;
}
