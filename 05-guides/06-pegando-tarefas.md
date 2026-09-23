# 06 — Pegando tarefas

Todas as tarefas ficam no **GitHub Projects** (quadro kanban do repositório), cada uma ligada a uma **issue**.

## Colunas do quadro

| Coluna | Significado |
|--------|-------------|
| **Backlog** | Tarefas levantadas, ainda sem ordem definida |
| **A fazer** | Prontas pra alguém pegar |
| **Em andamento** | Alguém está trabalhando |
| **Em review** | PR aberta, aguardando aprovação |
| **Concluído** | Merge feito na `main` |

## Como pegar uma tarefa

1. Vá na coluna **A fazer**
2. Escolha uma issue (prioridade: as do seu módulo)
3. Atribua a issue a você (*Assignees* → seu nome)
4. Mova o card pra **Em andamento**
5. Crie a branch com o número da issue (ver [02 — Fluxo de Git](02-fluxo-git.md))

Não pegue mais de 2 tarefas ao mesmo tempo. Termine uma antes de começar outra.

## Labels

| Label | Significado |
|-------|-------------|
| `good first issue` | Boa pra quem está começando |
| `front` | Interface |
| `back` | API e regras de negócio |
| `db` | Banco de dados |
| `docs` | Documentação |
| `bloqueado` | Depende de outra tarefa ou de resposta da empresa |

## Definição de pronto

Uma tarefa só vai pra **Concluído** quando:

- [ ] Roda sem erro na máquina de quem fez
- [ ] PR aberta com o template preenchido
- [ ] Documentação atualizada (se precisou)
- [ ] Aprovada no review e com merge feito
- [ ] Issue fechada

## Criando uma issue nova

Achou um bug ou teve uma ideia? Crie uma issue com:
- Título claro (`Busca por setor não retorna resultados`)
- O que acontece e o que deveria acontecer
- A label certa

Na dúvida sobre prioridade, deixe no **Backlog** que o time organiza.
