/**
 * Supabase Session-Service
 * ========================
 *
 * Verwaltet Live-Sessions für das Bändelturnier:
 *
 *  - Admin erstellt eine Session  → bekommt Session-ID + Admin-Secret
 *  - Admin teilt den Zuschauer-Link (ohne Secret)
 *  - Alle Browser mit dem Zuschauer-Link sehen den Status live
 *  - Nur der Admin (mit Secret) darf Änderungen vornehmen
 *
 * Datenbankschema: siehe supabase/schema.sql
 *
 * Realtime: Supabase Postgres Changes – jede UPDATE-Operation auf
 * `tournament_sessions` wird an alle Subscriber gebroadcastet.
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from './supabaseClient';
import { Player, Tournament } from '../types';

// ============================================================
// Typen
// ============================================================

export interface SessionRow {
  id: string;
  admin_secret: string;
  players: Player[];
  tournament: Tournament | null;
  updated_at: string;
}

export interface SessionInfo {
  sessionId: string;
  adminSecret: string;
}

// ============================================================
// Öffentliche API
// ============================================================

/**
 * Erstellt eine neue Session in Supabase.
 * Wird vom Admin aufgerufen wenn er "Live-Session starten" klickt.
 */
export async function createSession(
  players: Player[],
  tournament: Tournament | null
): Promise<SessionInfo> {
  if (!supabase) throw new Error('Supabase nicht konfiguriert');

  const adminSecret = randomSecret();

  const { data, error } = await supabase
    .from('tournament_sessions')
    .insert({
      admin_secret: adminSecret,
      players,
      tournament,
    })
    .select('id')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Session konnte nicht erstellt werden');

  return { sessionId: data.id as string, adminSecret };
}

/**
 * Lädt den aktuellen Zustand einer Session (einmalig beim Verbinden).
 * Funktioniert für Admin und Zuschauer.
 */
export async function loadSession(sessionId: string): Promise<SessionRow | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('tournament_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !data) return null;
  return data as SessionRow;
}

/**
 * Schreibt den aktuellen App-Zustand in die Session.
 * Nur der Admin darf dies aufrufen (adminSecret wird serverseitig
 * über RLS-Policy geprüft – nur Rows mit passendem admin_secret
 * dürfen aktualisiert werden).
 */
export async function pushSessionState(
  sessionId: string,
  adminSecret: string,
  players: Player[],
  tournament: Tournament | null
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('tournament_sessions')
    .update({ players, tournament })
    .eq('id', sessionId)
    .eq('admin_secret', adminSecret); // Schreibschutz auf App-Ebene

  if (error) console.error('[Supabase] Push fehlgeschlagen:', error.message);
}

/**
 * Abonniert Echtzeit-Updates einer Session.
 * Gibt eine Cleanup-Funktion zurück (für useEffect-Return).
 */
export function subscribeToSession(
  sessionId: string,
  onUpdate: (row: SessionRow) => void
): () => void {
  if (!supabase) return () => {};

  let channel: RealtimeChannel;

  channel = supabase
    .channel(`session-${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'tournament_sessions',
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        onUpdate(payload.new as SessionRow);
      }
    )
    .subscribe();

  return () => {
    supabase!.removeChannel(channel);
  };
}

// ============================================================
// Hilfsfunktionen
// ============================================================

/** Erzeugt ein kurzes, zufälliges Admin-Secret (16 Zeichen, URL-sicher) */
function randomSecret(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

export { supabaseConfigured };
