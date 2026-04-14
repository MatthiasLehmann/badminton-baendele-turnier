/**
 * Zustand-Store für das Bändelturnier.
 *
 * Persistenz: localStorage (Zustand persist-Middleware)
 * Live-Sync:  Supabase Realtime (optional, nur wenn Session aktiv)
 *
 * Session-Logik:
 *   - isAdmin = true  → Schreibrechte, synct Änderungen zu Supabase
 *   - isAdmin = false → Nur-Lesen, empfängt Updates von Supabase
 *   - Kein Session    → rein lokal, kein Netzwerk
 *
 * Anti-Loop-Mechanismus:
 *   Das Modul-Flag `_remoteUpdate` verhindert, dass eingehende
 *   Supabase-Updates als eigene Änderungen zurückgeschrieben werden.
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
  SessionState,
  Sponsor,
} from '../types';
import { generatePairings, buildPairingHistory } from '../services/pairingService';
import { nanoid } from '../utils/helpers';
import {
  createSession,
  loadSession,
  pushSessionState,
  subscribeToSession,
  SessionRow,
} from '../services/supabaseService';

// ---- Modul-Level Flags (kein React-State) ----

/** Wenn true, kommen Daten von Supabase → kein Re-Sync nötig */
let _remoteUpdate = false;

/** Debounce-Handle für Supabase-Schreibzugriffe */
let _syncTimeout: ReturnType<typeof setTimeout> | null = null;

/** Aktive Realtime-Subscription (Cleanup-Funktion) */
let _unsubscribe: (() => void) | null = null;

// ============================================================
// Store-Interface
// ============================================================

interface AppStore {
  // ---- Daten ----
  players: Player[];
  tournament: Tournament | null;
  sponsors: Sponsor[];
  darkMode: boolean;
  currentView: ViewName;

  // ---- Session ----
  session: SessionState;

  // ---- Navigation ----
  setView: (view: ViewName) => void;
  toggleDarkMode: () => void;

  // ---- Spieler ----
  addPlayer: (data: Omit<Player, 'id' | 'createdAt'>) => void;
  updatePlayer: (id: string, data: Partial<Omit<Player, 'id' | 'createdAt'>>) => void;
  deletePlayer: (id: string) => void;
  importPlayers: (players: Player[]) => void;

  // ---- Turnier ----
  createTournament: (config: TournamentConfig) => void;
  updateTournamentConfig: (config: Partial<TournamentConfig>) => void;
  addPlayerToTournament: (playerId: string) => void;
  removePlayerFromTournament: (playerId: string) => void;
  addAllActivePlayers: () => void;
  completeTournament: () => void;
  resetTournament: () => void;

  // ---- Runden ----
  generateRound: () => void;
  startRound: () => void;
  completeRound: () => void;
  updateMatch: (roundIndex: number, matchId: string, updates: Partial<Match>) => void;
  enterResult: (roundIndex: number, matchId: string, result: MatchResult) => void;
  deleteRound: (roundIndex: number) => void;

  // ---- Session-Management ----
  startLiveSession: () => Promise<void>;
  joinLiveSession: (sessionId: string, adminSecret?: string) => Promise<void>;
  leaveLiveSession: () => void;

  // ---- Sponsoren ----
  addSponsor: (data: { name: string; logoDataUrl: string; website?: string }) => void;
  updateSponsor: (id: string, data: Partial<Omit<Sponsor, 'id'>>) => void;
  deleteSponsor: (id: string) => void;
  reorderSponsors: (ids: string[]) => void;

  // ---- Import / Export ----
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
      sponsors: [],
      darkMode: false,
      currentView: 'dashboard',
      session: {
        sessionId: null,
        adminSecret: null,
        status: 'disconnected',
        error: null,
      },

