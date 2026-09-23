# 02 — Fluxo de Git

Existe **um repositório central** no GitHub. Todo mundo contribui pra ele criando branches e pedindo pra juntar (merge) o trabalho na `main` através de Pull Requests.

## Por que não mexer direto na `main`?

A `main` é a versão "oficial" do sistema. Ela é protegida: o GitHub não deixa ninguém fazer push direto nela. Assim, um erro de uma pessoa não quebra o projeto de todo mundo.

## O ciclo completo

```bash
# 1. Vá pra main e pegue a versão mais recente
git checkout main
git pull

# 2. Crie sua branch a partir dela (use o número da issue)
git checkout -b feat/12-cadastro-variantes

# 3. Trabalhe normalmente e salve seu progresso em commits
git add .
git commit -m "feat: cria formulário de cadastro de variantes"

# 4. Envie sua branch pro GitHub
git push -u origin feat/12-cadastro-variantes
```

5. No GitHub, abra um **Pull Request** da sua branch para a `main`
6. Preencha o template da PR (ver [04 — Documentando mudanças](04-documentando-mudancas.md))
7. Aguarde o review. Se pedirem ajustes, é só fazer novos commits na mesma branch e dar push de novo
8. Aprovado → merge → apague a branch

## Nome de branch

`tipo/numero-da-issue-descricao-curta`

| Tipo | Quando usar | Exemplo |
|------|-------------|---------|
| `feat/` | Funcionalidade nova | `feat/12-cadastro-variantes` |
| `fix/` | Correção de erro | `fix/18-busca-endereco` |
| `docs/` | Só documentação | `docs/20-glossario` |
| `refactor/` | Melhoria de código sem mudar comportamento | `refactor/25-servico-produtos` |

## Mensagem de commit

Formato: `tipo: o que foi feito` (em português, verbo no presente).

✅ Bons:
```
feat: adiciona campo de temperatura de cor na variante
fix: corrige busca de produto por setor
docs: atualiza glossário com o termo "módulo"
```

❌ Ruins:
```
ajustes
alterações
agora vai
```

## Review

- Toda PR precisa de **pelo menos 1 aprovação** antes do merge
- De preferência, quem revisa é o responsável pela camada (front, back ou banco) que a PR mexe
- O review olha principalmente: está organizado? a explicação foi escrita? roda sem erro?

## Deu conflito, e agora?

Conflito acontece quando você e outra pessoa mexeram no mesmo trecho. É normal.

```bash
git checkout main
git pull
git checkout sua-branch
git merge main
```

O Git vai marcar os arquivos com conflito. Abra no Antigravity, que mostra as duas versões lado a lado, escolha o que fica, salve e:

```bash
git add .
git commit -m "fix: resolve conflito com a main"
git push
```

Se não souber qual versão manter, pergunte no grupo antes de escolher.
