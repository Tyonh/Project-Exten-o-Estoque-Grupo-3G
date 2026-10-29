# Etapa 5 — Movimentações

## Objetivo
Registrar entrada, saída e transferência, e mostrar o histórico.

## Por que esta etapa existe
É aqui que o saldo passa a existir e a ser confiável.

## O que será construído
Tela de nova movimentação e tela de histórico. Todas chamam a função `registrarMovimentacao`.

## Requisitos atendidos
RF-12 a RF-16, RNF-01, RNF-02, RNF-03.

## Tarefas

### Backend

- [ ] **T5.6** Funções de movimentação em `backend/src/movimentacoes.ts`: entrada, transferência e saída avulsa pela função `registrarMovimentacao`, com gravação condicional do saldo; saldo de uma variante em um local; histórico por variante e geral, com filtro por período e paginação  
  Responsável: a definir

### Front-end

- [x] **T5.1** Tela de entrada: escolher variante, local de destino e quantidade  
  Responsável: a definir
- [x] **T5.2** Tela de transferência: origem, destino e quantidade, mostrando o saldo da origem  
  Responsável: a definir
- [x] **T5.3** Tela de saída avulsa, com motivo  
  Responsável: a definir
- [ ] **T5.4** Histórico por variante e histórico geral, com filtro por período e paginação  
  Responsável: a definir
- [x] **T5.5** Mostrar ao usuário as mensagens de erro vindas do backend  
  Responsável: a definir

> Situação em 28/10/2026: o formulário único de movimentação e o histórico operam com os dados reais. O histórico filtra no navegador e ainda não tem paginação no servidor (T5.4). O saldo só é alterado por `registrarMovimentacao`.

## Pronto quando (Definition of Done)

- [ ] Saída maior que o saldo mostra o erro e não altera nada
- [ ] Duas saídas simultâneas do mesmo item, em dois aparelhos, deixam o saldo correto
- [x] Nenhuma tela calcula saldo: o aplicativo só chama a função
- [ ] O histórico mostra quem fez cada movimentação
- [x] Lint e verificação de tipos sem erros
- [x] Documentação atualizada no mesmo pull request

## Ligações
[[roteiro]] · [[PRD]] · [[domain-model]] · [[banco-de-dados]]
