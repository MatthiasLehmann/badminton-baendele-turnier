/**
 * App-Root mit Navigation
 */

import { Moon, Sun, LayoutDashboard, Users, Trophy, List, BarChart2, Monitor, HelpCircle } from 'lucide-react';
import { useStore } from './store';
import { Dashboard } from './components/Dashboard';
import { PlayerManager } from './components/PlayerManager';
import { TournamentSetup } from './components/TournamentSetup';
import { RoundView } from './components/RoundView';
import { Standings } from './components/Standings';
import { PresentationMode } from './components/PresentationMode';
import { HelpPage } from './components/HelpPage';
import { ViewName } from './types';

// ============================================================
// Navigation
// ============================================================

interface NavItem {
  id: ViewName;
  label: string;
  icon: React.FC<{ className?: string }>;
  shortLabel: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',     label: 'Dashboard',     shortLabel: 'Start',     icon: LayoutDashboard },
  { id: 'players',       label: 'Spieler',        shortLabel: 'Spieler',   icon: Users           },
  { id: 'tournament',    label: 'Turnier',         shortLabel: 'Turnier',   icon: Trophy          },
  { id: 'rounds',        label: 'Runden',          shortLabel: 'Runden',    icon: List            },
  { id: 'standings',     label: 'Rangliste',       shortLabel: 'Rang',      icon: BarChart2       },
  { id: 'presentation',  label: 'Beamer',          shortLabel: 'Beamer',    icon: Monitor         },
  { id: 'help',          label: 'Hilfe',            shortLabel: 'Hilfe',     icon: HelpCircle      },
];

// ============================================================
// App
// ============================================================

export function App() {
  const { currentView, setView, darkMode, toggleDarkMode, tournament } = useStore();

  // Dark-Mode-Klasse am HTML-Element setzen
  if (darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  const activeRound = tournament?.rounds.find((r) => r.status === 'active');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* ---- Top-Bar ---- */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          {/* Logo */}
          <button
            onClick={() => setView('dashboard')}
            className="flex items-center gap-2 font-black text-brand-700 dark:text-brand-400 text-lg"
          >
            🏸 <span className="hidden sm:inline">Bändelturnier</span>
          </button>

          {/* Desktop-Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  currentView === id
                    ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {id === 'rounds' && activeRound && (
                  <span className="ml-1 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                )}
              </button>
            ))}
          </nav>

          {/* Dark-Mode-Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={darkMode ? 'Hell-Modus' : 'Dunkel-Modus'}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ---- Inhalt ---- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 animate-fade-in">
        {currentView === 'dashboard'    && <Dashboard />}
        {currentView === 'players'      && <PlayerManager />}
        {currentView === 'tournament'   && <TournamentSetup />}
        {currentView === 'rounds'       && <RoundView />}
        {currentView === 'standings'    && <Standings />}
        {currentView === 'presentation' && <PresentationMode />}
        {currentView === 'help'         && <HelpPage />}
      </main>

      {/* ---- Mobile Bottom-Navigation ---- */}
      <nav className="md:hidden sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40">
        <div className="flex">
          {NAV_ITEMS.map(({ id, shortLabel, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs font-semibold transition-colors ${
                currentView === id
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {id === 'rounds' && activeRound && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500" />
                )}
              </div>
              <span>{shortLabel}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
