alter table public.demo_items rename to leaderboard_entries;
truncate table public.leaderboard_entries;
alter table public.leaderboard_entries
  add column score integer not null default 0,
  add column display_name text not null default '传奇球员',
  add column record jsonb not null default '{}'::jsonb,
  add column updated_at timestamptz not null default now();
create unique index leaderboard_entries_puid_uidx on public.leaderboard_entries (puid);
create index leaderboard_entries_score_idx on public.leaderboard_entries (score desc, updated_at asc, id asc);
alter table public.leaderboard_entries disable row level security;
grant select on public.leaderboard_entries to anon, authenticated, service_role, public;
grant insert, update on public.leaderboard_entries to authenticated, service_role, public;
