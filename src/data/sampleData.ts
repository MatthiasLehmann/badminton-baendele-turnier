/**
 * Beispieldaten für das Bändelturnier
 * Drei Varianten: 12, 16 und 20 Spieler
 */

import { Player, Tournament } from '../types';
import { nanoid } from '../utils/helpers';

// ============================================================
// Spieler-Pools
// ============================================================

const CLUBS = ['SC Grün-Weiß', 'TV Blaubach', 'BSV Rot-Gold', 'SpVgg Waldheim', 'FC Shuttle'];

function makePlayer(
  name: string,
  club: string,
  strength: number
): Player {
  return {
    id: nanoid(),
    name,
    club,
    strength,
    active: true,
    createdAt: new Date().toISOString(),
  };
}

/** Pool mit 20 Spielern (enthält auch die 12er und 16er Variante) */
export const SAMPLE_PLAYERS_20: Player[] = [
  makePlayer('Anna Müller',       CLUBS[0], 4),
  makePlayer('Ben Schulz',        CLUBS[1], 3),
  makePlayer('Clara Fischer',     CLUBS[0], 5),
  makePlayer('David Wagner',      CLUBS[2], 2),
  makePlayer('Emma Becker',       CLUBS[1], 4),
  makePlayer('Felix Richter',     CLUBS[3], 3),
  makePlayer('Greta Hoffmann',    CLUBS[2], 3),
  makePlayer('Hans Schneider',    CLUBS[4], 2),
  makePlayer('Ina Koch',          CLUBS[0], 5),
  makePlayer('Jan Braun',         CLUBS[3], 4),
  makePlayer('Karin Lehmann',     CLUBS[1], 1),
  makePlayer('Lars Kruse',        CLUBS[4], 3),
  makePlayer('Mia Schäfer',       CLUBS[2], 4),
  makePlayer('Nico Voigt',        CLUBS[0], 2),
  makePlayer('Olivia Bauer',      CLUBS[3], 5),
  makePlayer('Paul Neumann',      CLUBS[1], 3),
  makePlayer('Quelle Peters',     CLUBS[4], 2),
  makePlayer('Rita Zimmermann',   CLUBS[2], 4),
  makePlayer('Stefan Möller',     CLUBS[0], 3),
  makePlayer('Tanja Weber',       CLUBS[3], 5),
];

export const SAMPLE_PLAYERS_16: Player[] = SAMPLE_PLAYERS_20.slice(0, 16);
export const SAMPLE_PLAYERS_12: Player[] = SAMPLE_PLAYERS_20.slice(0, 12);

// ============================================================
// Beispiel-Turnier erstellen
// ============================================================

/**
 * Erzeugt ein vollständig vorkonfiguriertes Beispiel-Turnier
 * mit der angegebenen Spieleranzahl.
 */
export function createSampleTournament(
  players: Player[],
  size: 12 | 16 | 20 = 16
): Tournament {
  const today = new Date().toISOString().slice(0, 10);
  const courts = size <= 12 ? 3 : size <= 16 ? 4 : 5;

  return {
    id: nanoid(),
    name: `Beispiel-Bändelturnier (${size} Spieler)`,
    date: today,
    courts,
    roundDuration: 15,
    winPoints: 1,
    trackSetPoints: true,
    playerIds: players.map((p) => p.id),
    rounds: [],
    status: 'setup',
  };
}

// ============================================================
// Lade-Funktion für Beispielturnier
// ============================================================

/** Gibt Spieler und Turnier-Konfiguration für die gewählte Größe zurück. */
export function getSampleData(size: 12 | 16 | 20 = 16): {
  players: Player[];
  tournament: Tournament;
} {
  const players =
    size === 12
      ? SAMPLE_PLAYERS_12.map((p) => ({ ...p, id: nanoid() }))
      : size === 16
      ? SAMPLE_PLAYERS_16.map((p) => ({ ...p, id: nanoid() }))
      : SAMPLE_PLAYERS_20.map((p) => ({ ...p, id: nanoid() }));

  const tournament = createSampleTournament(players, size);

  return { players, tournament };
}
