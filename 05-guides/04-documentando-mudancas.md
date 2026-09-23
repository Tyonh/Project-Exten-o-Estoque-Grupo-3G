# 04 — Documentando mudanças

**Regra:** toda atualização que vai pra `main` precisa ter uma explicação escrita. Essa explicação alimenta a documentação principal do projeto (pastas `00` a `04` de `docs/`).

Pode (e deve) usar IA pra rascunhar a explicação. Só dê uma lida antes de enviar pra conferir se bate com o que você fez.

## Template da Pull Request

Toda PR abre com este template preenchido (o GitHub carrega ele automaticamente a partir de `.github/pull_request_template.md`):

```markdown
## O que mudou
<!-- Descreva em 1 a 3 frases -->

## Por quê
<!-- Qual problema resolve? Link da issue: #numero -->

## Como testar
<!-- Passos pra quem vai revisar ver funcionando -->

## Documentação atualizada
- [ ] Não precisou
- [ ] Glossário (`02-domain`)
- [ ] Arquitetura / ADR (`04-architecture`)
- [ ] PRD (`01-product`)
- [ ] Guias (`05-guides`)
```

**PR sem esse template preenchido não é aprovada.** "Ajustes" ou "alterações" não contam como explicação.

## Mexeu em X → atualiza Y

| Se você... | Atualize |
|------------|----------|
| Mudou tabela, coluna ou relacionamento no banco | `04-architecture/` + comentário na migration |
| Criou ou mudou um conceito do negócio (variante, endereço, módulo...) | `02-domain/glossario.md` |
| Tomou uma decisão técnica relevante (biblioteca, padrão, estrutura) | Novo ADR em `04-architecture/` |
| Terminou algo que estava no PRD | Marque como concluído em `01-product/PRD.md` |
| Mudou algo em como a equipe trabalha ou roda o projeto | O guia correspondente em `05-guides/` |

## Como escrever um ADR

Um arquivo por decisão, numerado: `adr-003-como-representar-variantes.md`

```markdown
# ADR-003: Como representar variantes de produto

**Data:** AAAA-MM-DD
**Status:** aceita

## Contexto
<!-- Qual era o problema? -->

## Decisão
<!-- O que foi decidido -->

## Alternativas descartadas
<!-- O que mais foi considerado e por que não -->

## Consequências
<!-- O que muda a partir disso -->
```

O ADR registra o **porquê** das escolhas. Isso ajuda quem entra depois e vira material pronto pro relatório acadêmico.
