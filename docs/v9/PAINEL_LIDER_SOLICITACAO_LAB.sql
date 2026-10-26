-- Ambiente Shema V9 laboratório: solicitação de acesso de liderança autenticada.
BEGIN;
CREATE TABLE IF NOT EXISTS public.shema_leader_requests (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 requested_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shema_leader_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shema_leader_requests FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.shema_request_leadership()
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE who uuid:=auth.uid();
BEGIN
 IF who IS NULL THEN RAISE EXCEPTION 'Entre na sua conta' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.shema_leader_accounts WHERE user_id=who) THEN
  RETURN pg_catalog.jsonb_build_object('status','approved');
 END IF;
 INSERT INTO public.shema_leader_requests(user_id) VALUES(who) ON CONFLICT(user_id) DO NOTHING;
 RETURN pg_catalog.jsonb_build_object('status','pending');
END $fn$;
REVOKE ALL ON FUNCTION public.shema_request_leadership() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.shema_request_leadership() TO authenticated;
COMMIT;
-- Autorize apenas após a pessoa solicitar dentro do app e confirmar o pedido.
-- Após localizar request específico: INSERT ... SELECT user_id FROM requests...