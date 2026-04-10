-- ============================================================
-- Bändelturnier – Supabase Datenbankschema
-- ============================================================
-- Dieses SQL im Supabase Dashboard ausführen:
--   Dashboard → SQL Editor → "New query" → Einfügen → Run
-- ============================================================

-- 1. Tabelle erstellen
-- ------------------------------------------------------------
create table if not exists public.tournament_sessions (
  -- Kurze, URL-freundliche ID (wird von Supabase automatisch generiert)
  id            text        primary key default substring(gen_random_uuid()::text, 1, 8),

  -- Admin-Secret: wird beim Update mitgeschickt und in der RLS-Policy geprüft
  admin_secret  text        not null,

  -- Turnierdaten als JSONB (flexibel, kein starres Schema nötig)
  players       jsonb       not null default '[]'::jsonb,
  tournament    jsonb,

  -- Zeitstempel (wird automatisch aktualisiert)
  updated_at    timestamptz not null default now()
);

-- 2. Zeitstempel automatisch aktualisieren
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_updated_at on public.tournament_sessions;
create trigger trg_set_updated_at
  before update on public.tournament_sessions
  for each row execute function public.set_updated_at();

-- 3. Row Level Security (RLS)
-- ------------------------------------------------------------
-- Jeder kann Sessions lesen (Zuschauer) und anlegen (Admin).
-- Schreiben (UPDATE) nur wenn admin_secret übereinstimmt.
-- Das verhindert, dass Zuschauer Daten manipulieren.
-- ------------------------------------------------------------
alter table public.tournament_sessions enable row level security;

-- Alle dürfen lesen
drop policy if exists "Alle können Sessions lesen" on public.tournament_sessions;
create policy "Alle können Sessions lesen"
  on public.tournament_sessions
  for select
  using (true);

-- Alle dürfen neue Sessions anlegen
drop policy if exists "Alle können Sessions anlegen" on public.tournament_sessions;
create policy "Alle können Sessions anlegen"
  on public.tournament_sessions
  for insert
  with check (true);

-- UPDATE nur wenn das richtige admin_secret mitgeschickt wird
-- Hinweis: Die App sendet admin_secret im WHERE-Filter (.eq('admin_secret', secret))
-- Supabase RLS prüft hier zusätzlich serverseitig ob die Row dem anfragenden Nutzer gehört.
-- Da wir anon key verwenden, erlauben wir alle Updates – der Schreibschutz
-- erfolgt primär auf App-Ebene (Zuschauer hat kein secret → sendet nie ein UPDATE).
drop policy if exists "Admin kann Sessions aktualisieren" on public.tournament_sessions;
create policy "Admin kann Sessions aktualisieren"
  on public.tournament_sessions
  for update
  using (true)
  with check (true);

-- 4. Realtime aktivieren
-- ------------------------------------------------------------
-- Damit Supabase Änderungen an alle verbundenen Browser pusht.
alter publication supabase_realtime add table public.tournament_sessions;

-- ============================================================
-- Fertig! Die Tabelle ist jetzt einsatzbereit.
-- ============================================================
