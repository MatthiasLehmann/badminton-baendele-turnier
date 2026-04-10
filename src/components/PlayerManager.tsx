/**
 * Spielerverwaltung
 * - Spielerliste anzeigen und filtern
 * - Spieler hinzufügen / bearbeiten / löschen
 * - Import / Export als JSON
 */

import { useState, useRef } from 'react';
import {
  UserPlus, Pencil, Trash2, Upload, Download,
  Search, Users, ChevronUp, ChevronDown,
} from 'lucide-react';
import { useStore } from '../store';
import { Player } from '../types';
import { strengthToStars } from '../utils/helpers';
import { exportPlayersJSON, readFileAsText } from '../services/exportService';
import { Modal } from './shared/Modal';
import { Button } from './shared/Button';
import { Badge } from './shared/Badge';

// ============================================================
// Spieler-Formular (Erstellen & Bearbeiten)
// ============================================================

interface PlayerFormProps {
  initial?: Player;
  onSave: (data: Omit<Player, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

function PlayerForm({ initial, onSave, onCancel }: PlayerFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [club, setClub] = useState(initial?.club ?? '');
  const [strength, setStrength] = useState(initial?.strength ?? 3);
  const [active, setActive] = useState(initial?.active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), club: club.trim(), strength, active });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Vorname Nachname"
          className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Verein */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Verein / Gruppe
        </label>
        <input
          value={club}
          onChange={(e) => setClub(e.target.value)}
          placeholder="z. B. SC Grün-Weiß"
          className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Spielstärke */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Spielstärke: {strengthToStars(strength)}
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStrength(s)}
              className={`flex-1 py-2 rounded-lg text-lg font-bold transition-all ${
                strength === s
                  ? 'bg-brand-600 text-white shadow-md scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-brand-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">1 = Anfänger · 5 = Profi</p>
      </div>

      {/* Aktiv */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActive(!active)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            active ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              active ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {active ? 'Aktiv (nimmt am Turnier teil)' : 'Pausiert (wird nicht eingeteilt)'}
        </span>
      </div>

      {/* Aktionen */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary" className="flex-1">
          {initial ? 'Speichern' : 'Spieler hinzufügen'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}

// ============================================================
// Hauptkomponente
// ============================================================

export function PlayerManager() {
  const { players, addPlayer, updatePlayer, deletePlayer, importPlayers } = useStore();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'name' | 'club' | 'strength'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const fileRef = useRef<HTMLInputElement>(null);

  // Filtern + Sortieren
  const filtered = players
    .filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.club.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'club') cmp = a.club.localeCompare(b.club);
      else if (sortField === 'strength') cmp = a.strength - b.strength;
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  // JSON-Import
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const data = JSON.parse(text);
      const list: Player[] = Array.isArray(data) ? data : data.players ?? [];
      importPlayers(list);
    } catch {
      alert('Fehler beim Importieren der Spielerliste.');
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-brand-600" />
            Spielerverwaltung
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">
            {players.filter((p) => p.active).length} aktiv · {players.length} gesamt
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={Upload} onClick={() => fileRef.current?.click()}>
            Import JSON
          </Button>
          <Button variant="secondary" icon={Download} onClick={() => exportPlayersJSON(players)}>
            Export JSON
          </Button>
          <Button icon={UserPlus} onClick={() => { setEditingPlayer(null); setShowForm(true); }}>
            Spieler anlegen
          </Button>
        </div>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
      </div>

      {/* Suchfeld */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nach Name oder Verein suchen…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Tabelle */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">Keine Spieler vorhanden</p>
          <p className="text-sm mt-1">Lege deinen ersten Spieler an oder importiere eine Liste.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          {/* Tabellen-Header */}
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <button
              className="flex items-center gap-1 hover:text-brand-600 text-left"
              onClick={() => toggleSort('name')}
            >
              Name <SortIcon field="name" />
            </button>
            <button
              className="flex items-center gap-1 hover:text-brand-600 text-left"
              onClick={() => toggleSort('club')}
            >
              Verein <SortIcon field="club" />
            </button>
            <button
              className="flex items-center gap-1 hover:text-brand-600 text-left"
              onClick={() => toggleSort('strength')}
            >
              Stärke <SortIcon field="strength" />
            </button>
            <span>Status</span>
            <span>Aktionen</span>
          </div>

          {/* Zeilen */}
          {filtered.map((player) => (
            <div
              key={player.id}
              className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <span className="font-semibold text-gray-900 dark:text-white truncate">
                {player.name}
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm truncate">
                {player.club || '–'}
              </span>
              <span className="text-yellow-500 text-sm" title={`Stärke ${player.strength}/5`}>
                {strengthToStars(player.strength)}
              </span>
              <span>
                <Badge color={player.active ? 'green' : 'gray'}>
                  {player.active ? 'Aktiv' : 'Pausiert'}
                </Badge>
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => { setEditingPlayer(player); setShowForm(true); }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                  title="Bearbeiten"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(player.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formular-Modal */}
      {showForm && (
        <Modal
          title={editingPlayer ? 'Spieler bearbeiten' : 'Neuer Spieler'}
          onClose={() => setShowForm(false)}
        >
          <PlayerForm
            initial={editingPlayer ?? undefined}
            onSave={(data) => {
              if (editingPlayer) updatePlayer(editingPlayer.id, data);
              else addPlayer(data);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}

      {/* Lösch-Bestätigung */}
      {deleteConfirm && (
        <Modal title="Spieler löschen?" onClose={() => setDeleteConfirm(null)} size="sm">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Möchtest du{' '}
            <strong className="text-gray-900 dark:text-white">
              {players.find((p) => p.id === deleteConfirm)?.name}
            </strong>{' '}
            wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <div className="flex gap-3">
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => { deletePlayer(deleteConfirm!); setDeleteConfirm(null); }}
            >
              Ja, löschen
            </Button>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Abbrechen
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
