/**
 * Rundenansicht
 * - Alle Runden anzeigen (mit Tabs)
 * - Matches und Paarungen je Runde
 * - Ergebnisse eintragen / bearbeiten
 * - Paarungen manuell anpassen
 * - Druckansicht
 */

import { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Edit3, Check, Printer,
  Clock, Coffee, ArrowRightLeft, Users,
} from 'lucide-react';
import { useStore } from '../store';
import { Match, MatchResult, Round } from '../types';
import { matchWinner, formatTime } from '../utils/helpers';
import { Button } from './shared/Button';
import { Badge } from './shared/Badge';
import { Modal } from './shared/Modal';

// ============================================================
// Ergebnis-Eingabe-Formular
// ============================================================

interface ResultFormProps {
  match: Match;
  players: { id: string; name: string }[];
  onSave: (result: MatchResult) => void;
  onCancel: () => void;
  trackSetPoints: boolean;
}

function ResultForm({ match, players, onSave, onCancel, trackSetPoints }: ResultFormProps) {
  const name = (id: string) => players.find((p) => p.id === id)?.name ?? id;
  const initial = match.result;
  const [score1, setScore1] = useState(initial?.score1 ?? 0);
  const [score2, setScore2] = useState(initial?.score2 ?? 0);

  const winner = score1 !== score2 ? matchWinner(score1, score2) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ score1, score2, enteredAt: new Date().toISOString() });
  };

  const ScoreInput = ({
    value, onChange, label,
  }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 text-center">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          −
        </button>
        <input
          type="text" inputMode="numeric" pattern="[0-9]*" value={String(value)}
          onChange={(e) => {
            const cleaned = e.target.value.replace(/\D/g, '');
            onChange(cleaned === '' ? 0 : Math.min(99, parseInt(cleaned, 10)));
          }}
          className="w-20 text-center text-3xl font-bold py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
        />
        <button type="button" onClick={() => onChange(value + 1)}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          +
        </button>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Teams */}
      <div className="text-center space-y-1">
        <div className="text-sm text-gray-500 dark:text-gray-400">Team 1</div>
        <div className="font-bold text-gray-900 dark:text-white">
          {name(match.team1[0])} & {name(match.team1[1])}
        </div>
      </div>

      {/* Score-Eingabe */}
      {trackSetPoints ? (
        <div className="flex items-center justify-center gap-6">
          <ScoreInput
            value={score1}
            onChange={setScore1}
            label={`${name(match.team1[0])}\n& ${name(match.team1[1])}`}
          />
          <span className="text-2xl font-bold text-gray-400">:</span>
          <ScoreInput
            value={score2}
            onChange={setScore2}
            label={`${name(match.team2[0])}\n& ${name(match.team2[1])}`}
          />
        </div>
      ) : (
        /* Ohne Satzergebnisse: nur Sieger wählen */
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { setScore1(1); setScore2(0); }}
            className={`flex-1 py-4 rounded-xl border-2 font-semibold transition-all ${
              score1 > score2
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-brand-300'
            }`}
          >
            {name(match.team1[0])} &amp; {name(match.team1[1])} gewinnen
          </button>
          <button
            type="button"
            onClick={() => { setScore1(0); setScore2(1); }}
            className={`flex-1 py-4 rounded-xl border-2 font-semibold transition-all ${
              score2 > score1
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-brand-300'
            }`}
          >
            {name(match.team2[0])} &amp; {name(match.team2[1])} gewinnen
          </button>
        </div>
      )}

      {/* Team 2 */}
      <div className="text-center space-y-1">
        <div className="text-sm text-gray-500 dark:text-gray-400">Team 2</div>
        <div className="font-bold text-gray-900 dark:text-white">
          {name(match.team2[0])} & {name(match.team2[1])}
        </div>
      </div>

      {/* Sieger-Anzeige */}
      {winner && (
        <div className="text-center">
          <Badge color="green">
            🏸 Sieger: {winner === 'team1'
              ? `${name(match.team1[0])} & ${name(match.team1[1])}`
              : `${name(match.team2[0])} & ${name(match.team2[1])}`}
          </Badge>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1" disabled={score1 === score2 && !trackSetPoints}>
          Ergebnis speichern
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}

// ============================================================
// Match-Karte
// ============================================================

interface MatchCardProps {
  match: Match;
  roundIndex: number;
  playerMap: Map<string, string>;
  trackSetPoints: boolean;
  roundStatus: Round['status'];
}

function MatchCard({ match, roundIndex, playerMap, trackSetPoints, roundStatus }: MatchCardProps) {
  const { enterResult } = useStore();
  const [showForm, setShowForm] = useState(false);
  const name = (id: string) => playerMap.get(id) ?? id;

  const hasResult = !!match.result;
  const winner = hasResult ? matchWinner(match.result!.score1, match.result!.score2) : null;

  return (
    <>
      <div className={`bg-white dark:bg-gray-900 rounded-2xl border-2 shadow-sm transition-all ${
        hasResult
          ? 'border-green-300 dark:border-green-700'
          : roundStatus === 'active'
          ? 'border-brand-300 dark:border-brand-700'
          : 'border-gray-200 dark:border-gray-700'
      }`}>
        {/* Feld-Header */}
        <div className={`flex items-center justify-between px-4 py-2 rounded-t-2xl border-b ${
          hasResult
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <span className="font-bold text-gray-700 dark:text-gray-300">
            Feld {match.court}
          </span>
          {hasResult ? (
            <Badge color="green">
              <Check className="w-3 h-3 mr-1" />Ergebnis eingetragen
            </Badge>
          ) : (
            <Badge color={roundStatus === 'active' ? 'blue' : 'gray'}>
              {roundStatus === 'active' ? 'Läuft' : 'Ausstehend'}
            </Badge>
          )}
        </div>

        {/* Match-Inhalt */}
        <div className="p-4">
          {/* Teams */}
          <div className="flex items-center gap-3">
            {/* Team 1 */}
            <div className={`flex-1 space-y-1 ${winner === 'team1' ? 'opacity-100' : winner ? 'opacity-60' : ''}`}>
              {match.team1.map((id) => (
                <div key={id} className="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-1">
                  {winner === 'team1' && <span className="text-yellow-500">🏅</span>}
                  {name(id)}
                </div>
              ))}
            </div>

            {/* Ergebnis oder VS */}
            <div className="text-center flex-shrink-0 px-2">
              {hasResult && trackSetPoints ? (
                <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                  {match.result!.score1} : {match.result!.score2}
                </div>
              ) : hasResult ? (
                <div className="text-lg font-bold text-brand-600">
                  {winner === 'team1' ? '✓ : ○' : '○ : ✓'}
                </div>
              ) : (
                <div className="text-gray-400 font-bold">vs</div>
              )}
            </div>

            {/* Team 2 */}
            <div className={`flex-1 space-y-1 text-right ${winner === 'team2' ? 'opacity-100' : winner ? 'opacity-60' : ''}`}>
              {match.team2.map((id) => (
                <div key={id} className="font-semibold text-gray-900 dark:text-white truncate flex items-center justify-end gap-1">
                  {name(id)}
                  {winner === 'team2' && <span className="text-yellow-500">🏅</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Aktion */}
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {hasResult ? 'Ergebnis ändern' : 'Ergebnis eintragen'}
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <Modal title={`Feld ${match.court} – Ergebnis`} onClose={() => setShowForm(false)}>
          <ResultForm
            match={match}
            players={Array.from(playerMap, ([id, name]) => ({ id, name }))}
            trackSetPoints={trackSetPoints}
            onSave={(result) => {
              enterResult(roundIndex, match.id, result);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}
    </>
  );
}

// ============================================================
// Paarungen-Bearbeitungs-Modal
// ============================================================

interface PairingEditorProps {
  round: Round;
  roundIndex: number;
  playerMap: Map<string, string>;
  onClose: () => void;
}

function PairingEditor({ round, roundIndex, playerMap, onClose }: PairingEditorProps) {
  const { updateMatch } = useStore();
  const [matches, setMatches] = useState(round.matches.map((m) => ({ ...m })));

  // Zwei Spieler tauschen (team-übergreifend)
  const swapPlayers = (
    matchIdx1: number, team1: 'team1' | 'team2', pos1: 0 | 1,
    matchIdx2: number, team2: 'team1' | 'team2', pos2: 0 | 1
  ) => {
    const updated = matches.map((m) => ({ ...m, team1: [...m.team1] as [string, string], team2: [...m.team2] as [string, string] }));
    const p1 = updated[matchIdx1][team1][pos1];
    const p2 = updated[matchIdx2][team2][pos2];
    updated[matchIdx1][team1][pos1] = p2;
    updated[matchIdx2][team2][pos2] = p1;
    setMatches(updated);
  };

  const save = () => {
    matches.forEach((m, i) => {
      updateMatch(roundIndex, round.matches[i].id, { team1: m.team1, team2: m.team2 });
    });
    onClose();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Klicke auf einen Spielernamen, um ihn auszuwählen, dann auf einen anderen, um sie zu tauschen.
      </p>
      <MatchSwapEditor matches={matches} playerMap={playerMap} onSwap={swapPlayers} />
      <div className="flex gap-3 pt-2">
        <Button className="flex-1" onClick={save}>Paarungen speichern</Button>
        <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
      </div>
    </div>
  );
}

function MatchSwapEditor({
  matches,
  playerMap,
  onSwap,
}: {
  matches: Match[];
  playerMap: Map<string, string>;
  onSwap: (mi1: number, t1: 'team1' | 'team2', p1: 0 | 1, mi2: number, t2: 'team1' | 'team2', p2: 0 | 1) => void;
}) {
  const [selected, setSelected] = useState<{ mi: number; team: 'team1' | 'team2'; pos: 0 | 1 } | null>(null);
  const name = (id: string) => playerMap.get(id) ?? id;

  const handleClick = (mi: number, team: 'team1' | 'team2', pos: 0 | 1) => {
    if (!selected) { setSelected({ mi, team, pos }); return; }
    onSwap(selected.mi, selected.team, selected.pos, mi, team, pos);
    setSelected(null);
  };

  const isSelected = (mi: number, team: 'team1' | 'team2', pos: 0 | 1) =>
    selected?.mi === mi && selected.team === team && selected.pos === pos;

  return (
    <div className="space-y-3">
      {matches.map((m, mi) => (
        <div key={m.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
          <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">Feld {m.court}</div>
          <div className="flex items-center gap-2 flex-wrap">
            {(['team1', 'team2'] as const).map((team, ti) => (
              <>
                {ti === 1 && <span className="text-gray-400 text-sm font-bold">vs</span>}
                <div key={team} className="flex gap-2">
                  {([0, 1] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => handleClick(mi, team, pos)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                        isSelected(mi, team, pos)
                          ? 'border-brand-500 bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:border-brand-300'
                      }`}
                    >
                      {name(m[team][pos])}
                    </button>
                  ))}
                </div>
              </>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Hauptkomponente: Rundenansicht
