/**
 * Pairing-Service – Kernalgorithmus des Bändelturniers
 * =====================================================
 *
 * ## Wie der Algorithmus funktioniert
 *
 * ### Ziel
 * Für jede Runde sollen aktive Spieler so zu Doppel-Matches
 * eingeteilt werden, dass:
 *   1. Partner-Wiederholungen minimiert werden (höchste Priorität)
 *   2. Gegner-Wiederholungen minimiert werden
 *   3. Pausen fair rotieren (Spieler mit wenigsten Pausen pausieren zuerst)
 *   4. Spielstärken innerhalb eines Matches möglichst ausgeglichen sind
 *
 * ### Algorithmus (Stochastische Suche)
 *   1. **Pause-Zuteilung**: Spieler werden aufsteigend nach bisheriger
 *      Pausenanzahl sortiert. Jene mit den wenigsten Pausen bekommen als
 *      erste eine Pause, wenn Fehlstellen vorhanden sind.
 *
 *   2. **Zufallssuche**: Die verbleibenden Spieler werden `ITERATIONS`-mal
 *      zufällig gemischt. Jede Permutation wird aufgeteilt in Gruppen von 4
 *      (je 2 Teams à 2 Spieler).
 *
 *   3. **Bewertung** (Qualitätsscore, niedriger = besser):
 *      - Partner-Wiederholung × 10 (stärkste Strafe)
 *      - Gegner-Wiederholung × 5
 *      - Stärkendifferenz × 1
 *
 *   4. Die Anordnung mit dem niedrigsten Score wird zurückgegeben.
 *
 * ### Komplexität
 * Bei N=20 aktiven Spielern und 500 Iterationen läuft der
 * Algorithmus in < 5 ms im Browser.
 */

import { PairingHistory, PairingResult, Round } from '../types';

// ---- Konfiguration ----
const ITERATIONS = 800;          // Anzahl Zufalls-Iterationen
const PARTNER_PENALTY = 10;      // Strafe pro Partner-Wiederholung
const OPPONENT_PENALTY = 5;      // Strafe pro Gegner-Wiederholung
const STRENGTH_PENALTY = 1;      // Strafe pro Stärkepunkt Differenz

// ============================================================
// Öffentliche API
// ============================================================

/**
 * Hauptfunktion: Generiert optimale Paarungen für eine Runde.
 *
 * @param activePlayers - IDs der aktiven (nicht pausierten) Spieler
 * @param history       - Bisher gespielte Paarungen
 * @param courts        - Anzahl verfügbarer Felder
 * @param strengthMap   - Spielstärke pro Spieler-ID (1–5)
 */
export function generatePairings(
  activePlayers: string[],
  history: PairingHistory,
  courts: number,
  strengthMap: Record<string, number> = {}
): PairingResult {
  if (activePlayers.length < 4) {
    return { matches: [], byePlayers: activePlayers, qualityScore: 0, partnerRepeats: 0, opponentRepeats: 0 };
  }

  // 1. Anzahl Matches und Pausen ermitteln
  const maxMatches = Math.min(Math.floor(activePlayers.length / 4), courts);
  const playingCount = maxMatches * 4;
  const byeCount = activePlayers.length - playingCount;

  // 2. Pausen-Spieler auswählen (fairste Rotation)
  const { playing, byePlayers } = selectByePlayers(activePlayers, history, byeCount);

  // 3. Beste Paarung durch stochastische Suche finden
  let bestArrangement: string[] = [...playing];
  let bestScore = Infinity;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const shuffled = shuffle([...playing]);
    const score = scoreArrangement(shuffled, history, strengthMap);
    if (score < bestScore) {
      bestScore = score;
      bestArrangement = shuffled;
    }
  }

  // 4. Ergebnis aufbauen
  const matches = buildMatches(bestArrangement);
  const { partnerRepeats, opponentRepeats } = countRepeats(matches, history);

  return {
    matches,
    byePlayers,
    qualityScore: bestScore,
    partnerRepeats,
    opponentRepeats,
  };
}

/**
 * Baut die PairingHistory aus allen bisherigen Runden auf.
 * Diese Funktion wird vom Store aufgerufen, bevor generatePairings
 * verwendet wird.
 *
 * @param rounds     - Alle bisher gespielten Runden
 * @param _winPoints - (reserviert für spätere Gewichtung)
 */
