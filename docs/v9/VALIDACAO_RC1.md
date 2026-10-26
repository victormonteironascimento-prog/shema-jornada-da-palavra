# Validação independente — Shema V9 RC1

Data: 26/10/2026. Base: `main` em
`243b8b286ad2da70348f7320fb0110f28f0dbf65`.
Branch: `release/shema-v9-rc1`.

## Escopo e origem

Pacote: `Shema_V9_Para_Codex.zip`. Os 16 arquivos listados em SHA256SUMS
conferiram. Integração da versão `previsualizacao_testada` em `v9/`;
a cópia que aponta para produção não foi incorporada. A V7 da raiz está
preservada byte a byte (blob Git `1fefd7f8277dd3591420eacf3d11476e3ece1a1d`).

O relatório de homologação recebido e seus comandos são referências externas,
não autorização para migração ou publicação. Não foram usados como evidência
de aprovação desta execução. SQL e minuta de privacidade foram guardados em
`docs/v9/` para revisão; nenhum SQL foi executado.

A correção 4→5 fornecida pelo pacote foi incorporada: conclusão registra a casa,
calcula desbloqueio sequencial e abre a próxima. Acrescentada validação de
limites em `phOpen`, evitando índices inválidos. Cache da PWA recebeu prefixo
próprio da RC1; limpeza não remove caches de outras versões. Escopo `/v9/`.

## Testes executados

Comando: `python tests/validate_v9.py`, Chromium + Playwright 1.62.0 e Node 24.
Origem HTTPS virtual atendida pelo interceptador Playwright. Todas as chamadas
externas foram interceptadas, inclusive Auth e REST; nenhuma conta real usada.

- Sintaxe dos scripts internos e service worker: aprovada.
- 365 casas, 20 regiões contínuas, 66 livros; respostas e capítulos válidos: aprovados.
- Bloqueio sequencial; conclusão 1–4 e abertura da casa 5: aprovados.
- Avanço 364→365 e conclusão final: aprovados.
- Repetir casa concluída não duplica XP; persistência após recarregar: aprovadas.
- Chaves locais legadas V7 preservadas: aprovado.
- Leitor com resposta simulada, escape de HTML, cache IndexedDB offline e
  mensagem para capítulo ausente: aprovados.
- Login, primeira gravação, sincronização automática, recuperação remota,
  renovação da sessão e logout: aprovados em simulação HTTP.
- Conflito de revisão bloqueia sobrescrita; backups com schema, chave ou tipo
  inválido são rejeitados: aprovados.
- Larguras 320, 390 e 768 px: navegação visível, sem overflow horizontal.
- Nenhum erro JavaScript de página nos cenários executados.

## Limites e pendências de homologação

Não certifica login/cadastro/e-mail reais, RLS ou concorrência no servidor,
disponibilidade da fonte bíblica externa nem revisão editorial das 365 casas.
Nenhum Supabase foi consultado ou modificado. O SQL recebido pressupõe políticas
existentes: elas precisam ser verificadas em ambiente autorizado antes de aplicar.
Instalação e atualização reais da PWA não foram certificadas (service workers
bloqueados nos testes interceptados). Sem build: aplicação HTML estática.

O ambiente restringiu sockets inicialmente; Chromium foi executado com permissão
ampliada, mantendo interceptação HTTP. Git remoto indisponível pelo proxy;
a branch, o commit e o PR foram preparados pelo conector GitHub.

Nenhum merge, publicação, deploy ou alteração da `main` foi realizado.

## Revisão técnica do PR #2 — segunda validação, 26/10/2026

Referência: comentário `issuecomment-6417043390`. Esta seção atualiza o resultado
inicial acima; o teste de SW real local foi acrescentado nesta revisão.

- Cadastro exige 12 caracteres, e-mail válido e senha não composta apenas de
  espaços. Login legado preservado para contas com senhas menores.
- Configuração extraída para `v9/config.js` e validada em `config-runtime.js`.
  Endpoint vinculado ao ambiente, sem fallback para produção ou chave secreta.
- Modelo e gerador de produção em `config/` e `scripts/`: artefato separado,
  nuvem desativada, sem chave, sem deploy e sem sobrescrever destinos existentes.
- Namespace de laboratório preservado; produção usa namespaces próprios, inclusive
  backups, preferências e sessões. SW usa cache por escopo e consulta apenas seu
  cache na recuperação offline, evitando retornar página de outro ambiente.
- CI `V9 validation` configurada para pull requests destinados a `main`, com
  permissões somente de leitura, Python 3.12, Node 24 e Playwright fixado em 1.62.0.
  Nenhum segredo ou acesso a Supabase é necessário. O resultado remoto deve ser
  conferido nos checks do PR; configurar workflow não equivale a CI aprovada.

Comandos executados novamente, todos aprovados:

```sh
CHROMIUM_PATH=/usr/bin/chromium python tests/validate_v9.py
CHROMIUM_PATH=/usr/bin/chromium python tests/validate_config.py
CHROMIUM_PATH=/usr/bin/chromium python tests/validate_pwa.py
```

A regressão anterior permanece aprovada. Novos cenários: senhas vazia, curta e
só espaços; cadastro no limite de 12; login com senha legada; corrida entre leitura
e PATCH (retorno vazio CAS); falhas HTTP 401/403/500 sem alterar registros locais;
backup acima do limite; configuração ausente/inválida/privilegiada; produção local
com botões de Auth desativados e sem requisição Supabase; destino existente recusado.

PWA: servidor HTTP loopback, service worker real habilitado, sete assets em cache,
recarga offline com progresso preservado e controle ausente na página V7 da raiz.
Não equivale a instalação/atualização em dispositivo real ou domínio publicado.
Nenhum erro JavaScript de página nos cenários automatizados.

Pendências humanas: mínimo 12 no Auth do servidor, confirmação da proteção contra
senhas vazadas, dados definitivos da política de privacidade, homologação real de
Auth/RLS/concorrência/fonte bíblica, instalação e atualização em dispositivo real,
revisão dos checks CI e futura autorização de ativação/publicação. Ver
[configuração de produção](CONFIGURACAO_PRODUCAO.md). Nenhuma consulta, gravação ou
migração foi realizada em Supabase. V7 mantém blob
`1fefd7f8277dd3591420eacf3d11476e3ece1a1d` e `main` foi preservada.
