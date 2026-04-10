/**
 * Rangliste und Spieler-Statistiken
 */

import { useState } from 'react';
import {
  Trophy, BarChart2, Download, ChevronDown, ChevronUp, Info,
} from 'lucide-react';
import { useStore } from '../store';
import { PlayerStats } from '../types';
import { computeAllStats, strengthToStars } from '../utils/helpers';
import { exportStandingsCSV, exportResultsCSV } from '../services/exportService';
import { Badge } from './shared/Badge';
import { Button } from './shared/Button';
import { Modal } from './shared/Modal';

// ============================================================
// Detail-Modal für einen Spieler
// ============================================================

interface PlayerDetailProps {
  stats: PlayerStats;
  playerMap: Map<string, string>;
}

function PlayerDetail({ stats, playerMap }: PlayerDetailProps) {
  const name = (id: string) => playerMap.get(id) ?? id;

  const partners = Object.entries(stats.partners)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const opponents = Object.entries(stats.opponents)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Kern-Statistik */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.bandel}</div>
          <div className="text-xs text-green-600 dark:text-green-500 mt-0.5">Bändel</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.wins}</div>
          <div className="text-xs text-blue-600 dark:text-blue-500 mt-0.5">Siege</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{stats.losses}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Niederlagen</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.byes}</div>
          <div className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">Pausen</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.totalGames}</div>
          <div className="text-xs text-purple-600 dark:text-purple-500 mt-0.5">Spiele gesamt</div>
        </div>
        <div className={`rounded-xl p-3 text-center ${stats.scoreDiff >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <div className={`text-2xl font-bold ${stats.scoreDiff >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {stats.scoreDiff >= 0 ? '+' : ''}{stats.scoreDiff}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Punktediff.</div>
        </div>
      </div>

      {/* Partner */}
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">
          Bisherige Partner
        </h3>
        {partners.length === 0 ? (
          <p className="text-sm text-gray-400">Noch keine Spiele.</p>
        ) : (
          <div className="space-y-1">
            {partners.map(([id, count]) => (
              <div key={id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{name(id)}</span>
                <Badge color="blue">{count}×</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gegner */}
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">
          Häufigste Gegner
        </h3>
        {opponents.length === 0 ? (
          <p className="text-sm text-gray-400">Noch keine Spiele.</p>
        ) : (
          <div className="space-y-1">
            {opponents.map(([id, count]) => (
              <div key={id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{name(id)}</span>
                <Badge color="gray">{count}×</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Rangliste
// ============================================================

export function Standings() {
  const { players, tournament } = useStore();
  const [detailPlayer, setDetailPlayer] = useState<PlayerStats | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  if (!tournament) {
    return (
      <div className="text-center py-20">
        <Trophy className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
        <h2 className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-2">
          Kein Turnier aktiv
        </h2>
        <p className="text-gray-400 dark:text-gray-600">
          Starte ein Turnier, um die Rangliste zu sehen.
        </p>
      </div>
    );
  }

  const allStats = computeAllStats(players, tournament);
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const nameMap = new Map(players.map((p) => [p.id, p.name]));

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const completedRounds = tournament.rounds.filter((r) => r.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 text-yellow-500" />
            Rangliste
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">
            {tournament.name} · {completedRounds} Runde(n) abgeschlossen
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary" size="sm" icon={Download}
            onClick={() => exportStandingsCSV(players, tournament)}
          >
            Rangliste CSV
          </Button>
          <Button
            variant="secondary" size="sm" icon={BarChart2}
            onClick={() => exportResultsCSV(players, tournament)}
          >
            Ergebnisse CSV
          </Button>
        </div>
      </div>

      {/* Podium (Top 3) */}
      {allStats.length >= 3 && completedRounds > 0 && (
        <div className="flex items-end justify-center gap-4 py-6">
          {/* Platz 2 */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl">🥈</div>
            <div className="text-center">
              <div className="font-bold text-gray-900 dark:text-white text-sm">{playerMap.get(allStats[1].playerId)?.name}</div>
              <div className="text-gray-500 dark:text-gray-400 text-xs">{allStats[1].bandel} Bändel</div>
            </div>
            <div className="w-20 h-16 bg-gray-300 dark:bg-gray-600 rounded-t-lg flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">2</div>
          </div>
          {/* Platz 1 */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-3xl">🥇</div>
            <div className="text-center">
              <div className="font-bold text-gray-900 dark:text-white">{playerMap.get(allStats[0].playerId)?.name}</div>
              <div className="text-yellow-600 dark:text-yellow-400 text-sm font-semibold">{allStats[0].bandel} Bändel</div>
            </div>
            <div className="w-24 h-24 bg-yellow-400 dark:bg-yellow-700 rounded-t-lg flex items-center justify-center font-bold text-white text-xl">1</div>
          </div>
          {/* Platz 3 */}
          {allStats[2] && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xl">🥉</div>
              <div className="text-center">
                <div className="font-bold text-gray-900 dark:text-white text-sm">{playerMap.get(allStats[2].playerId)?.name}</div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">{allStats[2].bandel} Bändel</div>
              </div>
              <div className="w-18 h-12 bg-orange-300 dark:bg-orange-700 rounded-t-lg flex items-center justify-center font-bold text-white">3</div>
            </div>
          )}
        </div>
      )}

      {/* Ranglisten-Tabelle */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm print:shadow-none">
        {/* Header */}
        <div className="grid grid-cols-[auto_2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <span>#</span>
          <span>Name</span>
          <span className="text-center">🏅 Bändel</span>
          <span className="text-center hidden sm:block">Siege</span>
          <span className="text-center hidden sm:block">Ndl.</span>
          <span className="text-center hidden md:block">Pausen</span>
          <span className="text-center hidden md:block">Spiele</span>
          <span></span>
        </div>

        {allStats.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-600">
            <p>Noch keine Ergebnisse eingetragen.</p>
          </div>
        ) : (
          allStats.map((s, i) => {
            const player = playerMap.get(s.playerId);
            const expanded = expandedRows.has(s.playerId);

            return (
              <div key={s.playerId}>
                <div
                  className={`grid grid-cols-[auto_2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                    i === 0 ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''
                  }`}
                  onClick={() => toggleRow(s.playerId)}
                >
                  {/* Rang */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-yellow-400 text-white' :
                    i === 1 ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white' :
                    i === 2 ? 'bg-orange-300 text-white' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {i + 1}
                  </div>

                  {/* Name + Verein */}
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white truncate">
                      {player?.name ?? s.playerId}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {player?.club || ''} {player ? strengthToStars(player.strength) : ''}
                    </div>
                  </div>

                  {/* Bändel */}
                  <div className="text-center">
                    <span className="text-lg font-bold text-brand-700 dark:text-brand-400">{s.bandel}</span>
                  </div>

                  {/* Siege */}
                  <div className="text-center text-green-600 dark:text-green-400 font-semibold hidden sm:block">
                    {s.wins}
                  </div>

                  {/* Niederlagen */}
                  <div className="text-center text-gray-500 dark:text-gray-400 hidden sm:block">
                    {s.losses}
                  </div>

                  {/* Pausen */}
                  <div className="text-center text-yellow-600 dark:text-yellow-400 hidden md:block">
                    {s.byes}
                  </div>

                  {/* Spiele */}
                  <div className="text-center text-gray-500 dark:text-gray-400 hidden md:block">
                    {s.totalGames}
                  </div>

                  {/* Detail-Toggle */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDetailPlayer(s); }}
                      className="p-1 rounded text-gray-400 hover:text-brand-600 transition-colors"
                      title="Details"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    {expanded
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* Inline-Detail */}
                {expanded && (
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                    <div className="grid sm:grid-cols-2 gap-6 text-sm">
                      <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Partner (nach Häufigkeit)</p>
                        {Object.entries(s.partners).length === 0 ? (
                          <span className="text-gray-400">–</span>
                        ) : (
                          Object.entries(s.partners)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 5)
                            .map(([id, c]) => (
                              <div key={id} className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">{nameMap.get(id) ?? id}</span>
                                <span className="text-gray-400">{c}×</span>
                              </div>
                            ))
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Punktediff.: {s.scoreDiff >= 0 ? '+' : ''}{s.scoreDiff}</p>
                        <p className="text-gray-500 dark:text-gray-400">Eigene Punkte: {s.scoreFor}</p>
                        <p className="text-gray-500 dark:text-gray-400">Win-Rate: {s.totalGames > 0 ? Math.round((s.wins / s.totalGames) * 100) : 0}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Spieler-Detail-Modal */}
      {detailPlayer && (
        <Modal
          title={`${playerMap.get(detailPlayer.playerId)?.name ?? ''} – Statistik`}
          onClose={() => setDetailPlayer(null)}
        >
          <PlayerDetail
            stats={detailPlayer}
            playerMap={nameMap}
          />
        </Modal>
      )}
    </div>
  );
}
