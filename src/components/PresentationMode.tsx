/**
 * Präsentationsmodus – Beamer / TV Ansicht
 * - Große Schrift, optimiert für Distanz
 * - Paarungen + Rangliste + Sponsoren
 * - Automatischer Wechsel zwischen Ansichten (optional)
 * - Vollbild-Button
 * - Sponsoren-Verwaltung (Upload, Löschen)
 */

import { useState, useEffect, useRef } from 'react';
import { Monitor, RefreshCw, Maximize2, Trophy, Swords, Star, Plus, Trash2, X, Upload, ExternalLink, GripVertical } from 'lucide-react';
import { useStore } from '../store';
import { computeAllStats } from '../utils/helpers';
import { Sponsor } from '../types';

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
// Sponsoren-Ansicht (Beamer)
// ============================================================

function PresentationSponsors() {
  const { sponsors } = useStore();
  const sorted = [...sponsors].sort((a, b) => a.order - b.order);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Star className="w-16 h-16 text-white/20 mb-4" />
        <p className="text-white/40 text-2xl font-semibold">Noch keine Sponsoren</p>
        <p className="text-white/30 text-lg mt-2">Logos über „Sponsoren verwalten" hochladen</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="text-center">
        <div className="text-white/60 text-xl uppercase tracking-widest font-semibold mb-1">
          Vielen Dank an unsere
        </div>
        <div className="text-white text-5xl font-black flex items-center justify-center gap-3">
          <Star className="w-12 h-12 text-yellow-400" />
          Sponsoren
        </div>
      </div>

      <div className={`flex flex-wrap justify-center items-center gap-8 ${
        sorted.length === 1 ? 'justify-center' : ''
      }`}>
        {sorted.map((sponsor) => (
          <div
            key={sponsor.id}
            className="flex flex-col items-center gap-3 bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20"
            style={{ minWidth: '160px', maxWidth: sorted.length === 1 ? '400px' : '220px' }}
          >
            <div className="bg-white rounded-2xl p-4 flex items-center justify-center"
              style={{ width: sorted.length === 1 ? '280px' : '160px', height: sorted.length === 1 ? '180px' : '100px' }}
            >
              <img
                src={sponsor.logoDataUrl}
                alt={sponsor.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="text-white font-bold text-lg text-center">{sponsor.name}</div>
            {sponsor.website && (
              <div className="text-white/50 text-sm text-center truncate max-w-full">
                {sponsor.website.replace(/^https?:\/\//, '')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Sponsoren-Verwaltungs-Modal
// ============================================================

function SponsorManagerModal({ onClose }: { onClose: () => void }) {
  const { sponsors, addSponsor, deleteSponsor, updateSponsor, reorderSponsors } = useStore();
  const sorted = [...sponsors].sort((a, b) => a.order - b.order);

  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Drag-and-drop Reihenfolge
  const [dragging, setDragging] = useState<string | null>(null);

  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Nur Bilddateien (PNG, JPG, SVG, WebP) erlaubt.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Bild darf maximal 5 MB groß sein.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  const handleAdd = () => {
    if (!preview) { setError('Bitte zuerst ein Logo hochladen.'); return; }
    if (!name.trim()) { setError('Bitte einen Sponsoren-Namen eingeben.'); return; }
    addSponsor({ name: name.trim(), logoDataUrl: preview, website: website.trim() || undefined });
    setName('');
    setWebsite('');
    setPreview(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // Einfaches Drag-Reorder
  const handleDragStart = (id: string) => setDragging(id);
  const handleDragEnterItem = (targetId: string) => {
    if (!dragging || dragging === targetId) return;
    const ids = sorted.map((s) => s.id);
    const from = ids.indexOf(dragging);
    const to = ids.indexOf(targetId);
    const newIds = [...ids];
    newIds.splice(from, 1);
    newIds.splice(to, 0, dragging);
    reorderSponsors(newIds);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Sponsoren verwalten
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-6">
          {/* Neuen Sponsor hinzufügen */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Neuer Sponsor
            </h3>

            {/* Logo-Upload */}
            <div
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-brand-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {preview ? (
                <div className="relative inline-block">
                  <img src={preview} alt="Vorschau" className="max-h-24 max-w-full mx-auto rounded-lg object-contain" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Logo hier ablegen oder klicken
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">PNG, JPG, SVG, WebP · max. 5 MB</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>

            {/* Name + Website */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sponsoren-Name"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Website (optional)
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              onClick={handleAdd}
              disabled={!preview || !name.trim()}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 text-white font-semibold py-2.5 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Sponsor hinzufügen
            </button>
          </div>

          {/* Vorhandene Sponsoren */}
          {sorted.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Sponsoren ({sorted.length})
                {sorted.length > 1 && (
                  <span className="ml-2 text-xs font-normal normal-case text-gray-400">· zum Sortieren ziehen</span>
                )}
              </h3>

              <div className="space-y-2">
                {sorted.map((sponsor) => (
                  <SponsorRow
                    key={sponsor.id}
                    sponsor={sponsor}
                    onDelete={() => deleteSponsor(sponsor.id)}
                    onUpdate={(data) => updateSponsor(sponsor.id, data)}
                    onDragStart={() => handleDragStart(sponsor.id)}
                    onDragEnter={() => handleDragEnterItem(sponsor.id)}
                    onDragEnd={() => setDragging(null)}
                    isDragging={dragging === sponsor.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-2.5 rounded-xl transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Einzelne Sponsor-Zeile im Modal ----

interface SponsorRowProps {
  sponsor: Sponsor;
  onDelete: () => void;
  onUpdate: (data: Partial<Omit<Sponsor, 'id'>>) => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

function SponsorRow({ sponsor, onDelete, onUpdate, onDragStart, onDragEnter, onDragEnd, isDragging }: SponsorRowProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(sponsor.name);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={`flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 border transition-all ${
        isDragging
          ? 'border-brand-400 opacity-50 scale-95'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Drag-Handle */}
      <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 cursor-grab active:cursor-grabbing" />

      {/* Logo */}
      <div className="w-12 h-10 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-600 overflow-hidden">
        <img src={sponsor.logoDataUrl} alt={sponsor.name} className="max-w-full max-h-full object-contain" />
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        {editingName ? (
          <input
            autoFocus
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onBlur={() => { onUpdate({ name: nameVal.trim() || sponsor.name }); setEditingName(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { onUpdate({ name: nameVal.trim() || sponsor.name }); setEditingName(false); } if (e.key === 'Escape') { setNameVal(sponsor.name); setEditingName(false); } }}
            className="w-full text-sm font-medium rounded border border-brand-300 px-2 py-0.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
          />
        ) : (
          <button
            onClick={() => { setNameVal(sponsor.name); setEditingName(true); }}
            className="text-sm font-medium text-gray-900 dark:text-white truncate hover:text-brand-600 dark:hover:text-brand-400 transition-colors text-left w-full"
          >
            {sponsor.name}
          </button>
        )}
        {sponsor.website && (
          <a
            href={sponsor.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-gray-400 hover:text-brand-500 flex items-center gap-0.5 truncate"
          >
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
            {sponsor.website.replace(/^https?:\/\//, '')}
          </a>
        )}
      </div>

      {/* Löschen */}
      <button
        onClick={onDelete}
        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
        title="Sponsor entfernen"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ============================================================
// Haupt-Präsentationskomponente
// ============================================================

type BeamerView = 'pairings' | 'standings' | 'sponsors';

export function PresentationMode() {
  const { tournament, sponsors } = useStore();
  const [view, setView] = useState<BeamerView>('pairings');
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotateInterval, setRotateInterval] = useState(15); // Sekunden
  const [showSponsorManager, setShowSponsorManager] = useState(false);

  // Auto-Rotation: alle Views durchlaufen (Sponsoren nur wenn vorhanden)
  useEffect(() => {
    if (!autoRotate) return;
    const views: BeamerView[] = ['pairings', 'standings', ...(sponsors.length > 0 ? ['sponsors' as BeamerView] : [])];
    const id = setInterval(() => {
      setView((v) => {
        const idx = views.indexOf(v);
        return views[(idx + 1) % views.length];
      });
    }, rotateInterval * 1000);
    return () => clearInterval(id);
  }, [autoRotate, rotateInterval, sponsors.length]);

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
    <>
      <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-blue-900 rounded-2xl overflow-hidden">
        {/* Steuer-Bar (klein, oben) */}
        <div className="flex items-center justify-between px-6 py-3 bg-black/20 border-b border-white/10 flex-wrap gap-2">
          {/* Ansichts-Wechsel */}
          <div className="flex gap-2 flex-wrap">
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
            <button
              onClick={() => setView('sponsors')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                view === 'sponsors'
                  ? 'bg-white text-brand-900'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Star className="w-4 h-4" />
              Sponsoren
              {sponsors.length > 0 && (
                <span className="bg-yellow-400 text-yellow-900 text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">
                  {sponsors.length}
                </span>
              )}
            </button>
          </div>

          {/* Rechts: Sponsoren verwalten + Auto-Rotate + Vollbild */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Sponsoren verwalten */}
            <button
              onClick={() => setShowSponsorManager(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 text-sm transition-colors"
              title="Sponsoren verwalten"
            >
              <Plus className="w-3.5 h-3.5" />
              Verwalten
            </button>

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
          {view === 'pairings'  && <PresentationRound />}
          {view === 'standings' && <PresentationStandings />}
          {view === 'sponsors'  && <PresentationSponsors />}
        </div>
      </div>

      {/* Sponsor-Verwaltungs-Modal */}
      {showSponsorManager && (
        <SponsorManagerModal onClose={() => setShowSponsorManager(false)} />
      )}
    </>
  );
}
