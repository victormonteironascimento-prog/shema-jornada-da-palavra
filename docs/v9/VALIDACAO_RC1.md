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
