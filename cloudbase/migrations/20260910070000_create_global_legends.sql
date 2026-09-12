alter table public.demo_items rename to leaderboard_entries;
alter table public.leaderboard_entries
  add column if not exists score integer not null default 0,
  add column if not exists display_name text not null default '传奇球员',
  add column if not exists record jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();
create unique index if not exists leaderboard_entries_puid_uidx on public.leaderboard_entries (puid);
create index if not exists leaderboard_entries_score_idx on public.leaderboard_entries (score desc, updated_at asc, id asc);
delete from public.leaderboard_entries
where id in (
  select id
  from public.leaderboard_entries
  order by score desc, updated_at asc, id asc
  offset 50
);
alter table public.leaderboard_entries disable row level security;
grant select on public.leaderboard_entries to anon, authenticated, service_role, public;
grant insert, update, delete on public.leaderboard_entries to authenticated, service_role, public;
