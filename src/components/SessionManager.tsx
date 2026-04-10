/**
 * SessionManager
 * ==============
 * Ermöglicht dem Admin:
 *  - Eine neue Live-Session zu starten
 *  - Einer bestehenden Session beizutreten (als Admin oder Zuschauer)
 *
 * Zeigt nach dem Start:
 *  - Zuschauer-Link (zum Teilen)
 *  - Admin-Link (nur für den Admin)
 *  - QR-Code für die Halle
 */

import { useState } from 'react';
import { Wifi, WifiOff, Copy, Check, ExternalLink, Users, Crown, LogIn } from 'lucide-react';
import { useStore } from '../store';
import { supabaseConfigured } from '../services/supabaseClient';
import { Button } from './shared/Button';
import { Modal } from './shared/Modal';

// ============================================================
// Hilfsfunktionen für URL-Generierung
// ============================================================

function viewerUrl(sessionId: string): string {
  const base = window.location.origin + window.location.pathname;
  return `${base}?session=${sessionId}`;
}

function adminUrl(sessionId: string, adminSecret: string): string {
  const base = window.location.origin + window.location.pathname;
  return `${base}?session=${sessionId}&key=${adminSecret}`;
}

function qrUrl(text: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}&bgcolor=ffffff&color=166534&qzone=2`;
}

// ============================================================
// Kopier-Button mit Feedback
// ============================================================

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors flex-shrink-0"
      title="Kopieren"
    >
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

// ============================================================
// Link-Box (URL + Copy + Öffnen)
// ============================================================

function LinkBox({
  label,
  url,
  color = 'gray',
  icon: Icon,
}: {
  label: string;
  url: string;
  color?: 'green' | 'yellow' | 'gray';
  icon: React.FC<{ className?: string }>;
}) {
  const colorClass = {
    green:  'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    gray:   'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
  }[color];

  return (
    <div className={`rounded-xl border p-3 space-y-2 ${colorClass}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
        <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs text-gray-700 dark:text-gray-300 break-all font-mono bg-white/60 dark:bg-black/20 px-2 py-1 rounded-lg">
          {url}
        </code>
        <CopyButton text={url} />
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors flex-shrink-0"
          title="Öffnen"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

// ============================================================
// Session-Erstellen-Ansicht (nach erfolgreichem Start)
// ============================================================

function SessionCreated({
  sessionId,
  adminSecret,
}: {
  sessionId: string;
  adminSecret: string;
}) {
  const vUrl = viewerUrl(sessionId);
  const aUrl = adminUrl(sessionId, adminSecret);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
        <div>
          <p className="font-bold text-green-800 dark:text-green-300">Session aktiv!</p>
          <p className="text-xs text-green-600 dark:text-green-400">
            Session-ID: <code className="font-mono">{sessionId}</code>
          </p>
        </div>
      </div>

      {/* QR-Code für die Halle */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          QR-Code für Zuschauer (Beamer / Aushang)
        </p>
        <img
          src={qrUrl(vUrl)}
          alt="QR-Code Zuschauer-Link"
          className="w-40 h-40 rounded-xl border-4 border-white dark:border-gray-800 shadow-md"
        />
        <p className="text-xs text-gray-400">Scan → Turnier live mitverfolgen</p>
      </div>

      {/* Links */}
      <div className="space-y-3">
        <LinkBox label="Zuschauer-Link (zum Teilen)" url={vUrl} color="green" icon={Users} />
        <LinkBox label="Admin-Link (nur für dich – nicht teilen!)" url={aUrl} color="yellow" icon={Crown} />
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
        Alle Änderungen werden automatisch synchronisiert.
      </p>
    </div>
  );
}

// ============================================================
// Beitreten-Formular
// ============================================================

function JoinForm({ onClose }: { onClose: () => void }) {
  const { joinLiveSession, session } = useStore();
  const [id, setId] = useState('');
  const [key, setKey] = useState('');
  const loading = session.status === 'connecting';

  const handleJoin = async () => {
    if (!id.trim()) return;
    await joinLiveSession(id.trim(), key.trim() || undefined);
    if (useStore.getState().session.status === 'connected') onClose();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Session-ID
        </label>
        <input
          autoFocus
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="z. B. a1b2c3d4"
          className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Admin-Key <span className="font-normal text-gray-400">(optional – nur wenn du Änderungen machen willst)</span>
        </label>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Leer lassen für Zuschauer-Modus"
          type="password"
          className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
        />
      </div>
      {session.error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          ⚠️ {session.error}
        </p>
      )}
      <div className="flex gap-3">
        <Button className="flex-1" onClick={handleJoin} disabled={!id.trim() || loading}>
          {loading ? 'Verbinde…' : 'Beitreten'}
        </Button>
        <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
      </div>
    </div>
  );
}

// ============================================================
// Haupt-Komponente: SessionManager-Button + Modal
// ============================================================

export function SessionManagerButton() {
  const { session, startLiveSession, leaveLiveSession } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const isConnected = session.status === 'connected';
  const isConnecting = session.status === 'connecting';
  const isAdmin = Boolean(session.adminSecret);

  if (!supabaseConfigured) return null; // Kein Supabase → kein Button

  // ---- Verbunden: Status-Button ----
  if (isConnected) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <Wifi className="w-3.5 h-3.5" />
          {isAdmin ? 'Admin' : 'Zuschauer'}
        </button>

        {showModal && (
          <Modal title="Live-Session" onClose={() => setShowModal(false)}>
            <div className="space-y-4">
              {session.sessionId && isAdmin && session.adminSecret && (
                <SessionCreated sessionId={session.sessionId} adminSecret={session.adminSecret} />
              )}
              {session.sessionId && !isAdmin && (
                <div className="text-center py-4 space-y-2">
                  <Users className="w-10 h-10 text-brand-600 mx-auto" />
                  <p className="font-semibold text-gray-900 dark:text-white">Zuschauer-Modus</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Session: <code className="font-mono">{session.sessionId}</code>
                  </p>
                  <p className="text-sm text-gray-400">Updates werden automatisch empfangen.</p>
                </div>
              )}
              <Button
                variant="danger"
                className="w-full"
                onClick={() => { leaveLiveSession(); setShowModal(false); }}
                icon={WifiOff}
              >
                Session verlassen
              </Button>
            </div>
          </Modal>
        )}
      </>
    );
  }

  // ---- Nicht verbunden: Start/Join ----
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isConnecting}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        title="Live-Session starten oder beitreten"
      >
        {isConnecting
          ? <><span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />Verbinde…</>
          : <><WifiOff className="w-3.5 h-3.5" />Live</>
        }
      </button>

      {showModal && (
        <Modal
          title={showJoin ? 'Session beitreten' : 'Live-Session'}
          onClose={() => { setShowModal(false); setShowJoin(false); }}
        >
          {showJoin ? (
            <JoinForm onClose={() => { setShowModal(false); setShowJoin(false); }} />
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Starte eine Live-Session damit andere den Turnierstatus in Echtzeit
                mitverfolgen können. Nur du (als Admin) kannst Änderungen vornehmen.
              </p>

              {session.error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                  ⚠️ {session.error}
                </p>
              )}

              <div className="flex flex-col gap-3">
                <Button
                  icon={Wifi}
                  className="w-full"
                  onClick={async () => {
                    await startLiveSession();
                  }}
                  disabled={isConnecting}
                >
                  Neue Session starten (Admin)
                </Button>
                <Button
                  variant="secondary"
                  icon={LogIn}
                  className="w-full"
                  onClick={() => setShowJoin(true)}
                >
                  Bestehender Session beitreten
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