      // ---- Navigation ----
      setView: (view) => set({ currentView: view }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

      // ---- Spieler ----
      addPlayer: (data) =>
        set((s) => ({
          players: [...s.players, { ...data, id: nanoid(), createdAt: new Date().toISOString() }],
        })),

      updatePlayer: (id, data) =>
        set((s) => ({
          players: s.players.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),

      deletePlayer: (id) =>
        set((s) => ({
          players: s.players.filter((p) => p.id !== id),
          tournament: s.tournament
            ? { ...s.tournament, playerIds: s.tournament.playerIds.filter((pid) => pid !== id) }
            : null,
        })),

      importPlayers: (players) =>
        set((s) => {
          const existing = new Map(s.players.map((p) => [p.id, p]));
          players.forEach((p) => existing.set(p.id, p));
          return { players: Array.from(existing.values()) };
        }),

      // ---- Turnier ----
      createTournament: (config) =>
        set({ tournament: { id: nanoid(), ...config, playerIds: [], rounds: [], status: 'setup' } }),

      updateTournamentConfig: (config) =>
        set((s) => ({ tournament: s.tournament ? { ...s.tournament, ...config } : null })),

      addPlayerToTournament: (playerId) =>
        set((s) => {
          if (!s.tournament || s.tournament.playerIds.includes(playerId)) return s;
          return { tournament: { ...s.tournament, playerIds: [...s.tournament.playerIds, playerId] } };
        }),

      removePlayerFromTournament: (playerId) =>
        set((s) => ({
          tournament: s.tournament
            ? { ...s.tournament, playerIds: s.tournament.playerIds.filter((id) => id !== playerId) }
            : null,
        })),

      addAllActivePlayers: () =>
        set((s) => {
          if (!s.tournament) return s;
          const activeIds = s.players.filter((p) => p.active).map((p) => p.id);
          return { tournament: { ...s.tournament, playerIds: activeIds } };
        }),

      completeTournament: () =>
        set((s) => ({ tournament: s.tournament ? { ...s.tournament, status: 'completed' } : null })),

      resetTournament: () => set({ tournament: null }),

      // ---- Runden ----
      generateRound: () =>
        set((s) => {
          const t = s.tournament;
          if (!t || t.playerIds.length < 4) return s;
          const activePlayers = t.playerIds.filter((id) =>
            s.players.find((p) => p.id === id && p.active)
          );
          if (activePlayers.length < 4) return s;
          const strengthMap: Record<string, number> = {};
          s.players.forEach((p) => { strengthMap[p.id] = p.strength; });
          const history = buildPairingHistory(t.rounds, t.winPoints);
          const result = generatePairings(activePlayers, history, t.courts, strengthMap);
          const newRound: Round = {
            id: nanoid(),
            number: t.rounds.length + 1,
            matches: result.matches.map((m, i) => ({
              id: nanoid(), court: i + 1, team1: m.team1, team2: m.team2,
            })),
            byePlayers: result.byePlayers,
            status: 'pending',
          };
          return { tournament: { ...t, status: 'running', rounds: [...t.rounds, newRound] } };
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
              ? { ...r, status: 'completed' as const, completedAt: new Date().toISOString() }
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
              ? { ...r, matches: r.matches.map((m) => (m.id === matchId ? { ...m, ...updates } : m)) }
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
          const rounds = t.rounds
            .filter((_, i) => i !== roundIndex)
            .map((r, i) => ({ ...r, number: i + 1 }));
          return { tournament: { ...t, rounds } };
        }),

      // ============================================================
      // Session-Management
      // ============================================================

      /**
       * Startet eine neue Live-Session als Admin.
       * Schreibt den aktuellen lokalen Zustand nach Supabase
       * und richtet die Realtime-Subscription ein.
       */
      startLiveSession: async () => {
        const { players, tournament } = get();
        set((s) => ({ session: { ...s.session, status: 'connecting', error: null } }));
        try {
          const { sessionId, adminSecret } = await createSession(players, tournament);
          set((_s) => ({
            session: { sessionId, adminSecret, status: 'connected', error: null },
          }));
          _setupSubscription(sessionId);
        } catch (err) {
          set((s) => ({
            session: { ...s.session, status: 'error', error: String(err) },
          }));
        }
      },

      /**
       * Tritt einer bestehenden Session bei.
       * Mit adminSecret → Schreibrechte (Admin).
       * Ohne adminSecret → Nur-Lesen (Zuschauer).
       */
      joinLiveSession: async (sessionId, adminSecret) => {
        set((s) => ({ session: { ...s.session, status: 'connecting', error: null } }));
        try {
          const row = await loadSession(sessionId);
          if (!row) throw new Error(`Session "${sessionId}" nicht gefunden`);

          // Admin-Secret prüfen (rein auf App-Ebene)
          const isValidAdmin = adminSecret && adminSecret === row.admin_secret;
          const secret = isValidAdmin ? adminSecret : null;

          _remoteUpdate = true;
          set({
            players: row.players,
            tournament: row.tournament,
            session: { sessionId, adminSecret: secret ?? null, status: 'connected', error: null },
          });
          _remoteUpdate = false;

          _setupSubscription(sessionId);
        } catch (err) {
          set((s) => ({
            session: { ...s.session, status: 'error', error: String(err) },
          }));
        }
      },

      /** Trennt die Verbindung zur Live-Session. */
      leaveLiveSession: () => {
        _unsubscribe?.();
        _unsubscribe = null;
        if (_syncTimeout) { clearTimeout(_syncTimeout); _syncTimeout = null; }
        set((s) => ({
          session: { ...s.session, sessionId: null, adminSecret: null, status: 'disconnected', error: null },
        }));
      },

      // ---- Sponsoren ----
      addSponsor: (data) =>
        set((s) => ({
          sponsors: [
            ...s.sponsors,
            { ...data, id: nanoid(), order: s.sponsors.length },
          ],
        })),

      updateSponsor: (id, data) =>
        set((s) => ({
          sponsors: s.sponsors.map((sp) => (sp.id === id ? { ...sp, ...data } : sp)),
        })),

      deleteSponsor: (id) =>
        set((s) => ({
          sponsors: s.sponsors
            .filter((sp) => sp.id !== id)
            .map((sp, i) => ({ ...sp, order: i })),
        })),

      reorderSponsors: (ids) =>
        set((s) => ({
          sponsors: ids
            .map((id, i) => {
              const sp = s.sponsors.find((x) => x.id === id);
              return sp ? { ...sp, order: i } : null;
            })
            .filter(Boolean) as Sponsor[],
        })),

      // ---- Import / Export ----
      exportAllData: () => {
        const { players, tournament } = get();
        return JSON.stringify({ players, tournament }, null, 2);
      },

      importAllData: (json) => {
        try {
          const data = JSON.parse(json) as { players?: Player[]; tournament?: Tournament };
          set({ players: data.players ?? [], tournament: data.tournament ?? null });
        } catch {
          throw new Error('Ungültiges JSON-Format');
        }
      },
    }),
    {
      name: 'badminton-baendele-turnier-v1',
      // Session-Status nicht persistieren (wird via URL wiederhergestellt)
      partialize: (s) => ({
        players: s.players,
        tournament: s.tournament,
        sponsors: s.sponsors,
        darkMode: s.darkMode,
        currentView: s.currentView,
        // session bewusst ausgelassen
      }),
    }
  )
);