// ============================================================

export function RoundView() {
  const { players, tournament, startRound, completeRound, generateRound, deleteRound } = useStore();
  const setView = useStore((s) => s.setView);
  const [activeRoundIdx, setActiveRoundIdx] = useState<number>(-1); // -1 = letzte Runde
  const [showPairingEditor, setShowPairingEditor] = useState(false);

  if (!tournament || tournament.rounds.length === 0) {
    return (
      <div className="text-center py-20">
        <Users className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
        <h2 className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-2">
          Noch keine Runden
        </h2>
        <p className="text-gray-400 dark:text-gray-600 mb-6">
          Generiere die erste Runde im Turnier-Tab.
        </p>
        <Button onClick={() => setView('tournament')}>Zum Turnier</Button>
      </div>
    );
  }

  const rounds = tournament.rounds;
  const roundIdx = activeRoundIdx === -1 ? rounds.length - 1 : Math.min(activeRoundIdx, rounds.length - 1);
  const round = rounds[roundIdx];

  const playerMap = new Map(players.map((p) => [p.id, p.name]));
  const doneCount = round.matches.filter((m) => m.result).length;
  const allDone = doneCount === round.matches.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Runden
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">
            {tournament.name} · {rounds.length} Runde(n)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={Printer} onClick={() => window.print()}>
            Drucken
          </Button>
          {round.status !== 'completed' && (
            <Button variant="secondary" size="sm" icon={ArrowRightLeft} onClick={() => setShowPairingEditor(true)}>
              Paarungen ändern
            </Button>
          )}
        </div>
      </div>

      {/* Runden-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveRoundIdx(Math.max(0, roundIdx - 1))}
          disabled={roundIdx === 0}
          className="p-2 rounded-lg text-gray-400 hover:text-brand-600 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex gap-1 overflow-x-auto">
          {rounds.map((r, i) => (
            <button
              key={r.id}
              onClick={() => setActiveRoundIdx(i)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${
                i === roundIdx
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-brand-100'
              }`}
            >
              Runde {r.number}
              {r.status === 'active' && <span className="ml-1 w-2 h-2 rounded-full bg-green-400 inline-block" />}
            </button>
          ))}
        </div>

        <button
          onClick={() => setActiveRoundIdx(Math.min(rounds.length - 1, roundIdx + 1))}
          disabled={roundIdx === rounds.length - 1}
          className="p-2 rounded-lg text-gray-400 hover:text-brand-600 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Runden-Info */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <Badge color={round.status === 'active' ? 'green' : round.status === 'completed' ? 'gray' : 'blue'}>
              {round.status === 'pending' ? 'Bereit' : round.status === 'active' ? '● Läuft' : '✓ Abgeschlossen'}
            </Badge>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {doneCount}/{round.matches.length} Matches abgeschlossen
            </span>
            {round.startedAt && (
              <span className="text-sm text-gray-500 dark:text-gray-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Start: {formatTime(round.startedAt)}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            {round.status === 'pending' && (
              <Button size="sm" onClick={startRound}>Runde starten</Button>
            )}
            {round.status === 'active' && (
              <Button size="sm" onClick={completeRound} variant={allDone ? 'primary' : 'secondary'}>
                Runde abschließen
              </Button>
            )}
            {round.status === 'completed' && roundIdx === rounds.length - 1 && tournament.status !== 'completed' && (
              <Button size="sm" onClick={() => { generateRound(); setActiveRoundIdx(-1); }}>
                Nächste Runde generieren
              </Button>
            )}
            {round.status === 'pending' && (
              <Button size="sm" variant="danger" onClick={() => { if (confirm('Runde löschen?')) deleteRound(roundIdx); }}>
                Löschen
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Pausen */}
      {round.byePlayers.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Coffee className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <span className="font-semibold text-yellow-800 dark:text-yellow-300">
              Diese Runde pausieren:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {round.byePlayers.map((id) => (
              <Badge key={id} color="yellow">{playerMap.get(id) ?? id}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Match-Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2">
        {round.matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            roundIndex={roundIdx}
            playerMap={playerMap}
            trackSetPoints={tournament.trackSetPoints}
            roundStatus={round.status}
          />
        ))}
      </div>

      {/* Paarungen-Editor Modal */}
      {showPairingEditor && (
        <Modal title="Paarungen bearbeiten" onClose={() => setShowPairingEditor(false)} size="lg">
          <PairingEditor
            round={round}
            roundIndex={roundIdx}
            playerMap={playerMap}
            onClose={() => setShowPairingEditor(false)}
          />
        </Modal>
      )}
    </div>
  );
}
