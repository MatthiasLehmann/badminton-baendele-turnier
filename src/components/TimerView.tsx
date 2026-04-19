import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import { useStore } from '../store';

// ============================================================
// Audio helpers
// ============================================================

function playEndBeep() {
  try {
    const ctx = new AudioContext();
    const frequencies = [880, 660, 440];
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.35;
      osc.start(start);
      osc.stop(start + 0.3);
      gain.gain.setValueAtTime(0.5, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
    });
  } catch {
    // AudioContext not available
  }
}

function speak(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'de-DE';
  utt.rate = 0.95;
  window.speechSynthesis.speak(utt);
}

// ============================================================
// Timer logic
// ============================================================

type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

const ANNOUNCE_AT = [5 * 60, 2 * 60, 60]; // seconds remaining

function announceRemaining(seconds: number) {
  if (seconds === 5 * 60)    speak('Noch 5 Minuten');
  else if (seconds === 2 * 60) speak('Noch 2 Minuten');
  else if (seconds === 60)     speak('Noch 1 Minute');
}

// ============================================================
// Sub-components
// ============================================================

function TimerDisplay({ seconds, status }: { seconds: number; status: TimerStatus }) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const display = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const colorClass =
    status === 'finished' ? 'text-red-500 dark:text-red-400' :
    seconds <= 60         ? 'text-orange-500 dark:text-orange-400' :
    seconds <= 2 * 60     ? 'text-yellow-500 dark:text-yellow-400' :
                            'text-gray-900 dark:text-white';

  return (
    <div className={`text-8xl md:text-9xl font-mono font-bold tabular-nums tracking-tight transition-colors ${colorClass}`}>
      {status === 'finished' ? 'ENDE' : display}
    </div>
  );
}

interface ControlButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

function ControlButton({ onClick, disabled = false, variant = 'secondary', children }: ControlButtonProps) {
  const base = 'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed';
  const styles = {
    primary:   'bg-brand-500 hover:bg-brand-600 text-white shadow-md',
    secondary: 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>
      {children}
    </button>
  );
}

// ============================================================
// Main component
// ============================================================

export function TimerView() {
  const tournament = useStore((s) => s.tournament);
  const defaultMinutes = tournament?.roundDuration ?? 15;

  const [totalSeconds, setTotalSeconds] = useState(defaultMinutes * 60);
  const [remaining, setRemaining]       = useState(defaultMinutes * 60);
  const [status, setStatus]             = useState<TimerStatus>('idle');

  // Timestamp-based tracking — survives background throttling
  const startedAtRef    = useRef<number | null>(null); // Date.now() when last resumed
  const elapsedRef      = useRef<number>(0);           // accumulated seconds before last pause
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const announcedRef    = useRef<Set<number>>(new Set());
  const statusRef       = useRef<TimerStatus>('idle');
  const totalSecondsRef = useRef(totalSeconds);

  statusRef.current       = status;
  totalSecondsRef.current = totalSeconds;

  // Sync default when tournament changes (only while idle)
  useEffect(() => {
    if (status === 'idle') {
      const secs = defaultMinutes * 60;
      setTotalSeconds(secs);
      setRemaining(secs);
    }
  }, [defaultMinutes, status]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Core update: calculate remaining from wall-clock time
  const updateRemaining = useCallback(() => {
    if (startedAtRef.current === null) return;

    const elapsed = elapsedRef.current + Math.floor((Date.now() - startedAtRef.current) / 1000);
    const next    = Math.max(0, totalSecondsRef.current - elapsed);

    // Fire announcements for any threshold we've crossed
    for (const threshold of ANNOUNCE_AT) {
      if (next <= threshold && !announcedRef.current.has(threshold)) {
        announcedRef.current.add(threshold);
        announceRemaining(threshold);
      }
    }

    setRemaining(next);

    if (next === 0 && statusRef.current === 'running') {
      clearTimer();
      setStatus('finished');
      speak('Ende');
      playEndBeep();
    }
  }, [clearTimer]);

  // Re-sync immediately when tab becomes visible again
  useEffect(() => {
    const onVisibilityChange = () => {
      if (!document.hidden && statusRef.current === 'running') {
        updateRemaining();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [updateRemaining]);

  const handleStart = () => {
    if (status === 'finished') return;
    if (status === 'idle') {
      speak(`Runde gestartet, ${Math.floor(totalSeconds / 60)} Minuten`);
      announcedRef.current.clear();
      elapsedRef.current = 0;
    }
    startedAtRef.current = Date.now();
    setStatus('running');
    intervalRef.current = setInterval(updateRemaining, 500); // 500 ms for responsiveness
  };

  const handlePause = () => {
    if (startedAtRef.current !== null) {
      elapsedRef.current += Math.floor((Date.now() - startedAtRef.current) / 1000);
      startedAtRef.current = null;
    }
    clearTimer();
    setStatus('paused');
  };

  const handleStop = () => {
    clearTimer();
    startedAtRef.current = null;
    elapsedRef.current   = 0;
    announcedRef.current.clear();
    setStatus('idle');
    setRemaining(totalSeconds);
    window.speechSynthesis?.cancel();
  };

  const handleReset = () => {
    clearTimer();
    startedAtRef.current = null;
    elapsedRef.current   = 0;
    announcedRef.current.clear();
    setStatus('idle');
    setRemaining(totalSeconds);
    window.speechSynthesis?.cancel();
  };

  useEffect(() => () => clearTimer(), [clearTimer]);

  const progress = totalSeconds > 0 ? (remaining / totalSeconds) * 100 : 0;

  const progressColor =
    remaining <= 60      ? 'bg-red-500' :
    remaining <= 2 * 60  ? 'bg-orange-400' :
    remaining <= 5 * 60  ? 'bg-yellow-400' :
                           'bg-brand-500';

  return (
    <div className="max-w-xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Timer</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Rundendauer: {Math.floor(totalSeconds / 60)} Minuten
          {tournament && ` · ${tournament.name}`}
        </p>
      </div>

      {/* Timer card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center gap-8">

        <TimerDisplay seconds={remaining} status={status} />

        {/* Progress bar */}
        <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Announcement markers */}
        <div className="flex gap-6 text-xs text-gray-400 dark:text-gray-500">
          {[5, 2, 1].map((min) => {
            const secs = min * 60;
            const reached = remaining <= secs && status !== 'idle';
            return (
              <span key={min} className={reached ? 'text-brand-500 font-semibold' : ''}>
                {min} min
              </span>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-3">
          {(status === 'idle' || status === 'paused') && (
            <ControlButton variant="primary" onClick={handleStart}>
              <Play className="w-5 h-5" />
              {status === 'paused' ? 'Weiter' : 'Start'}
            </ControlButton>
          )}
          {status === 'running' && (
            <ControlButton onClick={handlePause}>
              <Pause className="w-5 h-5" />
              Pause
            </ControlButton>
          )}
          <ControlButton onClick={handleStop} disabled={status === 'idle'}>
            <Square className="w-5 h-5" />
            Stop
          </ControlButton>
          <ControlButton onClick={handleReset} disabled={status === 'idle' && remaining === totalSeconds}>
            <RotateCcw className="w-5 h-5" />
            Reset
          </ControlButton>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300 space-y-1">
        <p className="font-semibold">Sprachansagen</p>
        <p>Start · noch 5 Min · noch 2 Min · noch 1 Min · Ende + Ton</p>
        <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
          Lautstärke über die Systemlautstärke steuern. Browser muss Ton-Berechtigung haben.
        </p>
      </div>
    </div>
  );
}
