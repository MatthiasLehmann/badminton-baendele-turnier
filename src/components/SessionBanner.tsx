/**
 * SessionBanner
 * Zeigt einen farbigen Hinweis-Streifen unterhalb des Headers,
 * wenn eine Live-Session aktiv ist.
 * - Grün + "Admin" = Schreibrechte
 * - Blau + "Zuschauer" = Nur-Lesen
 */

import { Crown, Users, WifiOff } from 'lucide-react';
import { useStore } from '../store';

export function SessionBanner() {
  const { session, leaveLiveSession } = useStore();

  if (session.status !== 'connected' || !session.sessionId) return null;

  const isAdmin = Boolean(session.adminSecret);

  return (
    <div
      className={`flex items-center justify-between px-4 py-1.5 text-xs font-semibold ${
        isAdmin
          ? 'bg-yellow-400 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100'
          : 'bg-brand-600 dark:bg-brand-700 text-white'
      }`}
    >
      <div className="flex items-center gap-2">
        {isAdmin
          ? <Crown className="w-3.5 h-3.5" />
          : <Users className="w-3.5 h-3.5" />
        }
        <span>
          {isAdmin ? 'Admin' : 'Zuschauer'} · Live-Session
        </span>
        <code className="font-mono opacity-75">{session.sessionId}</code>
        {!isAdmin && (
          <span className="opacity-75">· Nur-Lesen – Änderungen nicht möglich</span>
        )}
      </div>

      <button
        onClick={leaveLiveSession}
        className="flex items-center gap-1 opacity-75 hover:opacity-100 transition-opacity"
        title="Session verlassen"
      >
        <WifiOff className="w-3 h-3" />
        Verlassen
      </button>
    </div>
  );
}
