-- Return a public top-50 list for exactly one mode. Keeping this logic in SQL
-- prevents a combined result set from leaking records across mode tabs.
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
  select coalesce(jsonb_agg(public_row), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'id', entry.id,
      'game_mode', entry.game_mode,
      'display_name', entry.display_name,
      'score', entry.score,
      'record', entry.record,
      'updated_at', entry.updated_at
    ) as public_row
    from public.leaderboard_entries entry
    where entry.game_mode = coalesce(nullif(btrim(p_game_mode), ''), 'classic')
      and coalesce(entry.record->>'retireAge', '') ~ '^[0-9]+$'
      and (entry.record->>'retireAge')::integer <= p_max_age
    order by entry.score desc, entry.updated_at asc, entry.id asc
    limit 50
  ) ranked;
$$;

grant execute on function public.get_legendary_leaderboard(text, integer)
  to anon, authenticated, service_role, public;
