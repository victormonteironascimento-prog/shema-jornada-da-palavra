# Shema V9 — Árvore Genealógica Bíblica (prévia)

## Fonte e integridade textual

Base inicial: PDF fornecido pelo usuário, **“Árvore genealógica bíblica — cânon protestante (66 livros)”**, 25 páginas. O documento define explicitamente que **não pretende enumerar todas as pessoas nomeadas na Bíblia**, apenas as relações e referências de seu escopo. Os dados da interface foram selecionados e reestruturados manualmente com base nos blocos correspondentes, sem incorporar traduções bíblicas integrais.

O HTML copiado do Gemini veio **incompleto** e omitia gerações (Sete–Noé, Arfaxade–Abraão, Perez–Davi e parte dos reis). Em lugar de repetir essas omissões, os dois evangelhos são reproduzidos por suas **sequências independentes** conforme o PDF:

- Mateus 1:1–17: 41 registros de Abraão a Jesus. Maria é identificada como mãe; José aparece como marido de Maria, sem paternidade biológica presumida.
- Lucas 3:23–38: 78 registros de Deus a Jesus, **invertendo apenas a ordem da lista de Lucas para visualização descendente**, preservando a ressalva “conforme se pensava” de Lc 3:23. Deus–Adão é criação, não geração humana. A seção respeita homônimos, variantes em Lc 3:33 e Cainã adicional.
- Outros conjuntos: Gênesis 4–5, povos de Noé (Gn 10), família de Abraão/Isaque/Jacó, Rute 4, Êxodo 6/1 Crônicas 6, casa de Davi (1 Crônicas 3), família de Saul (1 Crônicas 8), famílias narrativas dos Evangelhos.

**10 conjuntos, mais de 350 nós documentados.** O módulo não é um índice completo de todos os parentescos presentes no PDF de 25 páginas; ampliar a cobertura deve ser trabalho editorial separado, com checagem dos vínculos de cada trecho.

## Experiência

- Novo **ícone “Árvore”** na navegação inferior, sem remover funcionalidades existentes.
- Visual de papel ilustrado, cartões e notas, reinterpretado na identidade Shema sem logotipo ou propriedade visual de terceiros.
- Controles touch, mouse e teclado: arrastar, pinçar, ampliar/reduzir, centralizar; busca por nome; lista acessível; ficha com parentesco, referências, contexto e ressalvas editoriais.
- Estático e offline: `v9/genealogy-data.js` e `v9/genealogy.js` entram no cache da PWA. Nenhum acesso a Supabase é requerido pelo recurso; a jornada, XP e contas não são alterados.

## Critérios de homologação

1. Navegar pelas 10 visualizações e abrir as fichas sem erros de JavaScript.
2. Mateus não ligar José a Jesus como pai biológico. Lucas preservar o qualificador e manter identidades homônimas distintas.
3. Mães identificadas corretamente: Tamar/Perez, Raabe/Boaz, Rute/Obede, Maria/Jesus; não chamar Tamar de mãe de Judá.
4. Testar busca, pan/zoom, tamanho de tela de Android, lista navegável.
5. Abrir uma vez online, desconectar, recarregar e abrir a árvore offline.
6. Acessibilidade, escopo e compatibilidade com o cabeçalho/menu existentes.
7. Validar editorialmente os conjuntos adicionais antes de divulgar a genealogia como “completa”.

## Publicação

Este trabalho está em **branch exclusiva** `feature/arvore-genealogica-v9`, baseada em `feature/master-admin-v9`. Não publicar em `main`, não executar migração SQL, não alterar dados de participantes nem criar XP.
