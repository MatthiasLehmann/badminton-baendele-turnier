/**
 * Turnier-Setup und Steuerung
 * - Neues Turnier anlegen / konfigurieren
 * - Spieler für Turnier auswählen
 * - Turnier starten / abschließen
 * - Beispielturnier laden
 */

import { useState } from 'react';
import {
  Trophy, Calendar, Hash, Clock, Award, CheckSquare, Square,
  Users, UserCheck, Shuffle, Download, RefreshCw, Star,
} from 'lucide-react';
import { useStore } from '../store';
import { TournamentConfig } from '../types';
import { strengthToStars, formatDate } from '../utils/helpers';
import { exportJSON } from '../services/exportService';
import { getSampleData } from '../data/sampleData';
import { Button } from './shared/Button';
import { Badge } from './shared/Badge';
import { Modal } from './shared/Modal';

// ============================================================
// Turnier-Konfigurations-Formular
// ============================================================

interface TournamentFormProps {
  initial?: TournamentConfig;
  onSave: (config: TournamentConfig) => void;
  onCancel?: () => void;
}

function TournamentForm({ initial, onSave, onCancel }: TournamentFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState(initial?.name ?? 'Bändelturnier');
  const [date, setDate] = useState(initial?.date ?? today);
  const [courts, setCourts] = useState(initial?.courts ?? 3);
  const [roundDuration, setRoundDuration] = useState(initial?.roundDuration ?? 15);
  const [winPoints, setWinPoints] = useState(initial?.winPoints ?? 1);
  const [trackSetPoints, setTrackSetPoints] = useState(initial?.trackSetPoints ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name: name.trim() || 'Bändelturnier', date, courts, roundDuration, winPoints, trackSetPoints });
  };

  const inputClass =
    'w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Name */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Turniername
          </label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>

        {/* Datum */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            <Calendar className="inline w-4 h-4 mr-1" />Datum
          </label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </div>

        {/* Felder */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            <Hash className="inline w-4 h-4 mr-1" />Anzahl Felder / Courts
          </label>
          <input
            type="number" min={1} max={20} value={courts}
            onChange={(e) => setCourts(Number(e.target.value))} className={inputClass}
          />
        </div>

        {/* Rundendauer */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            <Clock className="inline w-4 h-4 mr-1" />Rundendauer (Minuten)
          </label>
          <input
            type="number" min={5} max={60} value={roundDuration}
            onChange={(e) => setRoundDuration(Number(e.target.value))} className={inputClass}
          />
        </div>

        {/* Punkte pro Sieg */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            <Award className="inline w-4 h-4 mr-1" />Bändel pro Sieg
          </label>
          <input
            type="number" min={1} max={10} value={winPoints}
            onChange={(e) => setWinPoints(Number(e.target.value))} className={inputClass}
          />
        </div>
      </div>

      {/* Satzergebnisse */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <button type="button" onClick={() => setTrackSetPoints(!trackSetPoints)} className="flex-shrink-0">
          {trackSetPoints
            ? <CheckSquare className="w-5 h-5 text-brand-600" />
            : <Square className="w-5 h-5 text-gray-400" />}
        </button>
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Satzergebnisse (Punkte) zusätzlich erfassen
        </span>
      </label>

      {/* Aktionen */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary" className="flex-1">
          {initial ? 'Einstellungen speichern' : 'Turnier anlegen'}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Abbrechen
          </Button>
        )}
      </div>
    </form>
  );
}

// ============================================================
// Spieler-Auswahl
// ============================================================

function PlayerSelector() {
  const {
    players, tournament,
    addPlayerToTournament, removePlayerFromTournament, addAllActivePlayers,
  } = useStore();

  if (!tournament) return null;

  const inTournament = new Set(tournament.playerIds);
  const active = players.filter((p) => p.active);
  const inactive = players.filter((p) => !p.active);

  const toggle = (id: string) => {
    if (inTournament.has(id)) removePlayerFromTournament(id);
    else addPlayerToTournament(id);
  };

  const playerCount = tournament.playerIds.length;
  const matchCount = Math.min(Math.floor(playerCount / 4), tournament.courts);
  const byeCount = playerCount - matchCount * 4;

  return (
    <div className="space-y-4">
      {/* Statistik */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl px-4 py-2 text-center">
          <div className="text-2xl font-bold text-brand-700 dark:text-brand-400">{playerCount}</div>
          <div className="text-xs text-brand-600 dark:text-brand-500">Spieler</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-2 text-center">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{matchCount}</div>
          <div className="text-xs text-blue-600 dark:text-blue-500">Matches/Runde</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl px-4 py-2 text-center">
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{byeCount}</div>
          <div className="text-xs text-yellow-600 dark:text-yellow-500">Pause/Runde</div>
        </div>
      </div>

      {/* Alle auswählen */}
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" icon={UserCheck} onClick={addAllActivePlayers}>
          Alle aktiven auswählen
        </Button>
        {playerCount > 0 && (
          <Button
            variant="ghost" size="sm"
            onClick={() => tournament.playerIds.forEach((id) => removePlayerFromTournament(id))}
          >
            Auswahl leeren
          </Button>
        )}
      </div>

      {/* Spielerliste */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {active.map((p) => {
          const selected = inTournament.has(p.id);
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                selected
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-brand-300 bg-white dark:bg-gray-800'
              }`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                selected ? 'bg-brand-600 border-brand-600' : 'border-gray-300'
              }`}>
                {selected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 dark:text-white truncate">{p.name}</div>
                {p.club && <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{p.club}</div>}
              </div>
              <span className="text-yellow-500 text-xs">{strengthToStars(p.strength)}</span>
            </button>
          );
        })}

        {inactive.length > 0 && (
          <>
            <p className="text-xs font-semibold text-gray-400 pt-2 px-1">Pausierte Spieler</p>
            {inactive.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800"
              >
                <div className="w-5 h-5 rounded-md border-2 border-gray-200 flex-shrink-0" />
                <span className="text-gray-500 dark:text-gray-400 text-sm">{p.name}</span>
                <Badge color="gray">Pausiert</Badge>
              </div>
            ))}
          </>
        )}

        {players.length === 0 && (
          <p className="text-center text-gray-400 py-8">
            Noch keine Spieler angelegt. Gehe zur Spielerverwaltung.
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Haupt-Komponente
// ============================================================

export function TournamentSetup() {
  const { players, tournament, createTournament, updateTournamentConfig,
    generateRound, startRound, completeRound, completeTournament,
    resetTournament, importPlayers } = useStore();

  const [showConfig, setShowConfig] = useState(false);
  const [showSamplePicker, setShowSamplePicker] = useState(false);
  const setView = useStore((s) => s.setView);

  // Aktueller Stand
  const currentRound = tournament?.rounds[tournament.rounds.length - 1];
  const canGenerateRound =
    tournament &&
    tournament.status !== 'completed' &&
    tournament.playerIds.length >= 4 &&
    (!currentRound || currentRound.status === 'completed');
  const canStartRound = currentRound?.status === 'pending';
  const canCompleteRound = currentRound?.status === 'active';

  // Beispielturnier laden
  const loadSample = (size: 12 | 16 | 20) => {
    const { players: sPlayers, tournament: sTournament } = getSampleData(size);
    importPlayers(sPlayers);
    // Turnier muss separat gesetzt werden
    createTournament({
      name: sTournament.name,
      date: sTournament.date,
      courts: sTournament.courts,
      roundDuration: sTournament.roundDuration,
      winPoints: sTournament.winPoints,
      trackSetPoints: sTournament.trackSetPoints,
    });
    // Spieler nach createTournament hinzufügen
    setTimeout(() => {
      sPlayers.forEach((p) => useStore.getState().addPlayerToTournament(p.id));
    }, 0);
    setShowSamplePicker(false);
  };

  // ---- Kein Turnier ----
  if (!tournament) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-7 h-7 text-brand-600" />
          Turnier
        </h1>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Neues Turnier */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Neues Turnier anlegen
            </h2>
            <TournamentForm onSave={createTournament} />
          </div>

          {/* Beispielturnier */}
          <div className="bg-gradient-to-br from-brand-50 to-blue-50 dark:from-brand-900/20 dark:to-blue-900/20 rounded-2xl border border-brand-200 dark:border-brand-800 p-6">
            <Star className="w-8 h-8 text-brand-600 mb-3" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Beispielturnier laden
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Starte direkt mit vordefinierten Spielern und Turnier-Einstellungen.
            </p>
            <div className="flex flex-col gap-2">
              {([12, 16, 20] as const).map((n) => (
                <Button key={n} variant="secondary" onClick={() => loadSample(n)}>
                  {n} Spieler · {Math.floor(n / 4)} Felder
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Turnier vorhanden ----
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 text-brand-600" />
            {tournament.name}
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge color={tournament.status === 'running' ? 'green' : tournament.status === 'completed' ? 'gray' : 'blue'}>
              {tournament.status === 'setup' ? 'Vorbereitung' : tournament.status === 'running' ? 'Läuft' : 'Abgeschlossen'}
            </Badge>
            <Badge color="gray"><Calendar className="w-3 h-3 inline mr-1" />{formatDate(tournament.date)}</Badge>
            <Badge color="gray">{tournament.courts} Felder · {tournament.roundDuration} Min./Runde</Badge>
            <Badge color="yellow"><Award className="w-3 h-3 inline mr-1" />{tournament.winPoints} Bändel/Sieg</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" icon={Download} onClick={() => exportJSON(players, tournament)}>
            Export JSON
          </Button>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => { if (confirm('Turnier wirklich zurücksetzen?')) resetTournament(); }}>
            Zurücksetzen
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Linke Spalte: Turnier-Steuerung */}
        <div className="lg:col-span-2 space-y-4">

          {/* Runden-Steuerung */}
          {tournament.status !== 'completed' && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-brand-600" />
                Turnier-Steuerung
              </h2>

              <div className="flex flex-wrap gap-3">
                <Button
                  icon={Shuffle}
                  disabled={!canGenerateRound}
                  onClick={() => { generateRound(); setView('rounds'); }}
                >
                  Runde {tournament.rounds.length + 1} generieren
                </Button>
                <Button
                  variant="secondary"
                  disabled={!canStartRound}
                  onClick={startRound}
                >
                  Runde starten
                </Button>
                <Button
                  variant="secondary"
                  disabled={!canCompleteRound}
                  onClick={completeRound}
                >
                  Runde abschließen
                </Button>
                {tournament.rounds.length > 0 && (tournament.status === 'setup' || tournament.status === 'running') && (
                  <Button
                    variant="danger"
                    onClick={() => { if (confirm('Turnier wirklich abschließen?')) completeTournament(); }}
                  >
                    Turnier beenden
                  </Button>
                )}
              </div>

              {/* Hinweise */}
              {tournament.playerIds.length < 4 && (
                <p className="mt-3 text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-3 py-2">
                  ⚠️ Mindestens 4 Spieler für eine Runde erforderlich
                </p>
              )}
              {canGenerateRound && tournament.playerIds.length >= 4 && (
                <p className="mt-3 text-sm text-brand-600 dark:text-brand-400">
                  ✓ Bereit für Runde {tournament.rounds.length + 1}
                </p>
              )}
            </div>
          )}

          {/* Rundenübersicht */}
          {tournament.rounds.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Gespielte Runden
              </h2>
              <div className="space-y-2">
                {tournament.rounds.map((round) => {
                  const done = round.matches.filter((m) => m.result).length;
                  return (
                    <button
                      key={round.id}
                      onClick={() => setView('rounds')}
                      className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors text-left"
                    >
                      <span className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {round.number}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          Runde {round.number}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {done}/{round.matches.length} Ergebnisse · {round.byePlayers.length} Pause(n)
                        </div>
                      </div>
                      <Badge color={round.status === 'completed' ? 'green' : round.status === 'active' ? 'blue' : 'gray'}>
                        {round.status === 'pending' ? 'Bereit' : round.status === 'active' ? 'Aktiv' : 'Abgeschlossen'}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Einstellungen bearbeiten */}
          {tournament.status === 'setup' && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Einstellungen</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowConfig(!showConfig)}>
                  {showConfig ? 'Ausblenden' : 'Bearbeiten'}
                </Button>
              </div>
              {showConfig && (
                <TournamentForm
                  initial={tournament}
                  onSave={(config) => { updateTournamentConfig(config); setShowConfig(false); }}
                  onCancel={() => setShowConfig(false)}
                />
              )}
            </div>
          )}
        </div>

        {/* Rechte Spalte: Spieler-Auswahl */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600" />
            Teilnehmer ({tournament.playerIds.length})
          </h2>
          <PlayerSelector />
        </div>
      </div>

      {/* Modals */}
      {showSamplePicker && (
        <Modal title="Beispielturnier" onClose={() => setShowSamplePicker(false)} size="sm">
          <div className="space-y-3">
            {([12, 16, 20] as const).map((n) => (
              <Button key={n} variant="secondary" className="w-full" onClick={() => loadSample(n)}>
                {n} Spieler
              </Button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
