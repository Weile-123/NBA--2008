-- Retain one personal-best record for every player. The public list still
-- reads only the top 50; /leaderboard/me calculates ranks with COUNT + 1.
create or replace function public.submit_legendary_leaderboard_record(
  p_puid text,
  p_display_name text,
  p_score integer,
  p_record jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.leaderboard_entries%rowtype;
begin
  if p_puid is null or btrim(p_puid) = '' then
    raise exception 'missing puid';
  end if;
  if p_score is null or p_score < 0 then
    raise exception 'invalid score';
  end if;

  -- Serialize submissions for this player without locking the whole board.
  perform pg_advisory_xact_lock(hashtext(p_puid));

  select * into v_existing
  from public.leaderboard_entries
  where puid = p_puid
  for update;

  if found and p_score < v_existing.score then
    return jsonb_build_object(
      'accepted', false,
      'reason', 'not_personal_best',
      'score', v_existing.score
    );
  end if;

  insert into public.leaderboard_entries (puid, display_name, score, record, created_at, updated_at)
  values (
    p_puid,
    left(coalesce(nullif(btrim(p_display_name), ''), '传奇球员'), 40),
    p_score,
    p_record,
    now(),
    now()
  )
  on conflict (puid) do update
  set display_name = excluded.display_name,
      score = excluded.score,
      record = excluded.record,
      updated_at = case
        when excluded.score > public.leaderboard_entries.score then now()
        else public.leaderboard_entries.updated_at
      end;

  return jsonb_build_object('accepted', true, 'score', p_score);
end;
$$;

grant execute on function public.submit_legendary_leaderboard_record(text, text, integer, jsonb)
  to authenticated, service_role, public;
