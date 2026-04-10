/**
 * Präsentationsmodus – Beamer / TV Ansicht
 * - Große Schrift, optimiert für Distanz
 * - Paarungen + Rangliste
 * - Automatischer Wechsel zwischen Ansichten (optional)
 * - Vollbild-Button
 */

import { useState, useEffect } from 'react';
import { Monitor, RefreshCw, Maximize2, Trophy, Swords } from 'lucide-react';
import { useStore } from '../store';
import { computeAllStats } from '../utils/helpers';

// ============================================================
// Paarungen-Ansicht (Beamer)
// ============================================================

function PresentationRound() {
  const { players, tournament } = useStore();
  if (!tournament) return null;

  const lastRound = tournament.rounds[tournament.rounds.length - 1];
  if (!lastRound) return (
    <div className="text-center py-20 text-white/50 text-3xl">Noch keine Runden</div>
  );

  const playerMap = new Map(players.map((p) => [p.id, p.name]));
  const name = (id: string) => playerMap.get(id) ?? id;

  return (
    <div className="space-y-8">
      {/* Runden-Header */}
      <div className="text-center">
        <div className="text-white/60 text-xl uppercase tracking-widest font-semibold mb-1">
          {tournament.name}
        </div>
        <div className="text-white text-5xl font-black">
          Runde {lastRound.number}
        </div>
        <div className="mt-2 flex justify-center gap-4 text-white/60 text-lg">
          <span>{lastRound.matches.length} Matches</span>
          {lastRound.byePlayers.length > 0 && (
            <span>· {lastRound.byePlayers.length} Pause</span>
          )}
        </div>
      </div>

      {/* Match-Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
        {lastRound.matches.map((match) => (
          <div key={match.id} className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
            {/* Feld */}
            <div className="text-white/60 text-lg font-semibold mb-4 text-center uppercase tracking-wider">
              Feld {match.court}
            </div>

            {/* Teams */}
            <div className="space-y-3">
              {/* Team 1 */}
              <div className={`bg-white/10 rounded-2xl px-5 py-3 ${match.result && match.result.score1 > match.result.score2 ? 'ring-2 ring-yellow-400' : ''}`}>
                <div className="text-white font-bold text-xl leading-tight">{name(match.team1[0])}</div>
                <div className="text-white font-bold text-xl leading-tight">{name(match.team1[1])}</div>
              </div>

              {/* Ergebnis / VS */}
              <div className="text-center">
                {match.result ? (
                  <span className="text-white text-4xl font-black tabular-nums">
                    {match.result.score1} : {match.result.score2}
                  </span>
                ) : (
                  <span className="text-white/50 text-2xl font-bold">vs</span>
                )}
              </div>

              {/* Team 2 */}
              <div className={`bg-white/10 rounded-2xl px-5 py-3 ${match.result && match.result.score2 > match.result.score1 ? 'ring-2 ring-yellow-400' : ''}`}>
                <div className="text-white font-bold text-xl leading-tight">{name(match.team2[0])}</div>
                <div className="text-white font-bold text-xl leading-tight">{name(match.team2[1])}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pausen */}
      {lastRound.byePlayers.length > 0 && (
        <div className="bg-white/10 rounded-2xl px-6 py-4 text-center">
          <span className="text-white/60 text-lg mr-3">☕ Pause:</span>
          <span className="text-white text-xl font-semibold">
            {lastRound.byePlayers.map((id) => playerMap.get(id) ?? id).join(' · ')}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Ranglisten-Ansicht (Beamer)
// ============================================================

function PresentationStandings() {
  const { players, tournament } = useStore();
  if (!tournament) return null;

  const allStats = computeAllStats(players, tournament);
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const top = allStats.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-white/60 text-xl uppercase tracking-widest font-semibold mb-1">
          {tournament.name}
        </div>
        <div className="text-white text-5xl font-black flex items-center justify-center gap-3">
          <Trophy className="w-12 h-12 text-yellow-400" />
          Live-Rangliste
        </div>
      </div>

      <div className="space-y-3">
        {top.map((s, i) => {
          const player = playerMap.get(s.playerId);
          const medals = ['🥇', '🥈', '🥉'];
          return (
            <div
              key={s.playerId}
              className={`flex items-center gap-6 rounded-2xl px-6 py-4 border border-white/10 transition-all ${
                i === 0 ? 'bg-yellow-400/20 border-yellow-400/50' :
                i === 1 ? 'bg-white/15 border-white/20' :
                i === 2 ? 'bg-orange-400/10 border-orange-400/30' :
                'bg-white/10'
              }`}
            >
              {/* Rang */}
              <div className="text-3xl font-black text-white/60 w-10 flex-shrink-0 text-center">
                {i < 3 ? medals[i] : i + 1}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-2xl truncate">
                  {player?.name ?? s.playerId}
                </div>
                {player?.club && (
                  <div className="text-white/50 text-sm truncate">{player.club}</div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 flex-shrink-0">
                <div className="text-center">
                  <div className="text-white text-3xl font-black">{s.bandel}</div>
                  <div className="text-white/50 text-sm">Bändel</div>
                </div>
                <div className="text-center hidden sm:block">
                  <div className="text-green-400 text-2xl font-bold">{s.wins}</div>
                  <div className="text-white/50 text-sm">Siege</div>
                </div>
                <div className="text-center hidden md:block">
                  <div className={`text-xl font-bold ${s.scoreDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {s.scoreDiff >= 0 ? '+' : ''}{s.scoreDiff}
                  </div>
                  <div className="text-white/50 text-sm">Diff.</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Haupt-Präsentationskomponente
// ============================================================

export function PresentationMode() {
  const { tournament } = useStore();
  const [view, setView] = useState<'pairings' | 'standings'>('pairings');
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotateInterval, setRotateInterval] = useState(15); // Sekunden

  // Auto-Rotation zwischen Paarungen und Rangliste
  useEffect(() => {
    if (!autoRotate) return;
    const id = setInterval(() => {
      setView((v) => (v === 'pairings' ? 'standings' : 'pairings'));
    }, rotateInterval * 1000);
    return () => clearInterval(id);
  }, [autoRotate, rotateInterval]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  if (!tournament) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Monitor className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
        <h2 className="text-xl font-bold text-gray-500 dark:text-gray-400">
          Kein Turnier aktiv
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-blue-900 rounded-2xl overflow-hidden">
      {/* Steuer-Bar (klein, oben) */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/20 border-b border-white/10">
        {/* Ansichts-Wechsel */}
        <div className="flex gap-2">
          <button
            onClick={() => setView('pairings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              view === 'pairings'
                ? 'bg-white text-brand-900'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Swords className="w-4 h-4" />Paarungen
          </button>
          <button
            onClick={() => setView('standings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              view === 'standings'
                ? 'bg-white text-brand-900'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Trophy className="w-4 h-4" />Rangliste
          </button>
        </div>

        {/* Rechts: Auto-Rotate + Vollbild */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-white/70 text-sm cursor-pointer select-none">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                autoRotate ? 'bg-brand-400' : 'bg-white/20'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${autoRotate ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
            </button>
            <RefreshCw className="w-3.5 h-3.5" />
            Auto {rotateInterval}s
          </label>

          <select
            value={rotateInterval}
            onChange={(e) => setRotateInterval(Number(e.target.value))}
            className="bg-white/10 text-white/70 text-sm rounded-lg px-2 py-1 border border-white/20 focus:outline-none"
          >
            {[5, 10, 15, 20, 30, 45, 60].map((s) => (
              <option key={s} value={s} className="bg-brand-900">{s}s</option>
            ))}
          </select>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Vollbild"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inhalt */}
      <div className="p-6 md:p-10">
        {view === 'pairings' ? <PresentationRound /> : <PresentationStandings />}
      </div>
    </div>
  );
}
