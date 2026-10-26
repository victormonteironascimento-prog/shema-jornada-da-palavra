-- Shema V9 — migração de lançamento (NÃO APLICAR SEM BACKUP E AUTORIZAÇÃO DE PUBLICAÇÃO)
-- Banco de PRODUÇÃO: ghzvomquldrqpsosvbig
-- Não exclui nem altera progress_data de usuário algum.
BEGIN;
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS revision bigint NOT NULL DEFAULT 0;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='user_progress_revision_nonnegative' AND conrelid='public.user_progress'::regclass) THEN
    ALTER TABLE public.user_progress ADD CONSTRAINT user_progress_revision_nonnegative CHECK (revision >= 0);
  END IF;
END $$;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.user_progress FROM anon;
REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.user_progress FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_progress TO authenticated;
COMMIT;
-- Não criar novas políticas amplas: as políticas existentes de SELECT, INSERT e UPDATE já
-- restringem user_id = auth.uid(). Conferi as regras no ambiente de produção.
-- Rollback do FRONTEND: republicar a versão anterior. Manter coluna revision (aditiva).
