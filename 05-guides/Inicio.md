# 05-guides — Comece por aqui

Bem-vindo ao projeto **Sistema de Catalogação e Endereçamento de Estoque**, desenvolvido para o Grupo 3G no Projeto de Extensão da UNIFAMETRO.

Em uma frase: o sistema organiza o cadastro de produtos (famílias, variantes, atributos e imagens) e registra onde cada item está fisicamente nos galpões (galpão → setor → módulo).

Esta pasta explica **como a equipe trabalha**. Não precisa decorar nada, só ler na ordem e voltar quando tiver dúvida.

## Ordem de leitura

| # | Guia | Responde a pergunta |
|---|------|---------------------|
| 1 | [Setup do ambiente](01-setup-ambiente.md) | Como deixo o projeto rodando na minha máquina? |
| 2 | [Fluxo de Git](02-fluxo-git.md) | Como mando meu código pro projeto? |
| 3 | [Uso de IA](03-uso-de-ia.md) | Como usar IA pra ir mais rápido? |
| 4 | [Documentando mudanças](04-documentando-mudancas.md) | O que preciso escrever junto com meu código? |
| 5 | [Convenções de código](05-convencoes-de-codigo.md) | Como nomear arquivos, variáveis e tabelas? |
| 6 | [Pegando tarefas](06-pegando-tarefas.md) | Como escolho o que fazer? |
| 7 | [Quando travar](07-quando-travar.md) | Travei, e agora? |

## As 3 regras de ouro

1. **Ninguém faz push direto na `main`.** Todo código entra por branch + Pull Request.
2. **Toda mudança chega com explicação escrita.** Sem explicação, a PR não é aprovada.
3. **Toda tarefa começa numa issue.** Se não tem issue, cria uma antes de começar.

## Seu trabalho fica registrado

Commits, Pull Requests e reviews ficam registrados no GitHub com o nome de quem fez. Esse histórico é a evidência da participação de cada um no projeto, e pode ser usado no portfólio e na avaliação. Trabalhe sempre pela sua própria conta.

## Segredos nunca vão pro repositório

Senhas, tokens e configurações sensíveis ficam no arquivo `.env`, que está no `.gitignore` e **nunca** é commitado. O repositório tem um `.env.example` mostrando quais variáveis existem, sem os valores reais.
