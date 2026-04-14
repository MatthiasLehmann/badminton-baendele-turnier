// ============================================================
// Kerntypen für das Bändelturnier
// ============================================================

/** Ein einzelner Spieler (wird turnier-übergreifend gespeichert) */
export interface Player {
  id: string;
  name: string;
  club: string;          // Verein / Gruppe
  strength: number;      // Spielstärke 1–5 (1 = Anfänger, 5 = Profi)
  active: boolean;       // Kann pausiert/deaktiviert werden
  createdAt: string;     // ISO-Datum
}

/** Ergebnis eines einzelnen Matches */
export interface MatchResult {
  score1: number;        // Punkte Team 1
  score2: number;        // Punkte Team 2
  enteredAt: string;     // ISO-Datum der Eingabe
}

/** Ein Match innerhalb einer Runde */
export interface Match {
  id: string;
  court: number;                // Feldnummer (1-basiert)
  team1: [string, string];      // Spieler-IDs von Team 1
  team2: [string, string];      // Spieler-IDs von Team 2
  result?: MatchResult;
}

/** Eine Runde des Turniers */
export interface Round {
  id: string;
  number: number;               // Rundennummer (1-basiert)
  matches: Match[];
  byePlayers: string[];         // Spieler-IDs die diese Runde pausieren
  status: 'pending' | 'active' | 'completed';
  startedAt?: string;
  completedAt?: string;
}

/** Konfiguration beim Anlegen eines Turniers */
export interface TournamentConfig {
  name: string;
  date: string;
  courts: number;               // Anzahl verfügbarer Felder
  roundDuration: number;        // Rundendauer in Minuten
  winPoints: number;            // Bändel/Punkte pro Sieg (Standard: 1)
  trackSetPoints: boolean;      // Satzergebnisse zusätzlich speichern?
}

/** Das laufende Turnier */
export interface Tournament {
  id: string;
  name: string;
  date: string;
  courts: number;
  roundDuration: number;
  winPoints: number;
  trackSetPoints: boolean;
  playerIds: string[];          // IDs der angemeldeten Spieler
  rounds: Round[];
  status: 'setup' | 'running' | 'completed';
}

// ============================================================
// Berechnete Statistiken (werden nicht gespeichert, sondern
// aus den Turnierdaten berechnet)
// ============================================================

/** Statistiken eines Spielers für die Rangliste */
export interface PlayerStats {
  playerId: string;
  wins: number;
  losses: number;
  byes: number;
  totalGames: number;
  bandel: number;               // Gewonnene Bändel (= wins * winPoints)
  scoreDiff: number;            // Punktedifferenz (score1 - score2 aufsummiert)
  scoreFor: number;             // Eigene Punkte gesamt
  partners: Record<string, number>;   // partnerId → Anzahl gemeinsame Spiele
  opponents: Record<string, number>;  // opponentId → Anzahl Duelle
}

// ============================================================
// Algorithmus-Typen
// ============================================================

/** Geschichte der Paarungen – Eingabe für den Pairing-Algorithmus */
export interface PairingHistory {
  /** Wie oft hat Spieler A mit Spieler B zusammengespielt? */
  partners: Record<string, Record<string, number>>;
  /** Wie oft hat Spieler A gegen Spieler B gespielt? */
  opponents: Record<string, Record<string, number>>;
  /** Wie viele Pausen hat jeder Spieler bisher? */
  byes: Record<string, number>;
}

/** Ergebnis des Pairing-Algorithmus für eine Runde */
export interface PairingResult {
  matches: Array<{
    team1: [string, string];
    team2: [string, string];
  }>;
  byePlayers: string[];
  /** Qualitätsbewertung: niedriger = besser (weniger Wiederholungen) */
  qualityScore: number;
  /** Anzahl Partner-Wiederholungen in dieser Runde */
  partnerRepeats: number;
  /** Anzahl Gegner-Wiederholungen in dieser Runde */
  opponentRepeats: number;
}

// ============================================================
// Sponsoren
// ============================================================

export interface Sponsor {
  id: string;
  name: string;
  logoDataUrl: string;   // Base64-kodiertes Bild (data URL)
  website?: string;
  order: number;
}

// ============================================================
// UI-State
// ============================================================

export type ViewName =
  | 'dashboard'
  | 'players'
  | 'tournament'
  | 'rounds'
  | 'standings'
  | 'presentation'
  | 'help';

// ============================================================
// Live-Session (Supabase)
// ============================================================

/** Status der Supabase-Verbindung */
export type SessionStatus =
  | 'disconnected'   // Keine Session aktiv
  | 'connecting'     // Verbindungsaufbau
  | 'connected'      // Verbunden und synchron
  | 'error';         // Verbindungsfehler

/** Alles was eine aktive Session beschreibt */
export interface SessionState {
  sessionId: string | null;
  adminSecret: string | null;   // null = Zuschauer, string = Admin
  status: SessionStatus;
  error: string | null;
}
