-- Split the leaderboard by mode without changing legacy client behavior.
-- Missing mode always means classic, and the old RPC signatures remain as
-- classic-mode wrappers so an already published bundle keeps working.
alter table public.leaderboard_entries
  add column if not exists game_mode text not null default 'classic';

update public.leaderboard_entries set game_mode = 'classic' where game_mode is null;

alter table public.leaderboard_entries
  drop constraint if exists leaderboard_entries_game_mode_check;
alter table public.leaderboard_entries
  add constraint leaderboard_entries_game_mode_check
  check (game_mode in ('classic', 'random_trade'));

drop index if exists public.leaderboard_entries_puid_uidx;
create unique index if not exists leaderboard_entries_puid_mode_uidx
  on public.leaderboard_entries (puid, game_mode);
create index if not exists leaderboard_entries_mode_score_idx
  on public.leaderboard_entries (game_mode, score desc, updated_at asc, id asc);

create or replace function public.submit_legendary_leaderboard_record(
  p_puid text,
  p_display_name text,
  p_score integer,
  p_record jsonb,
  p_game_mode text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mode text := coalesce(nullif(btrim(p_game_mode), ''), 'classic');
  v_existing public.leaderboard_entries%rowtype;
begin
  if p_puid is null or btrim(p_puid) = '' then raise exception 'missing puid'; end if;
  if p_score is null or p_score < 0 then raise exception 'invalid score'; end if;
  if v_mode not in ('classic', 'random_trade') then raise exception 'invalid game mode'; end if;

  perform pg_advisory_xact_lock(hashtext(p_puid || ':' || v_mode));
  select * into v_existing from public.leaderboard_entries
    where puid = p_puid and game_mode = v_mode for update;
  if found and p_score < v_existing.score then
    return jsonb_build_object('accepted', false, 'reason', 'not_personal_best', 'score', v_existing.score);
  end if;

  insert into public.leaderboard_entries (puid, game_mode, display_name, score, record, created_at, updated_at)
  values (p_puid, v_mode, left(coalesce(nullif(btrim(p_display_name), ''), '传奇球员'), 40), p_score, p_record, now(), now())
  on conflict (puid, game_mode) do update
  set display_name = excluded.display_name,
      score = excluded.score,
      record = excluded.record,
      updated_at = case when excluded.score > public.leaderboard_entries.score then now() else public.leaderboard_entries.updated_at end;
  return jsonb_build_object('accepted', true, 'score', p_score, 'gameMode', v_mode);
end;
$$;

create or replace function public.submit_legendary_leaderboard_record(
  p_puid text, p_display_name text, p_score integer, p_record jsonb
)
returns jsonb language sql security definer set search_path = public as $$
  select public.submit_legendary_leaderboard_record(p_puid, p_display_name, p_score, p_record, 'classic');
$$;

create or replace function public.get_legendary_leaderboard_rank(
  p_puid text, p_max_age integer, p_game_mode text
)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select (
    select jsonb_build_object(
      'rank', (select count(*) + 1 from public.leaderboard_entries higher
        where higher.game_mode = coalesce(nullif(btrim(p_game_mode), ''), 'classic')
          and higher.score > mine.score
          and coalesce(higher.record->>'retireAge', '') ~ '^[0-9]+$'
          and (higher.record->>'retireAge')::integer <= p_max_age),
      'displayName', mine.display_name, 'score', mine.score, 'record', mine.record,
      'updatedAt', mine.updated_at, 'gameMode', mine.game_mode
    )
    from public.leaderboard_entries mine
    where mine.puid = p_puid
      and mine.game_mode = coalesce(nullif(btrim(p_game_mode), ''), 'classic')
      and coalesce(mine.record->>'retireAge', '') ~ '^[0-9]+$'
      and (mine.record->>'retireAge')::integer <= p_max_age
    limit 1
  );
$$;

create or replace function public.get_legendary_leaderboard_rank(
  p_puid text, p_max_age integer default 43
)
returns jsonb language sql stable security definer set search_path = public as $$
  select public.get_legendary_leaderboard_rank(p_puid, p_max_age, 'classic');
$$;

grant execute on function public.submit_legendary_leaderboard_record(text, text, integer, jsonb, text) to authenticated, service_role, public;
grant execute on function public.submit_legendary_leaderboard_record(text, text, integer, jsonb) to authenticated, service_role, public;
grant execute on function public.get_legendary_leaderboard_rank(text, integer, text) to authenticated, service_role, public;
grant execute on function public.get_legendary_leaderboard_rank(text, integer) to authenticated, service_role, public;
