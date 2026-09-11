create table if not exists public.leaderboard_entries (
  id bigserial primary key,
  puid text not null,
  display_name text not null default '传奇球员',
  score integer not null default 0 check (score >= 0),
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists leaderboard_entries_puid_uidx
  on public.leaderboard_entries (puid);
create index if not exists leaderboard_entries_score_idx
  on public.leaderboard_entries (score desc, updated_at asc, id asc);

alter table public.leaderboard_entries disable row level security;

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
  v_cutoff public.leaderboard_entries%rowtype;
  v_total integer;
begin
  if p_puid is null or btrim(p_puid) = '' then
    raise exception 'missing puid';
  end if;
  if p_score is null or p_score < 0 then
    raise exception 'invalid score';
  end if;

  -- Serialize qualification and pruning so concurrent retirements cannot leave
  -- more than 50 rows or evict an earlier equal-score entry.
  perform pg_advisory_xact_lock(hashtext('legendary_leaderboard_top_fifty'));

  select * into v_existing
  from public.leaderboard_entries
  where puid = p_puid
  for update;

  if found then
    if p_score < v_existing.score then
      return jsonb_build_object(
        'accepted', false,
        'reason', 'not_personal_best',
        'score', v_existing.score
      );
    end if;

    update public.leaderboard_entries
    set display_name = left(coalesce(nullif(btrim(p_display_name), ''), '传奇球员'), 40),
        score = p_score,
        record = p_record,
        updated_at = case when p_score > v_existing.score then now() else v_existing.updated_at end
    where id = v_existing.id;

    return jsonb_build_object('accepted', true, 'score', p_score);
  end if;

  select count(*)::integer into v_total from public.leaderboard_entries;
  if v_total >= 50 then
    select * into v_cutoff
    from public.leaderboard_entries
    order by score desc, updated_at asc, id asc
    offset 49 limit 1
    for update;

    if v_cutoff.id is not null and p_score <= v_cutoff.score then
      return jsonb_build_object(
        'accepted', false,
        'reason', 'below_top_50',
        'cutoffScore', v_cutoff.score
      );
    end if;
  end if;

  insert into public.leaderboard_entries (puid, display_name, score, record)
  values (
    p_puid,
    left(coalesce(nullif(btrim(p_display_name), ''), '传奇球员'), 40),
    p_score,
    p_record
  );

  delete from public.leaderboard_entries
  where id in (
    select id
    from public.leaderboard_entries
    order by score desc, updated_at asc, id asc
    offset 50
  );

  return jsonb_build_object('accepted', true, 'score', p_score);
end;
$$;

grant usage on schema public to anon, authenticated, service_role, public;
grant select on public.leaderboard_entries to anon, authenticated, service_role, public;
grant insert, update, delete on public.leaderboard_entries to authenticated, service_role, public;
grant usage, select on sequence public.leaderboard_entries_id_seq to authenticated, service_role, public;
grant execute on function public.submit_legendary_leaderboard_record(text, text, integer, jsonb)
  to authenticated, service_role, public;
