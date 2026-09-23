# 05 — Convenções de código

> ⚠️ Este guia será completado quando a stack for definida.

## Idioma

| O quê | Idioma | Exemplo |
|-------|--------|---------|
| Código (variáveis, funções, arquivos) | Inglês | `productVariant`, `findByWarehouse()` |
| Tabelas e colunas do banco | Inglês | `product_variants`, `color_temperature` |
| Textos da interface | Português | "Cadastrar variante" |
| Commits, PRs, issues e documentação | Português | `feat: adiciona filtro por galpão` |

<!-- DEFINIR: a equipe pode optar por tudo em português. O importante é decidir uma vez e seguir. -->

## Nomes

<!-- DEFINIR conforme a stack. Sugestão base: -->

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Variáveis e funções | camelCase | `totalStock`, `getVariants()` |
| Componentes e classes | PascalCase | `ProductCard`, `WarehouseService` |
| Tabelas e colunas | snake_case | `storage_locations`, `created_at` |
| Constantes | UPPER_SNAKE_CASE | `MAX_UPLOAD_SIZE` |

## Organização de pastas

<!-- DEFINIR: estrutura interna de apps/web e apps/api -->

## O que o linter resolve sozinho

Formatação (espaços, aspas, ponto e vírgula, quebras de linha) é responsabilidade do linter/formatter configurado no repositório. Não precisa se preocupar com isso manualmente, só salvar o arquivo com a formatação automática ligada na IDE.

<!-- DEFINIR: ferramentas (ex.: ESLint + Prettier) e como ativar "formatar ao salvar" no Antigravity -->
