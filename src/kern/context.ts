/**
 * KERN-Prototyp (explorativ): simulierter Kontext + Tokenwächter.
 *
 * Real-System: der Tokenwächter beobachtet die ECHTE Token-Nutzung des aktiven
 * Kontextfensters (LLM-Context). Prototyp: simuliert mit einem Token-Zähler, um die
 * Mechanik live zu beobachten:
 *   Context füllt sich → Tokenwächter sichert in AAMS-B (BEVOR Grenze) → Context geflusht → nichts verloren.
 *
 * WH-Referenz: WP-…-ARCH-WAEC (KERN, explorativ) — „wir werden sehen, wie es sich verhält."
 */

export interface ContextWindow {
  tokens: number; // aktuelle Nutzung
  limit: number; // Kontextfenster-Grenze
}

export interface WatchResult {
  triggered: boolean;
  ratio: number;
  reason?: string;
}

/**
 * Tokenwächter = „stumper" Heartbeat (rein mechanisch, kein LLM).
 * - beobachtet die Context-Nutzung
 * - löst die Sicherung in AAMS-B aus, BEVOR die Kontextfenster-Grenze erreicht ist
 * - danach wird der Context geflusht (tokens = 0)
 */
export class TokenWatcher {
  constructor(
    private ctx: ContextWindow,
    private threshold = 0.8,
    private onFlush?: (reason: string) => void
  ) {}

  ratio(): number {
    return this.ctx.limit === 0 ? 0 : this.ctx.tokens / this.ctx.limit;
  }

  /** Arbeit im Context verbraucht (simuliert LLM-Nutzung). */
  consume(tokens: number): void {
    this.ctx.tokens += tokens;
  }

  /** Mechanischer Check: Context fast voll? → sichern (onFlush) + flush. */
  check(): WatchResult {
    const r = this.ratio();
    if (r < this.threshold) return { triggered: false, ratio: r };
    const reason = `Context ${Math.round(r * 100)}% ≥ ${Math.round(this.threshold * 100)}%`;
    this.onFlush?.(reason);
    this.ctx.tokens = 0; // flush — danach darf neu gefüllt werden
    return { triggered: true, ratio: r, reason };
  }
}
