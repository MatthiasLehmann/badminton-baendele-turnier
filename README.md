# 🏸 Bändelturnier-App

Eine vollständige Web-App für **Badminton-Bändelturniere** (Schleifchenturnier) mit rotierenden Doppelpartnern.

## Schnellstart

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Entwicklungsserver starten
npm run dev

# Öffne http://localhost:5173 im Browser
```

## Features

| Feature | Beschreibung |
|---|---|
| **Spielerverwaltung** | Spieler anlegen, bearbeiten, Stärke 1–5, aktiv/pausiert |
| **Turnierkonfiguration** | Name, Datum, Felder, Rundendauer, Bändel-Regel |
| **Automatische Paarungen** | Heuristischer Algorithmus minimiert Wiederholungen |
| **Manuelle Anpassung** | Paarungen per Drag & Drop-ähnlichem Swap tauschen |
| **Ergebniserfassung** | Punkteingabe mit großen Buttons, nachträgliche Änderung |
| **Live-Rangliste** | Sortierung nach Bändeln, Punktedifferenz |
| **Spieler-Statistiken** | Partner-/Gegner-Historie, Win-Rate, Pausen |
| **Beamer-Modus** | Große Ansicht für TV/Beamer, Auto-Rotation |
| **Import / Export** | JSON (komplett), CSV (Rangliste + Ergebnisse) |
| **Dark Mode** | Für alle Lichtverhältnisse |
| **Druckansicht** | Browser-Druck-Optimierung |
| **Beispieldaten** | 12, 16, 20 Spieler – sofort spielbereit |

## Algorithmus – Pairing-Heuristik

Der Pairing-Algorithmus verwendet **stochastische Suche** (Monte-Carlo):

### Ablauf

1. **Pausen-Zuteilung**: Spieler werden nach bisheriger Pausenanzahl sortiert.  
   → Wer am wenigsten pausiert hat, bekommt als erstes eine Pause (faire Rotation).

2. **Zufallssuche**: Die spielenden Spieler werden 800× zufällig gemischt.  
   Jede Permutation wird in Vierergruppen aufgeteilt: `[A, B]` vs `[C, D]`.

3. **Qualitätsbewertung** (niedriger = besser):
   ```
   Score = Σ (Partner-Wiederholung × 10)
         + Σ (Gegner-Wiederholung × 5)
         + Σ (Stärkendifferenz × 1)
   ```

4. Die Anordnung mit dem **niedrigsten Score** wird verwendet.

### Gewichtung

| Kriterium | Gewicht | Begründung |
|---|---|---|
| Partner-Wiederholung | 10 | Höchste Priorität – Rotation ist das Kern-Feature |
| Gegner-Wiederholung | 5 | Wichtig, aber weniger kritisch als Partner |
| Stärken-Ausgleich | 1 | Optionale Verbesserung der Match-Qualität |

### Performance

- 20 Spieler, 800 Iterationen: **< 5 ms** im Browser
- Der Score wird als Qualitätsindikator in der Konsole ausgegeben

## Projektstruktur

```
src/
├── types/
│   └── index.ts              # Alle TypeScript-Typen
├── store/
│   └── index.ts              # Zustand (Zustand + localStorage)
├── services/
│   ├── pairingService.ts     # Pairing-Algorithmus
│   └── exportService.ts      # JSON/CSV Export
├── data/
│   └── sampleData.ts         # Beispieldaten (12/16/20 Spieler)
├── utils/
│   └── helpers.ts            # Statistik, Formatierung
├── components/
│   ├── shared/               # Modal, Badge, Button
│   ├── Dashboard.tsx         # Übersicht / Startseite
│   ├── PlayerManager.tsx     # Spielerverwaltung
│   ├── TournamentSetup.tsx   # Turnier + Steuerung
│   ├── RoundView.tsx         # Runden + Ergebniseingabe
│   ├── Standings.tsx         # Rangliste + Statistiken
│   └── PresentationMode.tsx  # Beamer-Ansicht
├── App.tsx                   # Navigation + Layout
└── main.tsx                  # Einstiegspunkt
```

## Datenhaltung

Alle Daten werden im **Browser-localStorage** gespeichert (`badminton-baendele-turnier-v1`).  
Es ist kein Backend erforderlich. Die App läuft vollständig lokal.

Für Backups: **Turnier → Export JSON** (kompletter Datenexport).

## Bedienung im Turnier

1. **Spieler anlegen** (oder Beispielturnier laden)
2. **Turnier** → Konfigurieren → Spieler auswählen
3. **Runde generieren** → Paarungen prüfen (ggf. manuell anpassen)
4. **Runde starten** → Ergebnisse eintragen
5. **Runde abschließen** → Nächste Runde generieren
6. Am Ende: **Turnier beenden** → Rangliste exportieren

## Beamer-Modus

1. Tab **Beamer** öffnen
2. Vollbild-Button → F11 (oder Browser-Vollbild)
3. Auto-Rotation zwischen Paarungen und Rangliste einschalten
4. Auf separatem Gerät/Browser-Fenster öffnen für eigenes Beamer-Display

## Deployment

### Option A: Statisches Hosting (empfohlen)

```bash
npm run build          # Erstellt dist/ Ordner
# Inhalt von dist/ auf beliebigen Webserver hochladen
```

Kostenlose Optionen:
- **Netlify**: `netlify deploy --dir=dist`
- **Vercel**: `vercel --prod`
- **GitHub Pages**: `gh-pages -d dist`

### Option B: Lokal mit Vorschau

```bash
npm run build && npm run preview
# Läuft auf http://localhost:4173
```

### Option C: Docker

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

## Technik

| Technologie | Version | Zweck |
|---|---|---|
| React | 18 | UI-Framework |
| TypeScript | 5 | Typsicherheit |
| Vite | 6 | Build-Tool |
| Zustand | 5 | State-Management |
| Tailwind CSS | 3 | Styling |
| Lucide React | – | Icons |

## Lizenz

MIT – freie Nutzung für Vereins- und Freizeitturniere.
