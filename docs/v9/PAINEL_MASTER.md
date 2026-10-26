# Shema V9 — arquitetura Master, Líder e Participante (laboratório)

## Níveis de permissão
| Conta | Alcance | Administração |
|---|---|---|
| **Master único** | Resumos de todos os cadastros, evolução nas 365 casas, XP, última sincronização e gráficos agregados | Aprovar e suspender líderes; administrar todos os grupos por futuras ferramentas revisadas |
| **Líder** | Somente membros que consentiram em entrar em grupos administrados por ele | Criar grupos, fornecer convites, ver estatísticas mínimas |
| **Participante** | Seus próprios dados de jornada | Entrar e sair voluntariamente de grupos; continuar a jornada |

## Identidade do master
- E-mail da conta escolhida: **shemasuporte@gmail.com**.
- **Não basta declarar o e-mail no navegador.** A função `shema_master_claim()` confirma, internamente, que o usuário conectado por Supabase Auth tem esse e-mail **confirmado** e que a vaga de master único está disponível.
- Após ativação, a autorização é vinculada **ao UUID Auth do usuário**, em `public.shema_master_accounts` (PK singleton), e não à opção de perfil nem a metadados alteráveis pelo participante.
- O master não pode ser removido ou substituído pela interface; recuperação administrativa requer processo protegido no painel Supabase.
- A função só está instalada no **laboratório**. A migração de produção requer backup, análise e autorização separada.

## Painel Master
- KPIs: usuários cadastrados, progresso na nuvem, sincronizações em 7/30 dias e casas concluídas em média.
- Gráfico de distribuição: zero, 1–30, 31–90, 91–180, 181–270, 271–365 casas.
- Listagem/busca de até 200 contas recentes, com nome de exibição, e-mail, casas concluídas, XP e última sincronização.
- Gerenciamento de solicitações de liderança feitas dentro do app, com confirmação do e-mail. Suspensão é **não destrutiva**, para não apagar grupos e membros já existentes.
- Dados de progresso são extraídos apenas pela função `shema_private.safe_metrics`; reflexões, orações e anotações não são retornadas ao Master ou aos líderes.

## Limites
- Gráficos medem **sincronização**, não prova de leitura diária; dados de quem usa o app exclusivamente offline podem estar ausentes.
- Dados anteriores da V7 não migram automaticamente para a V9, e a RC1 ainda usa a base de laboratório.
- Não há acesso ao texto de reflexões dos participantes, mesmo para Master.
- O Master poderá ver e-mails cadastrados para finalidade administrativa; a política de privacidade final deverá informar isso claramente.
- Cadastro já associado a outro projeto Auth não vale automaticamente no laboratório; é necessário registro no Auth desse ambiente.
- Falta homologação real com 2 ou mais identidades, revisão de políticas, segurança antiabuso de convites e migração formal de produção.

## Implantação
- SQL: `docs/v9/MASTER_MIGRACAO_LAB.sql` aplicado somente no Supabase de testes `ftcxatrfnuhlofpqfvtx`.
- Interface: `v9/master-dashboard.js`; script isolado na prévia.
- Teste HTTP simulado: `tests/validate_master.py`.
- GitHub: PR separado, sem merge; V7 e o Supabase de produção intactos.
