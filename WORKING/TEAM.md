# TEAM.md — Dynamisches Roster

> Wer arbeitet hier? Name optional. **TEAM oder SOLO: gleiche Struktur, null Unterschied.**
> `create_if_missing` — nie überschreiben, nur ergänzen.

## Roster

| Name | Typ | Tool | Modell | Capability | Note |
|------|-----|------|--------|------------|------|
| — | agent | opencode | qwen/qwen3.8-27b | local | AAMS-Bootstrap (2026-10-16) |

## Felder

- **name** — optional (nur wenn bekannt, sonst `—`)
- **type** — `human` | `agent`
- **tool** — aktives Tool (opencode, claude-code, cursor, …)
- **model** — volle Modell-ID (z. B. `qwen/qwen3.8-27b`)
- **capability** — `local` | `frontier` (LAN/LM-Studio → local; Cloud → frontier)
- **note** — optional

## Erkennung (passiv)

Authorship wird **passiv** erkannt (tool_detection + Runtime-Konfiguration),
nie vom Menschen abgefragt.
