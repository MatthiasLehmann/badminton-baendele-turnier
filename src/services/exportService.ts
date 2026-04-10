/**
 * Export-Service
 * Erzeugt JSON- und CSV-Exporte der Turnierdaten.
 */

import { Player, Tournament, PlayerStats } from '../types';
import { computeAllStats } from '../utils/helpers';

// ============================================================
// JSON-Export
// ============================================================

/** Exportiert alle App-Daten als formatierten JSON-String. */
export function exportJSON(players: Player[], tournament: Tournament | null): void {
  const data = { exportedAt: new Date().toISOString(), players, tournament };
  downloadFile(
    JSON.stringify(data, null, 2),
    `baendel-turnier-${dateSlug()}.json`,
    'application/json'
  );
}

/** Exportiert nur die Spielerliste als JSON. */
export function exportPlayersJSON(players: Player[]): void {
  downloadFile(
    JSON.stringify(players, null, 2),
    `spieler-${dateSlug()}.json`,
    'application/json'
  );
}

// ============================================================
// CSV-Export
// ============================================================

/** Exportiert die Rangliste als CSV. */
export function exportStandingsCSV(
  players: Player[],
  tournament: Tournament
): void {
  const stats = computeAllStats(players, tournament);
  const playerMap = new Map(players.map((p) => [p.id, p]));

  const header = [
    'Platz',
    'Name',
    'Verein',
    'Bändel',
    'Siege',
    'Niederlagen',
    'Pausen',
    'Spiele gesamt',
    'Punkte-Differenz',
  ].join(';');

  const rows = stats.map((s, i) => {
    const p = playerMap.get(s.playerId);
    return [
      i + 1,
      p?.name ?? '?',
      p?.club ?? '',
      s.bandel,
      s.wins,
      s.losses,
      s.byes,
      s.totalGames,
      s.scoreDiff,
    ].join(';');
  });

  downloadFile(
    [header, ...rows].join('\n'),
    `rangliste-${dateSlug()}.csv`,
    'text/csv;charset=utf-8'
  );
}

/** Exportiert alle Match-Ergebnisse als CSV. */
export function exportResultsCSV(
  players: Player[],
  tournament: Tournament
): void {
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const name = (id: string) => playerMap.get(id)?.name ?? id;

  const header = [
    'Runde',
    'Feld',
    'Team 1 Spieler A',
    'Team 1 Spieler B',
    'Punkte Team 1',
    'Team 2 Spieler A',
    'Team 2 Spieler B',
    'Punkte Team 2',
    'Sieger',
  ].join(';');

  const rows: string[] = [];
  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      const winner = match.result
        ? match.result.score1 > match.result.score2
          ? 'Team 1'
          : match.result.score2 > match.result.score1
          ? 'Team 2'
          : 'Unentschieden'
        : '-';
      rows.push(
        [
          round.number,
          match.court,
          name(match.team1[0]),
          name(match.team1[1]),
          match.result?.score1 ?? '-',
          name(match.team2[0]),
          name(match.team2[1]),
          match.result?.score2 ?? '-',
          winner,
        ].join(';')
      );
    }
  }

  downloadFile(
    [header, ...rows].join('\n'),
    `ergebnisse-${dateSlug()}.csv`,
    'text/csv;charset=utf-8'
  );
}

// ============================================================
// Import
// ============================================================

/** Liest eine Datei als Text (gibt ein Promise zurück). */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
    reader.readAsText(file, 'utf-8');
  });
}

// ============================================================
// Druckfunktion
// ============================================================

/** Öffnet den Browser-Druckdialog (alle Druckstile via CSS). */
export function printPage(): void {
  window.print();
}

// ============================================================
// Hilfsfunktionen
// ============================================================

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function dateSlug(): string {
  return new Date().toISOString().slice(0, 10);
}

// Re-export damit Komponenten nur diesen Service importieren müssen
export type { PlayerStats };
