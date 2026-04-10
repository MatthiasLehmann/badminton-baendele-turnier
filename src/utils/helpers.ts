/**
 * Hilfsfunktionen und berechnete Statistiken
 */

import { Player, Tournament, PlayerStats, Round } from '../types';

// ============================================================
// ID-Generierung (einfaches Nanoid-Äquivalent ohne Bibliothek)
// ============================================================

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function nanoid(size = 12): string {
  let id = '';
  for (let i = 0; i < size; i++) {
    id += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return id;
}

// ============================================================
// Statistik-Berechnung
// ============================================================

/**
 * Berechnet die Einzelstatistik eines Spielers aus den Turnierdaten.
 * Das Ergebnis wird NICHT im Store gespeichert, sondern bei Bedarf
 * neu berechnet (deterministisch aus den Runden ableitbar).
 */
export function computePlayerStats(
  playerId: string,
  rounds: Round[],
  winPoints: number
): PlayerStats {
  const stats: PlayerStats = {
    playerId,
    wins: 0,
    losses: 0,
    byes: 0,
    totalGames: 0,
    bandel: 0,
    scoreDiff: 0,
    scoreFor: 0,
    partners: {},
    opponents: {},
  };

  for (const round of rounds) {
    // Pause zählen
    if (round.byePlayers.includes(playerId)) {
      stats.byes++;
      continue;
    }

    for (const match of round.matches) {
      const inTeam1 = match.team1.includes(playerId);
      const inTeam2 = match.team2.includes(playerId);
      if (!inTeam1 && !inTeam2) continue;

      stats.totalGames++;

      // Partner zählen
      const teammates = inTeam1 ? match.team1 : match.team2;
      const partner = teammates.find((id) => id !== playerId)!;
      stats.partners[partner] = (stats.partners[partner] ?? 0) + 1;

      // Gegner zählen
      const rivals = inTeam1 ? match.team2 : match.team1;
      for (const opp of rivals) {
        stats.opponents[opp] = (stats.opponents[opp] ?? 0) + 1;
      }

      // Ergebnis auswerten
      if (match.result) {
        const myScore = inTeam1 ? match.result.score1 : match.result.score2;
        const oppScore = inTeam1 ? match.result.score2 : match.result.score1;

        stats.scoreFor += myScore;
        stats.scoreDiff += myScore - oppScore;

        if (myScore > oppScore) {
          stats.wins++;
          stats.bandel += winPoints;
        } else if (myScore < oppScore) {
          stats.losses++;
        }
        // Unentschieden: kein Zähler
      }
    }
  }

  return stats;
}

/**
 * Berechnet die Statistiken aller Turnierspieler und sortiert sie
 * nach Bändeln (absteigend), dann Punktedifferenz.
 */
export function computeAllStats(
  _players: Player[],
  tournament: Tournament
): PlayerStats[] {
  const stats = tournament.playerIds.map((id) =>
    computePlayerStats(id, tournament.rounds, tournament.winPoints)
  );

  stats.sort((a, b) => {
    if (b.bandel !== a.bandel) return b.bandel - a.bandel;
    if (b.scoreDiff !== a.scoreDiff) return b.scoreDiff - a.scoreDiff;
    return b.wins - a.wins;
  });

  return stats;
}

// ============================================================
// Formatierungsfunktionen
// ============================================================

/** Formatiert ein ISO-Datum als deutsches Datum (DD.MM.YYYY). */
export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

/** Formatiert eine Uhrzeit aus einem ISO-String (HH:MM). */
export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/** Gibt die Stärke als Sterne zurück (z. B. "★★★☆☆"). */
export function strengthToStars(strength: number): string {
  const filled = Math.round(Math.max(1, Math.min(5, strength)));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

/** Bestimmt, ob ein Match abgeschlossen ist (Ergebnis vorhanden). */
export function isMatchComplete(match: { result?: unknown }): boolean {
  return match.result !== undefined;
}

/** Gibt den Sieger-Label eines Matches zurück. */
export function matchWinner(score1: number, score2: number): 'team1' | 'team2' | 'draw' {
  if (score1 > score2) return 'team1';
  if (score2 > score1) return 'team2';
  return 'draw';
}

/** Gibt den Rang eines Spielers in der Rangliste zurück (1-basiert). */
export function getRank(
  playerId: string,
  allStats: PlayerStats[]
): number {
  return allStats.findIndex((s) => s.playerId === playerId) + 1;
}
