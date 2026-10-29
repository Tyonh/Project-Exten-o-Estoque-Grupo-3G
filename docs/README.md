# Documentação do projeto

Esta pasta é a fonte da verdade do projeto. Tudo que o sistema é, faz e vai fazer está escrito aqui. Se o código e a documentação disserem coisas diferentes, um dos dois está errado e precisa ser corrigido.

A pasta funciona como um cofre do Obsidian: abra `docs/` no Obsidian e os links entre colchetes duplos viram navegação.

## Por onde começar

Leia nesta ordem. Os quatro primeiros não exigem conhecimento de programação.

1. [[project-overview]]: o que é o sistema e que problema ele resolve.
2. [[glossario]]: o significado de cada termo usado no projeto.
3. [[escopo]]: o que entra, o que fica de fora e o que vem depois.
4. [[PRD]]: o que cada pessoa consegue fazer no sistema.
5. [[domain-model]]: as regras de negócio.
6. [[banco-de-dados]]: como a informação é guardada.
7. [[backend]]: como o servidor aplica as regras.
8. [[roteiro]]: as etapas de construção, na ordem.

## Mapa das pastas

| Pasta | Conteúdo |
|---|---|
| `00-context` | Visão geral, escopo, glossário e tecnologias |
| `01-product` | Requisitos: o que o sistema precisa fazer |
| `02-domain` | Regras de negócio e entidades |
| `03-specifications` | Roteiro e etapas de construção, com tarefas |
| `04-architecture` | Banco de dados, backend e decisões técnicas |
| `06-security` | Quem pode fazer o quê |
| `07-testes` | Plano de testes por fase, até o uso diário |
| `08-observability` | Como acompanhar erros e auditoria |

Os guias de trabalho da equipe (ambiente, Git, uso de IA, como pegar tarefas) ficam em `05-guides/`, na raiz do repositório.
