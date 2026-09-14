-- A historical career can be re-synced under a different account identifier.
-- Keep all stored rows, but count and return each career id only once.
create or replace function public.get_legendary_leaderboard(
  p_game_mode text,
  p_max_age integer default 43
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with eligible as (
    select
      entry.*,
      row_number() over (
        partition by coalesce(nullif(btrim(entry.record->>'id'), ''), 'entry:' || entry.id::text)
        order by entry.score desc, entry.updated_at asc, entry.id asc
      ) as career_row
    from public.leaderboard_entries entry
    where entry.game_mode = coalesce(nullif(btrim(p_game_mode), ''), 'classic')
      and coalesce(entry.record->>'retireAge', '') ~ '^[0-9]+$'
      and (entry.record->>'retireAge')::integer <= p_max_age
  ), top_careers as (
    select *
    from eligible
    where career_row = 1
    order by score desc, updated_at asc, id asc
    limit 50
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', entry.id,
        'game_mode', entry.game_mode,
        'display_name', entry.display_name,
        'score', entry.score,
        'record', entry.record,
        'updated_at', entry.updated_at
      ) order by entry.score desc, entry.updated_at asc, entry.id asc
    ),
    '[]'::jsonb
  )
  from top_careers entry;
$$;

create or replace function public.get_legendary_leaderboard_rank(
  p_puid text, p_max_age integer, p_game_mode text
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with mine as (
    select entry.*
    from public.leaderboard_entries entry
    where entry.puid = p_puid
      and entry.game_mode = coalesce(nullif(btrim(p_game_mode), ''), 'classic')
      and coalesce(entry.record->>'retireAge', '') ~ '^[0-9]+$'
      and (entry.record->>'retireAge')::integer <= p_max_age
    limit 1
  ), eligible as (
    select
      entry.*,
      row_number() over (
        partition by coalesce(nullif(btrim(entry.record->>'id'), ''), 'entry:' || entry.id::text)
        order by entry.score desc, entry.updated_at asc, entry.id asc
      ) as career_row
    from public.leaderboard_entries entry
    where entry.game_mode = coalesce(nullif(btrim(p_game_mode), ''), 'classic')
      and coalesce(entry.record->>'retireAge', '') ~ '^[0-9]+$'
      and (entry.record->>'retireAge')::integer <= p_max_age
  )
  select (
    select jsonb_build_object(
      'rank', (select count(*) + 1 from eligible higher where higher.career_row = 1 and higher.score > mine.score),
      'displayName', mine.display_name,
      'score', mine.score,
      'record', mine.record,
      'updatedAt', mine.updated_at,
      'gameMode', mine.game_mode
    )
    from mine
  );
$$;

create or replace function public.get_legendary_leaderboard_rank(
  p_puid text, p_max_age integer default 43
)
returns jsonb language sql stable security definer set search_path = public as $$
  select public.get_legendary_leaderboard_rank(p_puid, p_max_age, 'classic');
$$;

grant execute on function public.get_legendary_leaderboard(text, integer)
  to anon, authenticated, service_role, public;
grant execute on function public.get_legendary_leaderboard_rank(text, integer, text)
  to authenticated, service_role, public;
grant execute on function public.get_legendary_leaderboard_rank(text, integer)
  to authenticated, service_role, public;