// ============================================================
// Supabase-Sync (außerhalb des Stores, kein Re-Render-Loop)
// ============================================================

/**
 * Richtet die Realtime-Subscription ein.
 * Wird sowohl beim Session-Start als auch beim Beitreten aufgerufen.
 */
function _setupSubscription(sessionId: string) {
  // Bestehende Subscription aufräumen
  _unsubscribe?.();

  _unsubscribe = subscribeToSession(sessionId, (row: SessionRow) => {
    _remoteUpdate = true;
    useStore.setState({ players: row.players, tournament: row.tournament });
    _remoteUpdate = false;
  });
}

/**
 * Abonniert Store-Änderungen und schreibt sie debounced nach Supabase.
 * Reagiert nur wenn:
 *   a) Eine Session aktiv ist
 *   b) Der aktuelle User Admin ist (adminSecret vorhanden)
 *   c) Die Änderung NICHT von Supabase kam (_remoteUpdate = false)
 */
useStore.subscribe((state, prev) => {
  if (_remoteUpdate) return;

  const { session, players, tournament } = state;
  if (!session.sessionId || !session.adminSecret) return;

  // Nur bei relevanten Datenänderungen synchronisieren
  if (state.players === prev.players && state.tournament === prev.tournament) return;

  // Debounce: wartet 600 ms nach der letzten Änderung
  if (_syncTimeout) clearTimeout(_syncTimeout);
  _syncTimeout = setTimeout(() => {
    pushSessionState(session.sessionId!, session.adminSecret!, players, tournament);
  }, 600);
});
