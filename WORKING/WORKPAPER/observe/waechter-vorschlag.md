**Alles klar – hier die passende Architektur.**

### Rollen-Trennung (wichtig)

| Rolle | Modell | Aufgabe | Lebensdauer |
|-------|--------|---------|-------------|
| **Superwächter** (immer an) | Sehr klein + zuverlässig | Folgt strikt, orchestriert, schreibt Wahrheit ins AAMS, entscheidet wann was geladen/entladen wird | **Immer geladen** |
| **Planer / Denker** | Intelligenter (aber noch schmal) | Versteht die Aufgabe, zerlegt in Teilaufgaben, schlägt Modell-Zuordnungen vor, liefert strukturierte Arbeitsgrundlage zurück | Bleibt geladen, **solange er noch gebraucht wird** |

Der Superwächter ist bewusst **nicht** der Kluge. Er muss nur **zuverlässig folgen** und die Wahrheit sauber dokumentieren.

---

### Empfohlene Modelle

**Superwächter (immer an):**
- `Qwen2.5-0.5B-Instruct-q4f16_1-MLC`  
  oder etwas robuster: `Qwen3-0.6B-q4f16_1-MLC`

**Planer / Denker (intelligent, aber noch handlich):**
- `Llama-3.2-3B-Instruct-q4f16_1-MLC`  
  oder `Qwen2.5-3B-Instruct-q4f16_1-MLC` / `Qwen3-4B-q4f16_1-MLC`

Diese 3B-Klasse kann Aufgaben verstehen, Teilaufgaben ausarbeiten und Vorentscheidungen zu Modellen treffen – und passt noch gut neben dem Superwächter.

---

### appConfig (Beispiel)

```ts
const appConfig = {
  model_list: [
    // === Superwächter (immer geladen) ===
    {
      model: "https://huggingface.co/mlc-ai/Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
      model_id: "superwaechter-0.5b",
      model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_xx/Qwen2-0.5B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 700,
      low_resource_required: true,
      overrides: { context_window_size: 4096 }
    },

    // === Planer / Denker ===
    {
      model: "https://huggingface.co/mlc-ai/Llama-3.2-3B-Instruct-q4f16_1-MLC",
      model_id: "planer-3b",
      model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_xx/Llama-3.2-3B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 2300,
      low_resource_required: true,
      overrides: { context_window_size: 4096 }
    },

    // Optional: noch stärkere Modelle für schwere Teilaufgaben
    // (werden nur bei Bedarf geladen)
  ]
};
```

---

### Arbeitsablauf (Supervisor-Pattern)

1. **Nutzer gibt Aufgabe** → Superwächter empfängt sie.
2. Superwächter prüft AAMS (Session, Task-Tree, bisherige Wahrheit).
3. Wenn die Aufgabe komplex ist → lädt er den **Planer-3B** (falls noch nicht geladen).
4. Planer bekommt einen knappen, klaren Prompt mit:
   - aktueller Aufgabe
   - relevantem AAMS-Ausschnitt (nur das Nötigste)
   - Auftrag: Aufgabe verstehen → Teilaufgaben zerlegen → Modell-Empfehlungen → strukturierte Arbeitsgrundlage zurückgeben
5. Planer liefert **kompaktes JSON** zurück (wenig Tokens!).
6. Superwächter nimmt dieses JSON als **erste Arbeitsgrundlage**, schreibt es wahrheitsgetreu und sparsam ins AAMS (Task-Tree + Audit-Log).
7. Superwächter führt die Teilaufgaben aus (lädt bei Bedarf weitere spezialisierte Modelle).
8. Der Planer bleibt geladen, **solange** noch Planung oder Nachsteuerung nötig ist.  
   Erst wenn klar ist „wird nicht mehr gebraucht“, wird er entladen.

---

### Token-Spar- und Wahrheits-Regeln (kritisch)

Weil der Kontext eng ist:

- Der Superwächter schreibt **nur das Wesentliche** ins AAMS.
- Jeder Eintrag muss **wahr** und nachvollziehbar sein (Datum, Quelle, Entscheidung, Begründung in 1–2 Sätzen).
- Keine langen Zusammenfassungen – lieber strukturierte, knappe Fakten.
- Der Planer wird angewiesen, extrem kompakte, maschinenlesbare Ausgaben zu liefern (JSON mit festen Feldern).

Beispiel-Struktur, die der Planer zurückgeben soll:

```json
{
  "verständnis": "kurze, präzise Formulierung der Aufgabe",
  "teilaufgaben": [
    { "id": "T1", "beschreibung": "...", "empfohlenes_modell": "planer-3b | coder-7b | ...", "priorität": 1 }
  ],
  "vorentscheidungen": ["...", "..."],
  "risiken_oder_offen": ["..."]
}
```

---
 