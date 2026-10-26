# Configuração separada de produção — RC1

A candidata em `v9/` continua no laboratório. A configuração fica em `config.js`,
validada por `config-runtime.js`. Os endpoints são vinculados ao ambiente;
um endpoint trocado, configuração ausente ou chave privilegiada desativa a nuvem.
Não se aceita `service_role`, `sb_secret_*` nem configuração por URL/query string.

Para gerar a candidata local de produção, sem rede de nuvem:

```sh
python scripts/prepare_production.py --output work/production-review
python -m http.server 8765
# Abrir http://localhost:8765/work/production-review/index.html
```

Esse comando apenas copia arquivos estáticos para um destino novo. Não faz deploy,
não modifica `v9/`, a V7 ou banco algum. O modelo de produção permanece sem chave,
com `cloudEnabled: false`; o gerador rejeita habilitação e destinos existentes.
O laboratório conserva suas chaves locais anteriores. A produção usa namespaces
`shema-v9-production::` e `shema-v9-production-account::`, sem importar, apagar ou
reescrever registros antigos. Caches PWA são separados pelo escopo completo.

## Liberação posterior: depende de intervenção humana

1. Em ambiente autorizado, definir mínimo de senha **12** no Supabase Auth.
   Validação no cliente não substitui o servidor. Rever rate limits, confirmação
   de e-mail e URLs de redirecionamento; habilitar proteção de senhas vazadas se
   disponível no plano. Não alterar senhas ou excluir contas existentes.
2. Rever RLS de SELECT/INSERT/UPDATE por `auth.uid() = user_id`, com `WITH CHECK`,
   privilégios e suporte à revisão CAS. Homologar duas contas e dois aparelhos
   num banco de testes autorizado. O SQL recebido não comprova o estado atual.
3. Preencher responsável, contato, retenção e procedimentos da política de
   privacidade. A minuta não é uma política pronta nem está ligada como definitiva.
4. Homologar cadastro/login/refresh real, e-mail, isolamento entre contas,
   gravações concorrentes e fonte bíblica ao vivo. Instalar a PWA num dispositivo
   real para avaliar atualização, offline e remoção; o teste local cobre SW/cache.
5. Revisar CI e autorizar separadamente a ativação de produção e publicação.
   Não há caminho de ativação de produção habilitado nesta RC: uma mudança
   posterior revisada deverá disponibilizar somente a chave pública publishable,
   depois de verificar Auth/RLS e todos os critérios anteriores.

Referência consultada: https://supabase.com/docs/guides/auth/password-security
(via documentação MCP). A consulta HTTP ao changelog ficou indisponível pelo
proxy; nenhum comando ou ajuste remoto foi executado.
