# Painel do Líder — V9 (laboratório)

## O que já funciona

- Área “Grupos e acompanhamento” na tela Perfil.
- O participante entra voluntariamente por código e pode sair a qualquer momento.
- Líder autorizado cria grupos e consulta, por participante, **nome de exibição, casas concluídas, XP e data da última sincronização**.
- Indicadores: número de membros, sincronizações nos últimos 7 e 30 dias, média de casas concluídas.
- Os dados são obtidos da última cópia na nuvem. Ausência de sincronização **não comprova** ausência de estudo.

## Segurança

- O banco guarda a lista de líderes em `public.shema_leader_accounts`. O cliente **não** pode adicionar líderes; um administrador autentica e libera a conta separadamente.
- Nenhum dos três novos objetos de tabela concede `SELECT`, `INSERT`, `UPDATE` ou `DELETE` a usuários anônimos ou autenticados.
- As funções RPC públicas usam `SECURITY DEFINER`, `search_path=''`, validação explícita de `auth.uid()` e `EXECUTE` exclusivamente para `authenticated`. **São endpoints privilegiados, exigem revisão antes da produção.**
- A RPC de estatísticas retorna **somente os quatro campos mínimos por participante**. Não retorna `progress_data`, reflexões, orações, anotações nem e-mail.
- O convite possui 80 bits gerados aleatoriamente; não dá acesso sem autenticação. Participante só aparece após consentir e entrar.

## Situação de implantação

- `docs/v9/PAINEL_LIDER_MIGRACAO_LAB.sql` foi aplicada **apenas** no Supabase de laboratório `ftcxatrfnuhlofpqfvtx`.
- Produção `ghzvomquldrqpsosvbig` **não** foi alterada.
- Líderes aprovados no laboratório: nenhum; precisa ser autorizada a identidade correta antes do primeiro teste com conta real.
- A V7 em `main` e a RC1 em `release/shema-v9-rc1` foram preservadas.

## Habilitar líder de teste (ação administrativa; não executar em produção)

1. Confirmar o usuário de laboratório por identidade verificada no Supabase Auth.
2. Como administrador autorizado, inserir o **UUID verificado** na tabela `public.shema_leader_accounts`.
3. Entrar no Shema de laboratório; em Perfil > Grupos e acompanhamento criar grupo e copiar convite.
4. Com **outra conta de testes** voluntária, entrar pelo convite; sincronizar uma casa; conferir painel.
5. Testar: outro usuário não consulta grupo alheio; sair remove o membro; notas e reflexões nunca são retornadas; não há vazamento via RLS. 

## Pendências para a produção

Revisão de privacidade/consentimento, proteção antiabuso para criação/convite, expiração/rotação de convites, testes reais multiusuário e publicação de métricas somente após o backend de produção e RLS serem homologados. A política de privacidade deverá mencionar o compartilhamento voluntário de estatísticas agregadas com líderes, antes de habilitar a função para participantes reais.
