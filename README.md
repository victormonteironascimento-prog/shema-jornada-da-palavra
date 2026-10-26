# Shema — Jornada da Palavra

A V7 permanece em `index.html`, sem alteração. A candidata V9 RC1 está em
`v9/index.html` e não substitui o aplicativo oficial.

Para revisar localmente, sirva a raiz como arquivos estáticos e abra `/v9/`.
A V9 usa namespace local próprio e o endpoint de testes fornecido no pacote;
não transfere automaticamente o progresso da V7. Faça backup antes de uma futura
migração. Nenhum comando de banco ou deploy faz parte desta integração.

- [Relatório independente de validação](docs/v9/VALIDACAO_RC1.md)
- Testes: `python tests/validate_v9.py` (Python, Node, Playwright 1.62.0 e Chromium
  instalado pelo Playwright; use `CHROMIUM_PATH=/usr/bin/chromium` para o navegador
  do sistema). Execute também `tests/validate_config.py` e `tests/validate_pwa.py`.
  A PWA usa apenas servidor local e service worker real; serviços externos são bloqueados.
- `docs/v9/MIGRACAO_PRODUCAO_REVISAO_E_PERMISSOES.sql` é material recebido para
  revisão futura, não uma migração aplicada. Os comentários sobre estado do banco
  pertencem ao pacote e não foram confirmados nesta integração.
- A minuta de privacidade recebida requer dados válidos do responsável antes
  de uso público.

Não publicar a V9 nem executar SQL contra produção sem homologação separada.

- [Configuração separada de produção e pendências humanas](docs/v9/CONFIGURACAO_PRODUCAO.md).
- CI: `.github/workflows/v9-validation.yml` executa as três suítes, sem deploy ou acesso a banco.
