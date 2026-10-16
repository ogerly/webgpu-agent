# TOOLS-LIST — Manuell kuratierte Agent-Tools

> **Ansatz (Decision):** Tools werden **manuell** ausgewählt — keine Auto-Erkennung, kein
> übercomplexes Tool-System. Wir führen eine Liste nützlicher Tools; der Agent nutzt nur diese.

## Prinzip
- Kleine, klare, austauschbare Tools (Funktionen + Helfer-Modelle).
- Jedes Tool: Name · Zweck · Typ (Funktion | Modell) · Status (Kandidat | aktiv | aus).
- Der **Superwächter** entscheidet, ob/wann ein Tool gebraucht wird (siehe KERN-WP `ARCH-WAEC`).

## Kandidaten (starter — zu kuratieren)
| Tool | Zweck | Typ | Status |
|------|-------|-----|--------|
| **Web-Fetch** | URL laden + Text extrahieren | Funktion | Kandidat |
| **OCR** | Bild → Text (Helfer-Modell) | Modell | Kandidat |
| **Translation** | Text übersetzen (Helfer-Modell) | Modell | Kandidat |
| **Summarizer** | Text zusammenfassen (Planer/Helfer-Modell) | Modell | Kandidat |
| **Datei-Leser** | lokale Datei einlesen (AAMS-B) | Funktion | Kandidat |
| **Suche** | Text/Dateien in AAMS-B durchsuchen | Funktion | Kandidat |
| **Zeit/Datum** | aktuelle Zeit/Zeitzone | Funktion | Kandidat |
| **Rechner** | einfache Berechnungen | Funktion | Kandidat |

## Offene
- [ ] Liste endgültig kürzen auf die 3–5 nützlichsten
- [ ] pro Tool: Interface (Input/Output) definieren
- [ ] Umsetzung in `src/tools/` (erst nach KERN + WH)
