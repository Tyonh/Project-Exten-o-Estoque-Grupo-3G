# Etapa 4 — Locais

## Objetivo
Cadastro da árvore de endereços.

## Por que esta etapa existe
É o segundo eixo do projeto: saber onde as coisas podem ficar.

## O que será construído
Tela de locais em árvore, com criação de local dentro de outro, edição, mudança de lugar e desativação.

## Requisitos atendidos
RF-09, RF-10, RF-11.

## Tarefas

### Backend

- [ ] **T4.3** Sugestão automática de código a partir do local pai  
  Responsável: a definir
- [x] **T4.6** Funções de locais em `backend/src/locais.ts`: listar a árvore com o caminho completo, criar, editar, mover (sem deixar um local dentro de um descendente) e desativar (só sem saldo)  
  Responsável: a definir

### Front-end

- [x] **T4.1** Tela de locais em árvore, que abre e fecha os níveis  
  Responsável: a definir
- [x] **T4.2** Formulário de local: nome, tipo, código e local que o contém  
  Responsável: a definir
- [x] **T4.4** Mover local para dentro de outro  
  Responsável: a definir
- [x] **T4.5** Desativar local, com a mensagem do backend quando há mercadoria  
  Responsável: a definir

> Situação em 28/10/2026: a árvore e as funções operam com os dados reais. A sugestão automática de código (T4.3) ainda não foi feita.

> Atualização em 29/10/2026: além de **Desativar**, a tela do local tem **Apagar**, para corrigir um local criado por engano (nome, código ou lugar errado). O backend (`apagarLocal`) só apaga local **sem sublocais, mercadoria, movimentação nem inventário**; com histórico a única saída é desativar, para o histórico nunca perder o endereço. Quem opera (gerente de estoque e admin) pode apagar; os demais perfis só consultam. Testado com banco real em [[plano-de-testes]].

## Pronto quando (Definition of Done)

- [ ] Montar a árvore Galpão > Setor > Módulo pela tela
- [ ] Código repetido é recusado
- [ ] O caminho completo aparece em toda tela que mostra um local
- [x] Lint e verificação de tipos sem erros
- [x] Documentação atualizada no mesmo pull request

## Ligações
[[roteiro]] · [[PRD]] · [[domain-model]] · [[banco-de-dados]]
