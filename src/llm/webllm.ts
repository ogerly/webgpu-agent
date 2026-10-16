/**
 * WebLLM-Adapter (WH-001 §4 Inference: WebLLM, WebGPU).
 *
 * **Lazy:** Die (schwere) WebLLM-Lib + Model-Weights werden erst bei `load()`
 * geladen (dynamischer Import). → Das Scaffold läuft ohne Model-Download.
 * Typen (`import type`) werden zur Laufzeit **nicht** geladen.
 *
 * WebGPU-Voraussetzung: Browser mit WebGPU (aktuelle Chrome/Edge).
 */
import type {
  ChatCompletionMessageParam,
  InitProgressCallback,
  MLCEngine,
} from "@mlc-ai/web-llm";
import type { ChatMessage, ChatOptions, LLMEngine } from "./engine";

export interface WebLLMOptions {
  /** Modell-ID. Default: kompaktes Instruct-Modell (passt in Consumer-VRAM). */
  model?: string;
  /** Fortschritt beim Modell-Load (Download + Init). */
  initProgressCallback?: InitProgressCallback;
}

const DEFAULT_MODEL = "Llama-3.2-3B-Instruct-q4f16_1-MLC";

/** Mappt ein internes ChatMessage auf einen WebLLM-Param (variante-konform). */
function toParam(m: ChatMessage): ChatCompletionMessageParam {
  if (m.role === "system") return { role: "system", content: m.content };
  if (m.role === "assistant") return { role: "assistant", content: m.content };
  return { role: "user", content: m.content };
}

export class WebLLMEngine implements LLMEngine {
  private engine: MLCEngine | null = null;

  constructor(private opts: WebLLMOptions = {}) {}

  get modelName(): string {
    return this.opts.model ?? DEFAULT_MODEL;
  }

  ready(): boolean {
    return this.engine !== null;
  }

  async load(): Promise<void> {
    if (this.engine) return;
    // Dynamischer Import — WebLLM wird erst zur Laufzeit geladen (keine Build-Zwang).
    const { CreateMLCEngine } = await import(/* @vite-ignore */ "@mlc-ai/web-llm");
    const engineConfig = this.opts.initProgressCallback
      ? { initProgressCallback: this.opts.initProgressCallback }
      : undefined;
    this.engine = await CreateMLCEngine(this.modelName, engineConfig);
  }

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
    if (!this.engine) {
      throw new Error("WebLLM-Engine nicht geladen — zuerst `load()` aufrufen.");
    }
    const res = await this.engine.chat.completions.create({
      messages: messages.map(toParam),
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 1024,
    });
    // `content` ist `string | null` → sicher auf string mappen.
    return res.choices[0]?.message?.content ?? "";
  }
}
