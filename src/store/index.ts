/**
 * Zustand-Store für das Bändelturnier.
 *
 * Verwendet Zustand mit dem `persist`-Middleware, um den Zustand
 * automatisch im localStorage zu speichern und beim Laden
 * wiederherzustellen.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Player,
  Tournament,
  TournamentConfig,
  Match,
  MatchResult,
  Round,
  ViewName,
} from '../types';
import { generatePairings, buildPairingHistory } from '../services/pairingService';
import { nanoid } from '../utils/helpers';

// ============================================================
// Store-Interface
// ============================================================

interface AppStore {
  // ---- State ----
  players: Player[];
  tournament: Tournament | null;
  darkMode: boolean;
  currentView: ViewName;

  // ---- Navigation ----
  setView: (view: ViewName) => void;
  toggleDarkMode: () => void;

  // ---- Spieler-Verwaltung ----
  addPlayer: (data: Omit<Player, 'id' | 'createdAt'>) => void;
  updatePlayer: (id: string, data: Partial<Omit<Player, 'id' | 'createdAt'>>) => void;
  deletePlayer: (id: string) => void;
  importPlayers: (players: Player[]) => void;

  // ---- Turnier-Verwaltung ----
  createTournament: (config: TournamentConfig) => void;
  updateTournamentConfig: (config: Partial<TournamentConfig>) => void;
  addPlayerToTournament: (playerId: string) => void;
  removePlayerFromTournament: (playerId: string) => void;
  addAllActivePlayers: () => void;
  completeTournament: () => void;
  resetTournament: () => void;

  // ---- Runden-Verwaltung ----
  generateRound: () => void;
  startRound: () => void;
  completeRound: () => void;
  updateMatch: (roundIndex: number, matchId: string, updates: Partial<Match>) => void;
  enterResult: (roundIndex: number, matchId: string, result: MatchResult) => void;
  deleteRound: (roundIndex: number) => void;

  // ---- Daten Import/Export ----
  exportAllData: () => string;
  importAllData: (json: string) => void;
}

// ============================================================
// Store-Implementierung
// ============================================================

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      players: [],
      tournament: null,
      darkMode: false,
      currentView: 'dashboard',

      // ---- Navigation ----
      setView: (view) => set({ currentView: view }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

      // ---- Spieler ----

      addPlayer: (data) =>
        set((s) => ({
          players: [
            ...s.players,
            { ...data, id: nanoid(), createdAt: new Date().toISOString() },
          ],
        })),

      updatePlayer: (id, data) =>
        set((s) => ({
          players: s.players.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),

      deletePlayer: (id) =>
        set((s) => ({
          players: s.players.filter((p) => p.id !== id),
          // Spieler auch aus dem laufenden Turnier entfernen
          tournament: s.tournament
            ? {
                ...s.tournament,
                playerIds: s.tournament.playerIds.filter((pid) => pid !== id),
              }
            : null,
        })),

      importPlayers: (players) =>
        set((s) => {
          // Doppelte IDs überschreiben, neue hinzufügen
          const existing = new Map(s.players.map((p) => [p.id, p]));
          players.forEach((p) => existing.set(p.id, p));
          return { players: Array.from(existing.values()) };
        }),

      // ---- Turnier ----

      createTournament: (config) =>
        set({
          tournament: {
            id: nanoid(),
            ...config,
            playerIds: [],
            rounds: [],
            status: 'setup',
          },
        }),

      updateTournamentConfig: (config) =>
        set((s) => ({
          tournament: s.tournament ? { ...s.tournament, ...config } : null,
        })),

      addPlayerToTournament: (playerId) =>
        set((s) => {
          if (!s.tournament || s.tournament.playerIds.includes(playerId)) return s;
          return {
            tournament: {
              ...s.tournament,
              playerIds: [...s.tournament.playerIds, playerId],
            },
          };
        }),

      removePlayerFromTournament: (playerId) =>
        set((s) => ({
          tournament: s.tournament
            ? {
                ...s.tournament,
                playerIds: s.tournament.playerIds.filter((id) => id !== playerId),
              }
            : null,
        })),

      addAllActivePlayers: () =>
        set((s) => {
          if (!s.tournament) return s;
          const activeIds = s.players
            .filter((p) => p.active)
            .map((p) => p.id);
          return {
            tournament: { ...s.tournament, playerIds: activeIds },
          };
        }),

      completeTournament: () =>
        set((s) => ({
          tournament: s.tournament
            ? { ...s.tournament, status: 'completed' }
            : null,
        })),

      resetTournament: () => set({ tournament: null }),

      // ---- Runden ----

      generateRound: () =>
        set((s) => {
          const t = s.tournament;
          if (!t || t.playerIds.length < 4) return s;

          // Nur aktive Spieler berücksichtigen (nicht deaktivierte)
          const activePlayers = t.playerIds.filter((id) =>
            s.players.find((p) => p.id === id && p.active)
          );

          if (activePlayers.length < 4) return s;

          // Stärken für den Algorithmus
          const strengthMap: Record<string, number> = {};
          s.players.forEach((p) => { strengthMap[p.id] = p.strength; });

          // Paarungshistorie aus allen abgeschlossenen Runden aufbauen
          const history = buildPairingHistory(t.rounds, t.winPoints);

          // Paarungen generieren
          const result = generatePairings(
            activePlayers,
            history,
            t.courts,
            strengthMap
          );

          const newRound: Round = {
            id: nanoid(),
            number: t.rounds.length + 1,
            matches: result.matches.map((m, i) => ({
              id: nanoid(),
              court: i + 1,
              team1: m.team1,
              team2: m.team2,
            })),
            byePlayers: result.byePlayers,
            status: 'pending',
          };

          return {
            tournament: {
              ...t,
              status: 'running',
              rounds: [...t.rounds, newRound],
            },
          };
        }),

      startRound: () =>
        set((s) => {
          const t = s.tournament;
          if (!t) return s;
          const rounds = t.rounds.map((r, i) =>
            i === t.rounds.length - 1 && r.status === 'pending'
              ? { ...r, status: 'active' as const, startedAt: new Date().toISOString() }
              : r
          );
          return { tournament: { ...t, rounds } };
        }),

      completeRound: () =>
        set((s) => {
          const t = s.tournament;
          if (!t) return s;
          const rounds = t.rounds.map((r, i) =>
            i === t.rounds.length - 1 && r.status === 'active'
              ? {
                  ...r,
                  status: 'completed' as const,
                  completedAt: new Date().toISOString(),
                }
              : r
          );
          return { tournament: { ...t, rounds } };
        }),

      updateMatch: (roundIndex, matchId, updates) =>
        set((s) => {
          const t = s.tournament;
          if (!t) return s;
          const rounds = t.rounds.map((r, i) =>
            i === roundIndex
              ? {
                  ...r,
                  matches: r.matches.map((m) =>
                    m.id === matchId ? { ...m, ...updates } : m
                  ),
                }
              : r
          );
          return { tournament: { ...t, rounds } };
        }),

      enterResult: (roundIndex, matchId, result) =>
        set((s) => {
          const t = s.tournament;
          if (!t) return s;
          const rounds = t.rounds.map((r, i) =>
            i === roundIndex
              ? {
                  ...r,
                  matches: r.matches.map((m) =>
                    m.id === matchId
                      ? { ...m, result: { ...result, enteredAt: new Date().toISOString() } }
                      : m
                  ),
                }
              : r
          );
          return { tournament: { ...t, rounds } };
        }),

      deleteRound: (roundIndex) =>
        set((s) => {
          const t = s.tournament;
          if (!t) return s;
          const rounds = t.rounds.filter((_, i) => i !== roundIndex)
            .map((r, i) => ({ ...r, number: i + 1 }));
          return { tournament: { ...t, rounds } };
        }),

      // ---- Import / Export ----

      exportAllData: () => {
        const { players, tournament } = get();
        return JSON.stringify({ players, tournament }, null, 2);
      },

      importAllData: (json) => {
        try {
          const data = JSON.parse(json) as { players?: Player[]; tournament?: Tournament };
          set({
            players: data.players ?? [],
            tournament: data.tournament ?? null,
          });
        } catch {
          throw new Error('Ungültiges JSON-Format');
        }
      },
    }),
    {
      name: 'badminton-baendele-turnier-v1',
    }
  )
);
