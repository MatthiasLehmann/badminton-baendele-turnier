/**
 * Dashboard – Übersicht und Schnellzugriff
 */

import { Trophy, Users, Shuffle, BarChart2, Monitor, Star, PlayCircle } from 'lucide-react';
import { useStore } from '../store';
import { computeAllStats } from '../utils/helpers';
import { getSampleData } from '../data/sampleData';
import { Button } from './shared/Button';
import { Badge } from './shared/Badge';

export function Dashboard() {
  const { players, tournament, setView, importPlayers, createTournament, addPlayerToTournament } = useStore();

  const activePlayers = players.filter((p) => p.active);
  const allStats = tournament ? computeAllStats(players, tournament) : [];
  const currentRound = tournament?.rounds[tournament.rounds.length - 1];
  const playerMap = new Map(players.map((p) => [p.id, p.name]));

  const loadSample = (size: 12 | 16 | 20) => {
    const { players: sPlayers, tournament: sTournament } = getSampleData(size);
    importPlayers(sPlayers);
    createTournament({
      name: sTournament.name,
      date: sTournament.date,
      courts: sTournament.courts,
      roundDuration: sTournament.roundDuration,
      winPoints: sTournament.winPoints,
      trackSetPoints: sTournament.trackSetPoints,
    });
    setTimeout(() => {
      sPlayers.forEach((p) => addPlayerToTournament(p.id));
    }, 0);
    setView('tournament');
  };

  return (
    <div className="space-y-8">
      {/* Willkommen */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black mb-1">🏸 Bändelturnier</h1>
            <p className="text-brand-100 text-lg">
              {tournament
                ? tournament.name
                : 'Badminton-Schleifchenturnier mit rotierenden Partnern'}
            </p>
          </div>
          {tournament && (
            <Badge color="green" >
              {tournament.status === 'running' ? 'Turnier läuft' : tournament.status === 'completed' ? 'Abgeschlossen' : 'Vorbereitung'}
            </Badge>
          )}
        </div>

        {/* Schnell-Aktionen */}
        {tournament && (
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => setView('rounds')}
              className="bg-white/20 hover:bg-white/30 text-white rounded-xl px-5 py-2.5 font-semibold transition-all flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />Aktuelle Runde
            </button>
            <button
              onClick={() => setView('presentation')}
              className="bg-white/20 hover:bg-white/30 text-white rounded-xl px-5 py-2.5 font-semibold transition-all flex items-center gap-2"
            >
              <Monitor className="w-4 h-4" />Beamer-Ansicht
            </button>
            <button
              onClick={() => setView('standings')}
              className="bg-white/20 hover:bg-white/30 text-white rounded-xl px-5 py-2.5 font-semibold transition-all flex items-center gap-2"
            >
              <BarChart2 className="w-4 h-4" />Rangliste
            </button>
          </div>
        )}
      </div>

      {!tournament ? (
        /* ---- Kein Turnier: Onboarding ---- */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 cursor-pointer hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all group"
            onClick={() => setView('players')}
          >
            <Users className="w-8 h-8 text-gray-400 group-hover:text-brand-600 mb-3 transition-colors" />
            <h3 className="font-bold text-gray-800 dark:text-white mb-1">1. Spieler anlegen</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {players.length > 0 ? `${players.length} Spieler vorhanden` : 'Noch keine Spieler'}
            </p>
          </div>
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 cursor-pointer hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all group"
            onClick={() => setView('tournament')}
          >
            <Trophy className="w-8 h-8 text-gray-400 group-hover:text-brand-600 mb-3 transition-colors" />
            <h3 className="font-bold text-gray-800 dark:text-white mb-1">2. Turnier erstellen</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Felder, Dauer, Punkte-Regel konfigurieren</p>
          </div>
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 cursor-pointer hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all group"
            onClick={() => setView('rounds')}
          >
            <Shuffle className="w-8 h-8 text-gray-400 group-hover:text-brand-600 mb-3 transition-colors" />
            <h3 className="font-bold text-gray-800 dark:text-white mb-1">3. Runden spielen</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Paarungen generieren, Ergebnisse eintragen</p>
          </div>

          {/* Beispielturnier */}
          <div className="sm:col-span-2 lg:col-span-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-800 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-yellow-500" />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Schnellstart: Beispielturnier laden</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Vordefinierte Spieler und Einstellungen – sofort spielbereit</p>
                </div>
              </div>
              <div className="flex gap-2">
                {([12, 16, 20] as const).map((n) => (
                  <Button key={n} variant="secondary" size="sm" onClick={() => loadSample(n)}>
                    {n} Spieler
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ---- Turnier vorhanden: Status-Karten ---- */
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Spieler */}
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:shadow-md transition-shadow shadow-sm"
            onClick={() => setView('players')}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Spieler</span>
              <Users className="w-5 h-5 text-brand-600" />
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white">{tournament.playerIds.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{activePlayers.length} aktiv gesamt</div>
          </div>

          {/* Runden */}
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:shadow-md transition-shadow shadow-sm"
            onClick={() => setView('rounds')}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Runden</span>
              <Shuffle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white">{tournament.rounds.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {tournament.rounds.filter((r) => r.status === 'completed').length} abgeschlossen
            </div>
          </div>

          {/* Führender */}
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:shadow-md transition-shadow shadow-sm"
            onClick={() => setView('standings')}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Führend</span>
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            {allStats[0] ? (
              <>
                <div className="text-lg font-black text-gray-900 dark:text-white truncate">
                  {playerMap.get(allStats[0].playerId)}
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400 mt-1 font-semibold">
                  {allStats[0].bandel} Bändel · {allStats[0].wins} Siege
                </div>
              </>
            ) : (
              <div className="text-gray-400 mt-2">Noch keine Ergebnisse</div>
            )}
          </div>

          {/* Status */}
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:shadow-md transition-shadow shadow-sm"
            onClick={() => setView('tournament')}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Status</span>
              <Monitor className="w-5 h-5 text-purple-600" />
            </div>
            <Badge color={tournament.status === 'running' ? 'green' : tournament.status === 'completed' ? 'gray' : 'blue'}>
              {tournament.status === 'setup' ? 'Vorbereitung' : tournament.status === 'running' ? 'Läuft' : 'Abgeschlossen'}
            </Badge>
            {currentRound && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Runde {currentRound.number}: {currentRound.status === 'active' ? '● Aktiv' : currentRound.status === 'completed' ? '✓ Fertig' : 'Bereit'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Aktuelle Paarungen (Mini-Vorschau) */}
      {currentRound && currentRound.status === 'active' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Aktuelle Runde {currentRound.number}
            </h2>
            <button
              onClick={() => setView('rounds')}
              className="text-sm text-brand-600 dark:text-brand-400 hover:underline font-semibold"
            >
              Alle Ergebnisse →
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentRound.matches.slice(0, 6).map((match) => (
              <div
                key={match.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between shadow-sm"
              >
                <div className="text-sm">
                  <div className="font-semibold text-gray-900 dark:text-white text-xs mb-0.5">Feld {match.court}</div>
                  <div className="text-gray-600 dark:text-gray-400 truncate max-w-[140px]">
                    {playerMap.get(match.team1[0])} & {playerMap.get(match.team1[1])}
                  </div>
                  <div className="text-gray-400 dark:text-gray-500 text-xs">vs</div>
                  <div className="text-gray-600 dark:text-gray-400 truncate max-w-[140px]">
                    {playerMap.get(match.team2[0])} & {playerMap.get(match.team2[1])}
                  </div>
                </div>
                {match.result ? (
                  <Badge color="green">✓ {match.result.score1}:{match.result.score2}</Badge>
                ) : (
                  <Badge color="gray">–</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mini-Rangliste */}
      {allStats.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Aktuelle Rangliste (Top 5)
            </h2>
            <button
              onClick={() => setView('standings')}
              className="text-sm text-brand-600 dark:text-brand-400 hover:underline font-semibold"
            >
              Vollständige Rangliste →
            </button>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 shadow-sm overflow-hidden">
            {allStats.slice(0, 5).map((s, i) => (
              <div
                key={s.playerId}
                className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  i === 0 ? 'bg-yellow-400 text-white' :
                  i === 1 ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white' :
                  i === 2 ? 'bg-orange-300 text-white' :
                  'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {i + 1}
                </span>
                <span className="flex-1 font-semibold text-gray-900 dark:text-white truncate">
                  {playerMap.get(s.playerId)}
                </span>
                <span className="font-bold text-brand-700 dark:text-brand-400">{s.bandel} 🏅</span>
                <span className="text-sm text-gray-400 hidden sm:block">{s.wins}S · {s.losses}N</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
