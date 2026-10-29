# Migrações do banco

Esta pasta guarda a estrutura do banco, em arquivos SQL aplicados na ordem dos nomes. Quem cuida dela é a frente de banco de dados.

- **O que construir**: a especificação está em [`docs/04-architecture/banco-de-dados.md`](../../../docs/04-architecture/banco-de-dados.md). São tabelas, ligações, valores únicos, limites simples e índices.
- **O que não construir**: funções, gatilhos, visões e regras por perfil. As regras do sistema ficam no backend ([`docs/04-architecture/backend.md`](../../../docs/04-architecture/backend.md)).
- **Acesso**: ative a segurança por linha (RLS) em todas as tabelas e não crie nenhuma política.
- **Nome do arquivo**: data e hora seguidas de uma descrição curta, por exemplo `20261015093000_schema_inicial.sql`.
- **Nunca edite uma migração que já foi aplicada.** Uma mudança é sempre um arquivo novo.
- **Critério de aceite**: a tabela "O que o banco precisa recusar" da especificação. Cada linha precisa ser testada no Supabase de desenvolvimento.
- Ao mudar o banco, atualize a especificação no mesmo pull request.

## Catálogo real da 3G

O catálogo real (cerca de 3,9 mil produtos do `produtos.db` do GEDOC) não é seed de teste: é gerado em arquivos SQL por `npm run catalogo:gerar -- "<caminho do produtos.db>"` e fica em `backend/supabase/catalogo-real/`. Cada produto vira uma variante, com família, categoria e marca lidas da descrição (regras em `backend/src/servidor/classificacao.ts`).

Aplicação, só depois da migração `20261030090000_schema_estoque.sql` e de expor o schema `estoque` na API: `000-estrutura.sql`, depois cada `NNN-variantes.sql` em ordem. Os arquivos são idempotentes. Não criam saldos: as quantidades entram por movimentações. Roteiro de conferência em [`docs/07-testes/plano-de-testes.md`](../../../docs/07-testes/plano-de-testes.md).
