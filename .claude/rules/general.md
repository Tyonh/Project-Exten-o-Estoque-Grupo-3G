# Convenções gerais

Valem para o projeto inteiro. A fonte da verdade é `docs/`; os guias práticos
da equipe ficam em `05-guides/`.

- **Idioma**: código de negócio (tabelas, colunas, variáveis, funções) e
  textos de UI em português, com os nomes de `docs/00-context/glossario.md`.
  Nomes técnicos de bibliotecas (`useState`, `router`, `supabase`) ficam como
  são.
- **Commits** em português, no formato `tipo: o que foi feito`, verbo no
  presente (`feat: adiciona campo de temperatura de cor na variante`).
- **Branches** `etapaN/codigo-da-tarefa-descricao`, uma por tarefa, sempre a
  partir da `main` (ex. `etapa3/t3-3-tela-variantes`). A `main` é protegida:
  só entra por pull request com pelo menos 1 aprovação.
- **Nomes**: componentes React em `PascalCase` (`CartaoVariante`); funções e
  variáveis em `camelCase` (`saldoTotal`); tabelas e colunas em `snake_case`
  (`estoque_minimo`); constantes em `UPPER_SNAKE_CASE`.
- **TypeScript em tudo** — arquivos `.js` novos não são aceitos.
- **Uma responsabilidade por arquivo**. Tela com mais de ~300 linhas deve ser
  dividida em componentes.
- **Nenhuma tela fala com o banco** nem soma/subtrai saldo: só chama as
  funções de `backend/src/`.
