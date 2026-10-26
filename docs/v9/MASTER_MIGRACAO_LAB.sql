-- Shema V9 Master — somente laboratório na primeira etapa.
-- A conta autorizada é verificada pelo Supabase Auth com e-mail confirmado.
-- O vínculo de administrador é o auth.uid() persistido; não depende de metadata editável pelo cliente.
BEGIN;
CREATE TABLE IF NOT EXISTS public.shema_master_accounts (
 slot smallint PRIMARY KEY DEFAULT 1 CHECK (slot=1),
 user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shema_master_accounts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.shema_master_accounts FROM PUBLIC,anon,authenticated;
ALTER TABLE public.shema_leader_accounts ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true;
-- Revogação de líderes é não-destrutiva: grupos, convites e associações permanecem.
CREATE OR REPLACE FUNCTION public.shema_group_state()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE who uuid:=auth.uid(); lead jsonb; joined jsonb; approved boolean;
BEGIN
 IF who IS NULL THEN RAISE EXCEPTION 'Faça login' USING ERRCODE='42501'; END IF;
 SELECT EXISTS(SELECT 1 FROM public.shema_leader_accounts WHERE user_id=who AND enabled=true) INTO approved;
 SELECT COALESCE(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id',id,'title',title,'code',invite_code)),'[]'::jsonb)
 INTO lead FROM public.shema_groups WHERE leader_id=who AND approved;
 SELECT COALESCE(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id',g.id,'title',g.title,'name',m.display_name)),'[]'::jsonb)
 INTO joined FROM public.shema_group_memberships m JOIN public.shema_groups g ON g.id=m.group_id WHERE m.user_id=who;
 RETURN pg_catalog.jsonb_build_object('isLeader',approved,'leading',lead,'joined',joined);
END $fn$;
CREATE OR REPLACE FUNCTION public.shema_group_create(p_title text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE who uuid:=auth.uid(); g public.shema_groups%ROWTYPE;
BEGIN
 IF who IS NULL OR NOT EXISTS(SELECT 1 FROM public.shema_leader_accounts WHERE user_id=who AND enabled=true) THEN
  RAISE EXCEPTION 'Conta não autorizada como líder' USING ERRCODE='42501'; END IF;
 p_title:=pg_catalog.btrim(p_title);
 IF p_title IS NULL OR char_length(p_title) NOT BETWEEN 3 AND 80 THEN RAISE EXCEPTION 'Nome inválido' USING ERRCODE='22023'; END IF;
 IF (SELECT count(*) FROM public.shema_groups WHERE leader_id=who)>=20 THEN RAISE EXCEPTION 'Limite de grupos' USING ERRCODE='22023'; END IF;
 INSERT INTO public.shema_groups(leader_id,title,invite_code)
 VALUES(who,p_title,upper(substr(replace(gen_random_uuid()::text,'-',''),1,20))) RETURNING * INTO g;
 RETURN pg_catalog.jsonb_build_object('id',g.id,'title',g.title,'code',g.invite_code);
END $fn$;
CREATE OR REPLACE FUNCTION public.shema_group_overview(p_group_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE who uuid:=auth.uid(); g public.shema_groups%ROWTYPE; participants jsonb; members_n integer; active7 integer; active30 integer; avg_houses numeric;
BEGIN
 IF who IS NULL THEN RAISE EXCEPTION 'Faça login' USING ERRCODE='42501'; END IF;
 SELECT * INTO g FROM public.shema_groups WHERE id=p_group_id AND leader_id=who;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.shema_leader_accounts WHERE user_id=who AND enabled=true) THEN
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

CREATE OR REPLACE FUNCTION public.shema_admin_me()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE who uuid:=auth.uid(); master_now boolean; can_claim boolean;
BEGIN
 IF who IS NULL THEN RAISE EXCEPTION 'Entre na sua conta' USING ERRCODE='42501'; END IF;
 SELECT EXISTS(SELECT 1 FROM public.shema_master_accounts WHERE user_id=who) INTO master_now;
 SELECT (NOT EXISTS(SELECT 1 FROM public.shema_master_accounts))
  AND EXISTS(SELECT 1 FROM auth.users WHERE id=who AND lower(email)=lower('shemasuporte@gmail.com')
             AND email_confirmed_at IS NOT NULL) INTO can_claim;
 RETURN jsonb_build_object('isMaster',master_now,'canClaim',can_claim);
END $fn$;

CREATE OR REPLACE FUNCTION public.shema_master_claim()
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE who uuid:=auth.uid(); actual uuid;
BEGIN
 IF who IS NULL THEN RAISE EXCEPTION 'Entre na sua conta' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=who
                 AND lower(email)=lower('shemasuporte@gmail.com')
                 AND email_confirmed_at IS NOT NULL) THEN
  RAISE EXCEPTION 'Esta conta não está autorizada como master ou o e-mail não foi confirmado'
   USING ERRCODE='42501';
 END IF;
 INSERT INTO public.shema_master_accounts(slot,user_id)
 VALUES(1,who) ON CONFLICT(slot) DO NOTHING;
 SELECT user_id INTO actual FROM public.shema_master_accounts WHERE slot=1;
 IF actual IS DISTINCT FROM who THEN RAISE EXCEPTION 'Master já designado' USING ERRCODE='42501'; END IF;
 INSERT INTO public.shema_leader_accounts(user_id,enabled) VALUES(who,true)
 ON CONFLICT(user_id) DO UPDATE SET enabled=true;
 RETURN jsonb_build_object('isMaster',true);
END $fn$;

CREATE OR REPLACE FUNCTION public.shema_master_overview()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE who uuid:=auth.uid(); users jsonb; total_n int; has_progress int; last7 int; last30 int;
    avg_h numeric; dist jsonb;
BEGIN
 IF who IS NULL OR NOT EXISTS(SELECT 1 FROM public.shema_master_accounts WHERE user_id=who)
 THEN RAISE EXCEPTION 'Acesso restrito ao administrador master' USING ERRCODE='42501'; END IF;
 WITH rows AS (
   SELECT a.id,a.email,a.created_at,p.updated_at,
      COALESCE((shema_private.safe_metrics(p.progress_data)->>'houses')::int,0) AS houses,
      COALESCE((shema_private.safe_metrics(p.progress_data)->>'xp')::int,0) AS xp,
      LEFT(COALESCE(NULLIF(btrim(p.progress_data #>> '{values,shemaName}'),''),split_part(a.email,'@',1),'Participante'),60) AS display_name
   FROM auth.users a LEFT JOIN public.user_progress p ON p.user_id=a.id
 )
 SELECT count(*)::int,count(*) FILTER(WHERE updated_at IS NOT NULL)::int,
        count(*) FILTER(WHERE updated_at >= now()-interval '7 days')::int,
        count(*) FILTER(WHERE updated_at >= now()-interval '30 days')::int,
        COALESCE(round(avg(houses)::numeric,1),0)
 INTO total_n,has_progress,last7,last30,avg_h FROM rows;
 WITH rows AS (
  SELECT COALESCE((shema_private.safe_metrics(p.progress_data)->>'houses')::int,0) AS h
  FROM auth.users a LEFT JOIN public.user_progress p ON p.user_id=a.id
 )
 SELECT jsonb_build_array(
   count(*) FILTER(WHERE h=0),
   count(*) FILTER(WHERE h BETWEEN 1 AND 30),
   count(*) FILTER(WHERE h BETWEEN 31 AND 90),
   count(*) FILTER(WHERE h BETWEEN 91 AND 180),
   count(*) FILTER(WHERE h BETWEEN 181 AND 270),
   count(*) FILTER(WHERE h BETWEEN 271 AND 365)
 ) INTO dist FROM rows;
 SELECT COALESCE(jsonb_agg(jsonb_build_object(
     'id',r.id,'name',r.display_name,'email',r.email,
     'houses',r.houses,'xp',r.xp,'syncedAt',r.updated_at,'registeredAt',r.created_at)
   ORDER BY r.updated_at DESC NULLS LAST,r.created_at DESC),'[]'::jsonb)
 INTO users
 FROM (
  SELECT a.id,a.email,a.created_at,p.updated_at,
    COALESCE((shema_private.safe_metrics(p.progress_data)->>'houses')::int,0) AS houses,
    COALESCE((shema_private.safe_metrics(p.progress_data)->>'xp')::int,0) AS xp,
    LEFT(COALESCE(NULLIF(btrim(p.progress_data #>> '{values,shemaName}'),''),split_part(a.email,'@',1),'Participante'),60) AS display_name
  FROM auth.users a LEFT JOIN public.user_progress p ON p.user_id=a.id
  ORDER BY p.updated_at DESC NULLS LAST,a.created_at DESC LIMIT 200
 ) r;
 RETURN jsonb_build_object('total',total_n,'withProgress',has_progress,'synced7',last7,
    'synced30',last30,'averageHouses',avg_h,'distribution',dist,'users',users,
    'listLimit',200);
END $fn$;

CREATE OR REPLACE FUNCTION public.shema_master_leaders()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE who uuid:=auth.uid(); leaders jsonb; pending jsonb;
BEGIN
 IF who IS NULL OR NOT EXISTS(SELECT 1 FROM public.shema_master_accounts WHERE user_id=who)
 THEN RAISE EXCEPTION 'Acesso restrito ao administrador master' USING ERRCODE='42501'; END IF;
 SELECT COALESCE(jsonb_agg(jsonb_build_object(
     'id',a.id,'email',a.email,'enabled',l.enabled,'isMaster',EXISTS(
      SELECT 1 FROM public.shema_master_accounts ma WHERE ma.user_id=a.id))), '[]'::jsonb)
 INTO leaders
 FROM public.shema_leader_accounts l JOIN auth.users a ON a.id=l.user_id;
 SELECT COALESCE(jsonb_agg(jsonb_build_object(
  'id',a.id,'email',a.email,'verified',a.email_confirmed_at IS NOT NULL,
  'requestedAt',r.requested_at) ORDER BY r.requested_at DESC),'[]'::jsonb)
 INTO pending FROM public.shema_leader_requests r JOIN auth.users a ON a.id=r.user_id
 WHERE NOT EXISTS(SELECT 1 FROM public.shema_leader_accounts l WHERE l.user_id=r.user_id AND l.enabled);
 RETURN jsonb_build_object('leaders',leaders,'requests',pending);
END $fn$;

CREATE OR REPLACE FUNCTION public.shema_master_set_leader(p_user_id uuid,p_enabled boolean)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE who uuid:=auth.uid(); found_user boolean;
BEGIN
 IF who IS NULL OR NOT EXISTS(SELECT 1 FROM public.shema_master_accounts WHERE user_id=who)
 THEN RAISE EXCEPTION 'Acesso restrito ao administrador master' USING ERRCODE='42501'; END IF;
 IF p_enabled IS NULL OR p_user_id IS NULL OR p_user_id=who
 OR EXISTS(SELECT 1 FROM public.shema_master_accounts WHERE user_id=p_user_id)
 THEN RAISE EXCEPTION 'Operação de permissão inválida' USING ERRCODE='42501'; END IF;
 IF p_enabled THEN
  SELECT EXISTS(SELECT 1 FROM public.shema_leader_requests r JOIN auth.users a
                 ON a.id=r.user_id WHERE r.user_id=p_user_id AND a.email_confirmed_at IS NOT NULL)
  INTO found_user;
  IF NOT found_user THEN
   RAISE EXCEPTION 'A conta precisa solicitar liderança e confirmar o e-mail'
   USING ERRCODE='42501'; END IF;
  INSERT INTO public.shema_leader_accounts(user_id,enabled) VALUES(p_user_id,true)
  ON CONFLICT(user_id) DO UPDATE SET enabled=true;
 ELSE
  UPDATE public.shema_leader_accounts SET enabled=false WHERE user_id=p_user_id;
 END IF;
 RETURN jsonb_build_object('id',p_user_id,'enabled',p_enabled);
END $fn$;

REVOKE ALL ON FUNCTION public.shema_admin_me() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.shema_master_claim() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.shema_master_overview() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.shema_master_leaders() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.shema_master_set_leader(uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.shema_admin_me(),public.shema_master_claim(),
 public.shema_master_overview(),public.shema_master_leaders(),
 public.shema_master_set_leader(uuid,boolean) TO authenticated;
COMMIT;
