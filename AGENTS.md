# Instruções para assistentes de IA

Antes de alterar qualquer arquivo, leia `docs/README.md` e siga a ordem de leitura indicada lá. A pasta `docs/` é a fonte da verdade: se o código disser outra coisa, o código está errado.

## Estrutura

- Raiz: projeto npm com duas pastas de código. Os comandos `npm` rodam na raiz.
- `backend/src/`: o backend. Funções que rodam no servidor, uma por operação ou consulta, importadas pelas telas como `@estoque/backend/<arquivo>`. Frente de backend.
  - `backend/src/servidor/`: código interno do backend (conexão com o banco, conferência de perfil). Nenhuma tela importa nada daqui.
- `frontend/`: aplicativo Next.js 16 + React 19 + TypeScript estrito + Tailwind 4. Telas (`app/`) e componentes (`components/`) são da frente de front-end; `proxy.ts` e `app/api/` são da frente de backend (o Next.js exige que fiquem aqui).
- `backend/supabase/`: o banco (migrações e dados de teste). Frente de banco de dados.
- `docs/`: documentação (fonte da verdade). `05-guides/`: guias práticos da equipe.

As regras ficam no backend e o banco é simples: `docs/04-architecture/backend.md`, `docs/04-architecture/banco-de-dados.md` e `docs/04-architecture/decisions.md` (ADR-13, ADR-14 e ADR-15). A fila de cada frente está em `docs/03-specifications/roteiro.md`.

## Comandos e ambiente

Todos na raiz (é um workspace npm — não rode `npm install` dentro de `frontend/` ou `backend/`):

```bash
npm install        # instala os dois workspaces de uma vez
npm run dev        # Next.js em http://localhost:3000
npm run lint       # ESLint — só o frontend tem script de lint
npm run typecheck  # tsc nos dois workspaces
```

- Não existe suíte de testes nem `npm test`; não invente um.
- Node 20 ou mais recente.
- Setup: `cp frontend/.env.example frontend/.env.local` e peça os valores ao responsável (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`). Sem esse arquivo, toda chamada ao banco falha.
- Não há Supabase local nem CLI configurada (não existe `config.toml`): não rode `supabase start`/`db push`. As migrações são aplicadas à mão no SQL Editor do Supabase de desenvolvimento, na ordem dos nomes.
- Não há CI configurada (só o template de PR). A verificação é local: `npm run lint` + `npm run typecheck`.
- `frontend/proxy.ts` é o middleware do Next 16 (o arquivo deixou de se chamar `middleware.ts`): protege rotas e renova o cookie da sessão.

## Regras permanentes

- Use os nomes de `docs/00-context/glossario.md` em tabelas, variáveis e telas. Código de negócio em português.
- Toda regra de negócio fica no backend. O banco não tem funções, gatilhos, visões nem regras por perfil: só tabelas, ligações, valores únicos e limites simples.
- Estoque só é alterado pelas operações do backend: `registrarMovimentacao`, `confirmarSaidaDocumento`, `abrirInventario`, `concluirInventario`. Cada uma grava o saldo de forma condicional (só se ele não mudou desde a leitura) e desfaz o que já gravou se algo falhar. Nenhuma tela soma ou subtrai saldo.
- Telas não falam com o banco: chamam as funções de `backend/src/`, que devolvem `{ ok, dados }` ou `{ ok, erro }` (`backend/src/resultado.ts`).
- Toda função do backend confere a sessão e o perfil antes de agir. O autor de uma ação vem da sessão, nunca de um campo enviado pela tela.
- O backend acessa o banco com `SUPABASE_SECRET_KEY`, que ignora a segurança por linha (RLS). Por isso as tabelas têm RLS ativado e nenhuma policy — não crie policies.
- Tabelas e colunas do banco têm os nomes do contrato em `docs/04-architecture/banco-de-dados.md`.
- A referência de um item é sempre o código da variante, nunca o nome (ADR-07).
- Mudança no banco é um arquivo novo em `backend/supabase/migrations/`. Não edite uma migração que já foi aplicada.
- Não invente funcionalidade. Se uma regra não estiver em `docs/`, pare e pergunte.
- Toda tela precisa funcionar em celular (360 px). Telas e acabamento visual são da frente de front-end.
- Trabalhe uma etapa por vez, na ordem de `docs/03-specifications/roteiro.md`. Ao terminar uma tarefa, marque a caixa no arquivo da etapa e atualize a documentação afetada.
- Antes de dizer que terminou, rode `npm run lint` e `npm run typecheck` na raiz e mostre o resultado.
- Nenhuma chave ou senha em arquivo do repositório. Segredos ficam em `frontend/.env.local`. `SUPABASE_SECRET_KEY` só existe no servidor.
- Não rode comandos que alterem um banco remoto nem faça `git push` sem o responsável pedir.

## Git

- Uma branch por tarefa, a partir da `main`: `etapaN/codigo-da-tarefa-descricao` (ex. `etapa3/t3-3-tela-variantes`). A `main` é protegida, só entra por pull request.
- Commits em português, no formato `tipo: o que foi feito` (ex. `feat: adiciona campo de temperatura de cor na variante`).
- Toda PR precisa de pelo menos 1 aprovação.

Responda sempre em português do Brasil.
