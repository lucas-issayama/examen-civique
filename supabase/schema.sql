-- ============================================================================
--  Examen Civique — statistiques globales anonymes
-- ----------------------------------------------------------------------------
--  À exécuter dans Supabase : SQL Editor → coller → Run.
--
--  Principe : on n'enregistre AUCUNE donnée personnelle, seulement des
--  compteurs agrégés par question (nombre de tentatives / nombre d'erreurs).
--  Les clients anonymes ne peuvent PAS écrire directement dans la table ;
--  ils incrémentent uniquement via la fonction `record_answers`
--  (SECURITY DEFINER), ce qui empêche l'écriture arbitraire de lignes.
-- ============================================================================

-- 1) Table agrégée (une ligne par question) -------------------------------------
create table if not exists public.question_stats (
  question_id integer primary key,
  attempts    bigint      not null default 0,
  wrong       bigint      not null default 0,
  updated_at  timestamptz not null default now()
);

alter table public.question_stats enable row level security;

-- Lecture publique (pour afficher le classement des questions difficiles)
drop policy if exists "question_stats lecture publique" on public.question_stats;
create policy "question_stats lecture publique"
  on public.question_stats
  for select
  to anon, authenticated
  using (true);

-- NB : aucune policy d'INSERT/UPDATE pour anon → écriture impossible en direct.
--      L'écriture passe exclusivement par la fonction SECURITY DEFINER ci-dessous.

-- 2) Fonction d'enregistrement par lot -------------------------------------------
--    p_answers : tableau JSON [{ "id": 12, "wrong": true }, ...]
create or replace function public.record_answers(p_answers jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
begin
  if p_answers is null or jsonb_typeof(p_answers) <> 'array' then
    return;
  end if;

  for rec in
    select (e->>'id')::int as qid,
           coalesce((e->>'wrong')::boolean, false) as wrong
    from jsonb_array_elements(p_answers) e
  loop
    -- garde-fou : ignorer les identifiants hors d'une plage raisonnable
    if rec.qid is null or rec.qid < 1 or rec.qid > 100000 then
      continue;
    end if;

    insert into public.question_stats (question_id, attempts, wrong)
    values (rec.qid, 1, case when rec.wrong then 1 else 0 end)
    on conflict (question_id) do update
      set attempts   = question_stats.attempts + 1,
          wrong      = question_stats.wrong + (case when rec.wrong then 1 else 0 end),
          updated_at = now();
  end loop;
end;
$$;

-- Autoriser les visiteurs (clé anon) à appeler la fonction
grant execute on function public.record_answers(jsonb) to anon, authenticated;