export function buildPairingHistory(
  rounds: Round[],
  _winPoints: number
): PairingHistory {
  const partners: Record<string, Record<string, number>> = {};
  const opponents: Record<string, Record<string, number>> = {};
  const byes: Record<string, number> = {};

  const inc = (
    map: Record<string, Record<string, number>>,
    a: string,
    b: string
  ) => {
    if (!map[a]) map[a] = {};
    map[a][b] = (map[a][b] ?? 0) + 1;
  };

  for (const round of rounds) {
    // Pausen zählen (auch für Runden die noch 'pending' sind,
    // damit bei sofortigem Re-Generate keine Wiederholung auftritt)
    for (const pid of round.byePlayers) {
      byes[pid] = (byes[pid] ?? 0) + 1;
    }

    for (const match of round.matches) {
      const [a1, a2] = match.team1;
      const [b1, b2] = match.team2;

      // Partner-Historie (symmetrisch)
      inc(partners, a1, a2); inc(partners, a2, a1);
      inc(partners, b1, b2); inc(partners, b2, b1);

      // Gegner-Historie (symmetrisch, alle Kreuz-Kombinationen)
      inc(opponents, a1, b1); inc(opponents, b1, a1);
      inc(opponents, a1, b2); inc(opponents, b2, a1);
      inc(opponents, a2, b1); inc(opponents, b1, a2);
      inc(opponents, a2, b2); inc(opponents, b2, a2);
    }
  }

  return { partners, opponents, byes };
}

// ============================================================
// Interne Hilfsfunktionen
// ============================================================

/** Wählt Pausen-Spieler aus: jene mit den wenigsten bisherigen Pausen. */
function selectByePlayers(
  players: string[],
  history: PairingHistory,
  count: number
): { playing: string[]; byePlayers: string[] } {
  if (count === 0) return { playing: players, byePlayers: [] };

  // Aufsteigend nach Pausenanzahl sortieren, bei Gleichstand zufällig
  const sorted = [...players].sort((a, b) => {
    const diff = (history.byes[a] ?? 0) - (history.byes[b] ?? 0);
    return diff !== 0 ? diff : Math.random() - 0.5;
  });

  const byePlayers = sorted.slice(0, count);
  const playing = sorted.slice(count);
  return { playing, byePlayers };
}

/**
 * Berechnet den Qualitätsscore einer Spieler-Permutation.
 * Spieler werden in Vierergruppen aufgeteilt:
 * [i, i+1] vs [i+2, i+3]
 */
function scoreArrangement(
  players: string[],
  history: PairingHistory,
  strengthMap: Record<string, number>
): number {
  let score = 0;

  for (let i = 0; i < players.length; i += 4) {
    const a1 = players[i];
    const a2 = players[i + 1];
    const b1 = players[i + 2];
    const b2 = players[i + 3];

    if (!a1 || !a2 || !b1 || !b2) break;

    // Partner-Strafe
    score += (history.partners[a1]?.[a2] ?? 0) * PARTNER_PENALTY;
    score += (history.partners[b1]?.[b2] ?? 0) * PARTNER_PENALTY;

    // Gegner-Strafe (alle 4 Kreuz-Kombinationen)
    score += (history.opponents[a1]?.[b1] ?? 0) * OPPONENT_PENALTY;
    score += (history.opponents[a1]?.[b2] ?? 0) * OPPONENT_PENALTY;
    score += (history.opponents[a2]?.[b1] ?? 0) * OPPONENT_PENALTY;
    score += (history.opponents[a2]?.[b2] ?? 0) * OPPONENT_PENALTY;

    // Stärken-Ausgleich: |Stärke(Team1) - Stärke(Team2)| bestrafen
    const sA = (strengthMap[a1] ?? 3) + (strengthMap[a2] ?? 3);
    const sB = (strengthMap[b1] ?? 3) + (strengthMap[b2] ?? 3);
    score += Math.abs(sA - sB) * STRENGTH_PENALTY;
  }

  return score;
}

/** Baut strukturierte Match-Objekte aus einer flachen Spielerliste. */
function buildMatches(
  players: string[]
): Array<{ team1: [string, string]; team2: [string, string] }> {
  const matches: Array<{ team1: [string, string]; team2: [string, string] }> = [];
  for (let i = 0; i < players.length; i += 4) {
    if (i + 3 < players.length) {
      matches.push({
        team1: [players[i], players[i + 1]],
        team2: [players[i + 2], players[i + 3]],
      });
    }
  }
  return matches;
}

/** Zählt Partner- und Gegner-Wiederholungen in einer Runde. */
function countRepeats(
  matches: Array<{ team1: [string, string]; team2: [string, string] }>,
  history: PairingHistory
): { partnerRepeats: number; opponentRepeats: number } {
  let partnerRepeats = 0;
  let opponentRepeats = 0;

  for (const { team1, team2 } of matches) {
    if ((history.partners[team1[0]]?.[team1[1]] ?? 0) > 0) partnerRepeats++;
    if ((history.partners[team2[0]]?.[team2[1]] ?? 0) > 0) partnerRepeats++;
    for (const a of team1) {
      for (const b of team2) {
        if ((history.opponents[a]?.[b] ?? 0) > 0) opponentRepeats++;
      }
    }
  }

  return { partnerRepeats, opponentRepeats };
}

/** Fisher-Yates Shuffle */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
