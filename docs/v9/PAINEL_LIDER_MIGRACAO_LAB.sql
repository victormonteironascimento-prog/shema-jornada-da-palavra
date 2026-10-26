-- Shema V9: sistema de grupos em laboratorio SOMENTE. Nunca aplicar direto em producao.
BEGIN;
CREATE SCHEMA IF NOT EXISTS shema_private;
REVOKE ALL ON SCHEMA shema_private FROM PUBLIC,anon,authenticated;
CREATE TABLE IF NOT EXISTS public.shema_leader_accounts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  approved_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.shema_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id uuid NOT NULL REFERENCES public.shema_leader_accounts(user_id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 80),
  invite_code text UNIQUE NOT NULL CHECK (invite_code ~ '^[A-F0-9]{20}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shema_groups_leader_idx ON public.shema_groups(leader_id);
CREATE TABLE IF NOT EXISTS public.shema_group_memberships (
  group_id uuid NOT NULL REFERENCES public.shema_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 60),
  consented_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id,user_id)
);
CREATE INDEX IF NOT EXISTS shema_memberships_user_idx ON public.shema_group_memberships(user_id);
ALTER TABLE public.shema_leader_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shema_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shema_group_memberships ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.shema_leader_accounts,public.shema_groups,public.shema_group_memberships FROM PUBLIC,anon,authenticated;
-- Raw progress_data stays protected by its existing per-user RLS.
CREATE OR REPLACE FUNCTION shema_private.safe_metrics(p_progress jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=''
AS $fn$
DECLARE raw text; arr jsonb; n integer:=0; pts integer:=0;
BEGIN
 raw:=p_progress #>> '{values,shemaPlayable}';
 IF raw IS NOT NULL AND char_length(raw)<=5000 THEN
  arr:=raw::jsonb;
  IF pg_catalog.jsonb_typeof(arr)='array' AND pg_catalog.jsonb_array_length(arr)<=365 THEN
   SELECT pg_catalog.count(*)::integer INTO n FROM pg_catalog.jsonb_array_elements(arr) AS item(v) WHERE item.v='true'::jsonb;
  END IF;
 END IF;
 raw:=p_progress #>> '{values,shemaXP}';
 IF raw ~ '^[0-9]{1,8}$' THEN pts:=LEAST(raw::integer,99999999); END IF;
 RETURN pg_catalog.jsonb_build_object('houses',n,'xp',pts);
EXCEPTION WHEN OTHERS THEN RETURN pg_catalog.jsonb_build_object('houses',0,'xp',0);
END $fn$;
REVOKE ALL ON FUNCTION shema_private.safe_metrics(jsonb) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.shema_group_state()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE who uuid:=auth.uid(); lead jsonb; joined jsonb; approved boolean;
BEGIN
 IF who IS NULL THEN RAISE EXCEPTION 'Faça login' USING ERRCODE='42501'; END IF;
 SELECT EXISTS(SELECT 1 FROM public.shema_leader_accounts WHERE user_id=who) INTO approved;
 SELECT COALESCE(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id',id,'title',title,'code',invite_code)),'[]'::jsonb)
 INTO lead FROM public.shema_groups WHERE leader_id=who;
 SELECT COALESCE(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id',g.id,'title',g.title,'name',m.display_name)),'[]'::jsonb)
 INTO joined FROM public.shema_group_memberships m JOIN public.shema_groups g ON g.id=m.group_id WHERE m.user_id=who;
 RETURN pg_catalog.jsonb_build_object('isLeader',approved,'leading',lead,'joined',joined);
END $fn$;
CREATE OR REPLACE FUNCTION public.shema_group_create(p_title text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE who uuid:=auth.uid(); g public.shema_groups%ROWTYPE;
BEGIN
 IF who IS NULL OR NOT EXISTS(SELECT 1 FROM public.shema_leader_accounts WHERE user_id=who) THEN
  RAISE EXCEPTION 'Conta não autorizada como líder' USING ERRCODE='42501'; END IF;
 p_title:=pg_catalog.btrim(p_title);
 IF p_title IS NULL OR char_length(p_title) NOT BETWEEN 3 AND 80 THEN RAISE EXCEPTION 'Nome inválido' USING ERRCODE='22023'; END IF;
 IF (SELECT count(*) FROM public.shema_groups WHERE leader_id=who)>=20 THEN RAISE EXCEPTION 'Limite de grupos' USING ERRCODE='22023'; END IF;
 INSERT INTO public.shema_groups(leader_id,title,invite_code)
 VALUES(who,p_title,upper(substr(replace(gen_random_uuid()::text,'-',''),1,20))) RETURNING * INTO g;
 RETURN pg_catalog.jsonb_build_object('id',g.id,'title',g.title,'code',g.invite_code);
END $fn$;
CREATE OR REPLACE FUNCTION public.shema_group_join(p_code text,p_display_name text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE who uuid:=auth.uid(); g public.shema_groups%ROWTYPE;
BEGIN
 IF who IS NULL THEN RAISE EXCEPTION 'Faça login' USING ERRCODE='42501'; END IF;
 p_code:=upper(pg_catalog.btrim(p_code));p_display_name:=pg_catalog.btrim(p_display_name);
 IF p_code IS NULL OR p_code !~ '^[A-F0-9]{20}$' THEN RAISE EXCEPTION 'Convite inválido' USING ERRCODE='22023'; END IF;
 IF p_display_name IS NULL OR char_length(p_display_name) NOT BETWEEN 2 AND 60 THEN RAISE EXCEPTION 'Nome inválido' USING ERRCODE='22023'; END IF;
 SELECT * INTO g FROM public.shema_groups WHERE invite_code=p_code;
 IF NOT FOUND THEN RAISE EXCEPTION 'Grupo não encontrado' USING ERRCODE='22023'; END IF;
 IF g.leader_id=who THEN RAISE EXCEPTION 'Você administra este grupo' USING ERRCODE='22023'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.shema_group_memberships WHERE user_id=who AND group_id=g.id)
 AND (SELECT count(*) FROM public.shema_group_memberships WHERE group_id=g.id)>=200 THEN
  RAISE EXCEPTION 'Limite de participantes' USING ERRCODE='22023'; END IF;
 INSERT INTO public.shema_group_memberships(group_id,user_id,display_name) VALUES(g.id,who,p_display_name)
 ON CONFLICT(group_id,user_id) DO UPDATE SET display_name=EXCLUDED.display_name;
 RETURN pg_catalog.jsonb_build_object('id',g.id,'title',g.title);
END $fn$;
CREATE OR REPLACE FUNCTION public.shema_group_leave(p_group_id uuid)
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE who uuid:=auth.uid(); deleted integer;
BEGIN
 IF who IS NULL THEN RAISE EXCEPTION 'Faça login' USING ERRCODE='42501'; END IF;
 DELETE FROM public.shema_group_memberships WHERE group_id=p_group_id AND user_id=who;
 GET DIAGNOSTICS deleted=ROW_COUNT;
 RETURN deleted>0;
END $fn$;
CREATE OR REPLACE FUNCTION public.shema_group_overview(p_group_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE who uuid:=auth.uid(); g public.shema_groups%ROWTYPE; participants jsonb; members_n integer; active7 integer; active30 integer; avg_houses numeric;
BEGIN
 IF who IS NULL THEN RAISE EXCEPTION 'Faça login' USING ERRCODE='42501'; END IF;
 SELECT * INTO g FROM public.shema_groups WHERE id=p_group_id AND leader_id=who;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.shema_leader_accounts WHERE user_id=who) THEN
  RAISE EXCEPTION 'Acesso negado ao grupo' USING ERRCODE='42501'; END IF;
 SELECT COALESCE(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
  'name',m.display_name,
  'houses',COALESCE((shema_private.safe_metrics(p.progress_data)->>'houses')::integer,0),
  'xp',COALESCE((shema_private.safe_metrics(p.progress_data)->>'xp')::integer,0),
  'syncedAt',p.updated_at) ORDER BY m.consented_at),'[]'::jsonb),
  count(*)::integer,count(*) FILTER(WHERE p.updated_at>=now()-interval '7 days')::integer,
  count(*) FILTER(WHERE p.updated_at>=now()-interval '30 days')::integer,
  COALESCE(round(avg((shema_private.safe_metrics(p.progress_data)->>'houses')::numeric),1),0)
 INTO participants,members_n,active7,active30,avg_houses
 FROM public.shema_group_memberships m LEFT JOIN public.user_progress p ON p.user_id=m.user_id
 WHERE m.group_id=g.id;
 RETURN pg_catalog.jsonb_build_object('id',g.id,'title',g.title,'members',participants,
  'memberCount',members_n,'synced7',active7,'synced30',active30,'averageHouses',avg_houses);
END $fn$;
REVOKE ALL ON FUNCTION public.shema_group_state() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.shema_group_create(text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.shema_group_join(text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.shema_group_leave(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.shema_group_overview(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.shema_group_state(),public.shema_group_create(text),public.shema_group_join(text,text),public.shema_group_leave(uuid),public.shema_group_overview(uuid) TO authenticated;
COMMIT;
-- Aprovar lider somente apos confirmar identidade UUID pelo Supabase Auth:
-- INSERT INTO public.shema_leader_accounts(user_id) VALUES ('UUID_VERIFICADO');