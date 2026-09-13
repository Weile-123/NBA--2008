-- Calculate one player's rank inside PostgreSQL so the result is not capped by
-- the REST client's per-request row limit.
create or replace function public.get_legendary_leaderboard_rank(
  p_puid text,
  p_max_age integer default 43
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select (
    select jsonb_build_object(
      'rank', (
        select count(*) + 1
        from public.leaderboard_entries higher
        where higher.score > mine.score
          and coalesce(higher.record->>'retireAge', '') ~ '^[0-9]+$'
          and (higher.record->>'retireAge')::integer <= p_max_age
      ),
      'displayName', mine.display_name,
      'score', mine.score,
      'record', mine.record,
      'updatedAt', mine.updated_at
    )
    from public.leaderboard_entries mine
    where mine.puid = p_puid
      and coalesce(mine.record->>'retireAge', '') ~ '^[0-9]+$'
      and (mine.record->>'retireAge')::integer <= p_max_age
    limit 1
  );
$$;

grant execute on function public.get_legendary_leaderboard_rank(text, integer)
  to authenticated, service_role, public;
