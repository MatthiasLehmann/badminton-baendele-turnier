/**
 * Hilfe-Seite mit Dokumentation des Pairing-Algorithmus
 * und allgemeiner App-Bedienung
 */

import { useState } from 'react';
import {
  HelpCircle, Shuffle, Scale, Coffee, Users, ChevronDown, ChevronRight,
  Info, CheckCircle, AlertCircle, Zap, BookOpen, Trophy, List,
} from 'lucide-react';

// ============================================================
// Typen
// ============================================================

interface Section {
  id: string;
  icon: React.FC<{ className?: string }>;
  title: string;
  content: React.ReactNode;
}

// ============================================================
// Akkordeon-Komponente
// ============================================================

function Accordion({ sections }: { sections: Section[] }) {
  const [open, setOpen] = useState<string | null>(sections[0]?.id ?? null);

  return (
    <div className="space-y-2">
      {sections.map(({ id, icon: Icon, title, content }) => {
        const isOpen = open === id;
        return (
          <div
            key={id}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
          >
            <button
              onClick={() => setOpen(isOpen ? null : id)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
              <span className="flex-1 font-bold text-gray-900 dark:text-white">{title}</span>
              {isOpen
                ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
            </button>
            {isOpen && (
              <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4">
                {content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Wiederverwendbare Layout-Bausteine
// ============================================================

function Callout({
  type = 'info',
  children,
}: {
  type?: 'info' | 'success' | 'warning';
  children: React.ReactNode;
}) {
  const styles = {
    info:    'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
  };
  const Icon = type === 'success' ? CheckCircle : type === 'warning' ? AlertCircle : Info;
  return (
    <div className={`flex gap-3 rounded-xl border px-4 py-3 text-sm ${styles[type]}`}>
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-gray-900 dark:bg-black text-green-400 rounded-xl p-4 text-sm font-mono overflow-x-auto leading-relaxed whitespace-pre">
      {children}
    </pre>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((row, i) => (
            <tr key={i} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// Visualisierung: Score-Beispiel
// ============================================================

function ScoreExample() {
  const partners = [
    { a: 'Anna', b: 'Ben',   times: 0, score: 0,  note: '✅ Noch nie zusammen' },
    { a: 'Clara', b: 'David', times: 1, score: 10, note: '⚠️ 1× gespielt' },
    { a: 'Emma', b: 'Felix', times: 2, score: 20, note: '❌ 2× gespielt' },
  ];

  return (
    <div className="space-y-2">
      {partners.map((p, i) => (
        <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
          <div className="flex-1">
            <span className="font-semibold text-gray-900 dark:text-white">{p.a} & {p.b}</span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              ({p.times}× Partner)
            </span>
          </div>
          <div className={`font-mono font-bold text-lg ${
            p.score === 0 ? 'text-green-600 dark:text-green-400' :
            p.score <= 10 ? 'text-yellow-600 dark:text-yellow-400' :
            'text-red-600 dark:text-red-400'
          }`}>
            +{p.score}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">{p.note}</div>
        </div>
      ))}
      <p className="text-xs text-gray-400 dark:text-gray-500 px-1">
        Niedrigerer Score = bessere Paarung
      </p>
    </div>
  );
}

// ============================================================
// Visualisierung: Algorithmus-Ablauf
// ============================================================

function AlgorithmFlow() {
  const steps = [
    {
      step: '1',
      title: 'Pausen-Zuteilung',
      color: 'bg-yellow-500',
      desc: 'Spieler mit wenigsten bisherigen Pausen pausieren zuerst → faire Rotation',
      icon: Coffee,
    },
    {
      step: '2',
      title: 'Zufalls-Mischung',
      color: 'bg-blue-500',
      desc: '800× die spielenden Spieler zufällig mischen (Fisher-Yates Shuffle)',
      icon: Shuffle,
    },
    {
      step: '3',
      title: 'Score berechnen',
      color: 'bg-purple-500',
      desc: 'Jede Permutation bewerten: Partner × 10 + Gegner × 5 + Stärke × 1',
      icon: Scale,
    },
    {
      step: '4',
      title: 'Bestes Ergebnis',
      color: 'bg-green-500',
      desc: 'Anordnung mit niedrigstem Score wird als Runden-Paarung verwendet',
      icon: Trophy,
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {steps.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={i} className="flex-1 flex flex-col items-center text-center gap-2">
            <div className={`w-12 h-12 rounded-full ${s.color} flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="font-bold text-gray-900 dark:text-white text-sm">{s.title}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{s.desc}</div>
            {i < steps.length - 1 && (
              <div className="hidden sm:block absolute" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Sektionen
// ============================================================

const SECTIONS: Section[] = [
  // ----------------------------------------------------------
  {
    id: 'algorithm-overview',
    icon: Shuffle,
    title: 'Pairing-Algorithmus – Überblick',
    content: (
      <div className="space-y-5">
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Das Herzstück des Bändelturniers ist der Pairing-Algorithmus. Er entscheidet,
          wer in jeder Runde mit wem zusammenspielt – und wer pausiert.
          Das Ziel: <strong className="text-gray-900 dark:text-white">möglichst wenige Wiederholungen</strong> bei
          Partner- und Gegnerkombinationen, bei gleichzeitig fairer Pausen-Verteilung.
        </p>

        <AlgorithmFlow />

        <Callout type="info">
          <strong>Stochastische Suche:</strong> Der Algorithmus probiert nicht alle möglichen
          Kombinationen (das wäre bei 20 Spielern astronomisch viele), sondern zieht
          800 zufällige Stichproben und wählt die beste. Das ist in &lt;5 ms fertig.
        </Callout>
      </div>
    ),
  },

  // ----------------------------------------------------------
  {
    id: 'quality-score',
    icon: Scale,
    title: 'Qualitätsscore (Pairing Quality Score)',
    content: (
      <div className="space-y-5">
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Jede mögliche Rundenanordnung erhält einen <strong className="text-gray-900 dark:text-white">numerischen Qualitätsscore</strong>.
          Ein niedrigerer Score bedeutet eine bessere Paarung.
          Der Score setzt sich aus drei Komponenten zusammen:
        </p>

        <Code>{`Score = Σ Partner-Wiederholung × 10
      + Σ Gegner-Wiederholung  ×  5
      + Σ Stärkedifferenz       ×  1`}</Code>

        <Table
          headers={['Komponente', 'Gewicht', 'Berechnung', 'Begründung']}
          rows={[
            ['Partner-Wiederholung', '× 10', 'Wie oft haben A & B schon zusammen gespielt?', 'Höchste Priorität – Rotation ist Kernfeature'],
            ['Gegner-Wiederholung',  '× 5',  'Wie oft hat Team A gegen Team B gespielt?',    'Wichtig, aber etwas weniger kritisch'],
            ['Stärkedifferenz',       '× 1',  '|Stärke(T1) − Stärke(T2)|',                   'Optionale Balance-Verbesserung'],
          ]}
        />

        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Beispiel: Partner-Score für ein Match</p>
        <ScoreExample />

        <Callout type="success">
          <strong>Tipp:</strong> Wenn alle Spieler bereits mehrfach zusammen gespielt haben
          (viele Runden), steigen die Scores insgesamt an – das ist normal und zeigt an,
          dass der Spielerpool vollständig „durchgemischt" wurde.
        </Callout>
      </div>
    ),
  },

  // ----------------------------------------------------------
  {
    id: 'bye-rotation',
    icon: Coffee,
    title: 'Pausen-Rotation (Bye-Zuteilung)',
    content: (
      <div className="space-y-5">
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Wenn die Spieleranzahl nicht durch 4 teilbar ist (oder mehr Spieler als Felder vorhanden sind),
          müssen einige Spieler pausieren. Der Algorithmus verteilt Pausen so fair wie möglich.
        </p>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
          <p className="font-semibold text-gray-900 dark:text-white text-sm">Schritt-für-Schritt:</p>
          <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400 list-none">
            {[
              ['Berechnung', 'Wie viele Spieler müssen pausieren? = Spieleranzahl − (min(Felder, ⌊Spieler/4⌋) × 4)'],
              ['Sortierung', 'Spieler werden aufsteigend nach bisheriger Pausenanzahl sortiert'],
              ['Zuteilung',  'Die ersten N Spieler (niedrigste Pausenanzahl) bekommen eine Pause'],
              ['Gleichstand', 'Bei gleicher Pausenanzahl entscheidet Zufall → verhindert Benachteiligung'],
            ].map(([label, desc], i) => (
              <li key={i} className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                  {i + 1}
                </span>
                <span><strong className="text-gray-900 dark:text-white">{label}:</strong> {desc}</span>
              </li>
            ))}
          </ol>
        </div>

        <Callout type="warning">
          <strong>Warum bekommen Spieler mit wenigsten Pausen die nächste Pause?</strong><br />
          Ziel ist es, die Gesamtzahl der Pausen pro Spieler anzugleichen.
          Wer noch 0 Pausen hat, soll als nächstes pausieren – so sind am Ende alle
          ungefähr gleich oft dran gewesen.
        </Callout>

        <Code>{`Beispiel: 13 Spieler, 3 Felder
  Matches = min(3, ⌊13/4⌋) = min(3, 3) = 3
  Spielende = 3 × 4 = 12
  Pausende  = 13 − 12 = 1 Spieler pausiert

  Pausenhistorie: [Anna:0, Ben:0, Clara:1, David:1, …]
  → Anna oder Ben pausieren (Zufall entscheidet)`}</Code>
      </div>
    ),
  },

  // ----------------------------------------------------------
  {
    id: 'strength-balance',
    icon: Scale,
    title: 'Spielstärken-Ausgleich',
    content: (
      <div className="space-y-5">
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Optional kann der Algorithmus die Spielstärke (1–5) berücksichtigen,
          um möglichst ausgeglichene Matches zu erzeugen.
        </p>

        <Code>{`Stärken-Strafe pro Match:
  |Stärke(Spieler1 + Spieler2) − Stärke(Spieler3 + Spieler4)| × 1

Beispiel:
  Team A: Anna (5) + Ben (1)   → Stärke 6
  Team B: Clara (3) + David (3) → Stärke 6
  Differenz: |6 − 6| = 0 → keine Strafe ✅

  Team A: Emma (5) + Felix (4) → Stärke 9
  Team B: Greta (1) + Hans (1) → Stärke 2
  Differenz: |9 − 2| = 7 → Strafe: 7 ⚠️`}</Code>

        <Callout type="info">
          Die Stärken-Gewichtung (×1) ist bewusst niedrig gehalten, damit sie die
          Partner-/Gegner-Rotation nicht dominiert. Ein Bändelturnier lebt von der
          Abwechslung, nicht von perfekter Fairness bei jedem einzelnen Match.
        </Callout>

        <Table
          headers={['Stärke', 'Bedeutung']}
          rows={[
            ['⭐ 1', 'Anfänger / Einsteiger'],
            ['⭐⭐ 2', 'Hobby-Spieler'],
            ['⭐⭐⭐ 3', 'Mittleres Niveau (Standard)'],
            ['⭐⭐⭐⭐ 4', 'Fortgeschritten'],
            ['⭐⭐⭐⭐⭐ 5', 'Sehr erfahren / Profi'],
          ]}
        />
      </div>
    ),
  },

  // ----------------------------------------------------------
  {
    id: 'algorithm-code',
    icon: Zap,
    title: 'Algorithmus im Code (vereinfacht)',
    content: (
      <div className="space-y-5">
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Der vollständige Algorithmus ist in{' '}
          <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-sm">
            src/services/pairingService.ts
          </code>{' '}
          dokumentiert. Hier der vereinfachte Ablauf:
        </p>

        <Code>{`function generatePairings(players, history, courts, strengthMap) {
  // 1. Wie viele Matches passen auf die verfügbaren Felder?
  const maxMatches = Math.min(Math.floor(players.length / 4), courts);
  const byeCount   = players.length - maxMatches * 4;

  // 2. Pausen-Spieler bestimmen (fairste Rotation)
  const { playing, byePlayers } = selectByePlayers(players, history, byeCount);

  // 3. Stochastische Suche: 800 zufällige Mischungen testen
  let bestScore = Infinity;
  let bestArrangement = [...playing];

  for (let i = 0; i < 800; i++) {
    const shuffled = shuffle([...playing]);
    const score    = scoreArrangement(shuffled, history, strengthMap);

    if (score < bestScore) {
      bestScore       = score;
      bestArrangement = shuffled;
    }
  }

  // 4. Ergebnis: Gruppen à 4 → [A,B] vs [C,D]
  return buildMatches(bestArrangement);
}

// Score-Berechnung für eine Permutation
function scoreArrangement(players, history, strengthMap) {
  let score = 0;
  for (let i = 0; i < players.length; i += 4) {
    const [a1, a2, b1, b2] = players.slice(i, i + 4);

    score += history.partners[a1]?.[a2] ?? 0) * 10; // Partner T1
    score += history.partners[b1]?.[b2] ?? 0) * 10; // Partner T2

    // Alle 4 Kreuz-Kombinationen als Gegner
    for (const pA of [a1, a2])
      for (const pB of [b1, b2])
        score += (history.opponents[pA]?.[pB] ?? 0) * 5;

    // Stärkenausgleich
    score += Math.abs(
      (strengthMap[a1] + strengthMap[a2]) -
      (strengthMap[b1] + strengthMap[b2])
    ) * 1;
  }
  return score;
}`}</Code>

        <Callout type="success">
          <strong>Performance:</strong> Bei 20 Spielern und 800 Iterationen dauert
          eine Runden-Generierung weniger als <strong>5 Millisekunden</strong> im Browser –
          vollständig ohne Backend, direkt im Client.
        </Callout>
      </div>
    ),
  },

  // ----------------------------------------------------------
  {
    id: 'limitations',
    icon: AlertCircle,
    title: 'Grenzen des Algorithmus',
    content: (
      <div className="space-y-5">
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Die stochastische Suche findet <em>sehr gute</em>, aber nicht garantiert
          die <em>optimale</em> Lösung. In der Praxis ist das kein Problem.
        </p>

        <Table
          headers={['Situation', 'Verhalten', 'Empfehlung']}
          rows={[
            [
              'Wenige Spieler (4–8)',
              'Fast immer optimale Lösung',
              'Kein Handlungsbedarf',
            ],
            [
              'Viele Runden gespielt',
              'Partner-Wiederholungen unvermeidbar',
              'Ist normal & erwartet',
            ],
            [
              'Sehr ungleiche Stärken',
              'Balance suboptimal wenn Rotation Vorrang hat',
              'Paarungen manuell anpassen',
            ],
            [
              'Spieler nachträglich hinzugefügt',
              'Ihre Historie fehlt → werden bevorzugt als Partner eingeteilt',
              'Spieler vor Turnier anlegen',
            ],
          ]}
        />

        <Callout type="warning">
          Bei sehr kleinen Gruppen (&lt;8 Spieler) steigen Wiederholungen schnell an –
          das ist mathematisch unvermeidbar. Mit mehr Spielern verbessert sich die Qualität deutlich.
        </Callout>
      </div>
    ),
  },

  // ----------------------------------------------------------
  {
    id: 'manual-adjustment',
    icon: Users,
    title: 'Manuelle Paarungsanpassung',
    content: (
      <div className="space-y-5">
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Der Algorithmus liefert einen guten Startpunkt – aber manchmal
          möchtest du Paarungen manuell anpassen (z. B. weil jemand kurzfristig nicht
          spielen kann oder du besondere Wünsche berücksichtigen möchtest).
        </p>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
          <p className="font-semibold text-gray-900 dark:text-white text-sm">So funktioniert der Paarungs-Editor:</p>
          <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400 list-none">
            {[
              'Im Tab "Runden" auf "Paarungen ändern" klicken',
              'Ersten Spieler anklicken (wird markiert/blau)',
              'Zweiten Spieler anklicken → beide werden getauscht',
              'Beliebig viele Tausche vornehmen',
              '"Paarungen speichern" klicken',
            ].map((text, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                  {i + 1}
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </div>

        <Callout type="info">
          Manuelle Änderungen werden in der Paarungshistorie <strong>berücksichtigt</strong> –
          die nächste automatische Runde weiß also, dass diese Spieler bereits zusammen gespielt haben.
        </Callout>
      </div>
    ),
  },

  // ----------------------------------------------------------
  {
    id: 'app-guide',
    icon: BookOpen,
    title: 'Bedienungsanleitung – Schritt für Schritt',
    content: (
      <div className="space-y-5">
        <div className="space-y-4">
          {[
            {
              step: '1', title: 'Spieler anlegen',
              nav: '→ Tab "Spieler"',
              desc: 'Für jeden Teilnehmer Name, Verein und Spielstärke (1–5) eintragen. Alternativ: "Beispielturnier laden" auf dem Dashboard für Testdaten.',
            },
            {
              step: '2', title: 'Turnier konfigurieren',
              nav: '→ Tab "Turnier"',
              desc: 'Turniername, Datum, Anzahl Felder und Rundendauer festlegen. Bändel-Regel konfigurieren (Standard: 1 Bändel pro Sieg).',
            },
            {
              step: '3', title: 'Teilnehmer auswählen',
              nav: '→ Tab "Turnier" → rechte Spalte',
              desc: 'Spieler für dieses Turnier auswählen oder "Alle aktiven auswählen". Abwesende Spieler können jederzeit deaktiviert werden.',
            },
            {
              step: '4', title: 'Runde generieren',
              nav: '→ Tab "Turnier" → "Runde generieren"',
              desc: 'Der Algorithmus berechnet optimale Paarungen. Paarungen können im Tab "Runden" manuell angepasst werden.',
            },
            {
              step: '5', title: 'Runde starten',
              nav: '→ Tab "Runden" → "Runde starten"',
              desc: 'Startzeitpunkt wird gespeichert. Im Beamer-Modus werden die Paarungen groß angezeigt.',
            },
            {
              step: '6', title: 'Ergebnisse eintragen',
              nav: '→ Tab "Runden" → auf Feld klicken',
              desc: 'Ergebnis per +/- Buttons eingeben. Ergebnisse können jederzeit nachträglich geändert werden.',
            },
            {
              step: '7', title: 'Runde abschließen & wiederholen',
              nav: '→ Tab "Runden" → "Runde abschließen"',
              desc: 'Danach nächste Runde generieren. Die Rangliste aktualisiert sich automatisch.',
            },
            {
              step: '8', title: 'Turnier beenden',
              nav: '→ Tab "Turnier" → "Turnier beenden"',
              desc: 'Endrangliste als CSV oder JSON exportieren. Druckansicht für Siegerurkunden.',
            },
          ].map(({ step, title, nav, desc }) => (
            <div key={step} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                {step}
              </div>
              <div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {title}
                  <span className="ml-2 text-xs font-normal text-brand-600 dark:text-brand-400">{nav}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // ----------------------------------------------------------
  {
    id: 'presentation',
    icon: List,
    title: 'Beamer-Modus',
    content: (
      <div className="space-y-5">
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Der Beamer-Modus ist für die Projektion in der Halle optimiert –
          große Schrift, hoher Kontrast, dunkler Hintergrund.
        </p>

        <Table
          headers={['Funktion', 'Beschreibung']}
          rows={[
            ['Paarungen-Ansicht', 'Alle Felder mit Teams, Ergebnisse wenn eingetragen'],
            ['Rangliste-Ansicht', 'Live-Rangliste mit Podium, Top 10'],
            ['Auto-Rotation', 'Wechselt automatisch zwischen Ansichten (5–60 Sek.)'],
            ['Vollbild', 'Button oben rechts – perfekt für Beamer'],
          ]}
        />

        <Callout type="info">
          <strong>Tipp für den Hallenbetrieb:</strong> Öffne die App auf zwei
          Geräten – eines für die Dateneingabe (Tablet), eines im Beamer-Tab
          für den Projektor. Daten werden per localStorage gespeichert –
          bei Bedarf JSON exportieren und auf dem zweiten Gerät importieren.
        </Callout>
      </div>
    ),
  },
];

// ============================================================
// Haupt-Komponente
// ============================================================

export function HelpPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-7 h-7 text-brand-600" />
          Hilfe & Dokumentation
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Bedienungsanleitung und technische Erklärung des Pairing-Algorithmus
        </p>
      </div>

      {/* Schnell-Navigation */}
      <div className="bg-brand-50 dark:bg-brand-900/20 rounded-2xl border border-brand-200 dark:border-brand-800 p-5">
        <p className="text-sm font-bold text-brand-800 dark:text-brand-300 mb-3">Themen</p>
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map(({ id, title, icon: Icon }) => (
            <button
              key={id}
              onClick={() => document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-700 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
            >
              <Icon className="w-3.5 h-3.5" />
              {title.split('–')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Sektionen */}
      <div id="sections">
        <Accordion sections={SECTIONS} />
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-600 py-4">
        Bändelturnier-App · Open Source · MIT Lizenz
      </div>
    </div>
  );
}
