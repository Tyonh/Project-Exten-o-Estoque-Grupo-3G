# Etapa 7 — Inventário

## Objetivo
Contar um local e corrigir as diferenças com registro.

## Por que esta etapa existe
É a ferramenta que a empresa usa para colocar o saldo do sistema de acordo com o físico.

## O que será construído
Tela para abrir inventário, tela de contagem e tela de conclusão com o resumo das diferenças.

## Requisitos atendidos
RF-20, RF-21, RF-22.

## Tarefas

### Backend

- [x] **T7.6** Funções de inventário em `backend/src/inventarios.ts`: listar (`listarInventarios`), abrir (`abrirInventario`), buscar com itens e diferenças (`buscarInventario`), gravar a quantidade contada (`registrarContagem`), incluir item (`incluirItemNoInventario`), concluir (`concluirInventario`) e cancelar (`cancelarInventario`). As diferenças são calculadas por `backend/src/servidor/inventario-regras.ts`  
  Responsável: a definir

### Front-end

- [x] **T7.1** Abrir inventário de um local (função `abrirInventario`)  
  Responsável: a definir
- [x] **T7.2** Tela de contagem, pensada para celular  
  Responsável: a definir
- [x] **T7.3** Incluir item encontrado que não estava na lista  
  Responsável: a definir
- [x] **T7.4** Resumo das diferenças antes de concluir  
  Responsável: a definir
- [x] **T7.5** Concluir (função `concluirInventario`) e cancelar  
  Responsável: a definir

> Situação em 30/10/2026: telas ligadas ao backend; as regras de diferença estão testadas (`npm test`). **Falta validar com banco real** (cenários na fase 4 de [[plano-de-testes]]). Só pode contar, incluir, concluir ou cancelar quem opera (gerente de estoque e admin); os demais perfis só consultam.

## Pronto quando (Definition of Done)

- [ ] Contagem diferente do sistema gera ajuste visível no histórico
- [ ] Item não contado não é alterado
- [ ] Não é possível abrir dois inventários do mesmo local
- [ ] Lint e verificação de tipos sem erros
- [ ] Documentação atualizada no mesmo pull request

## Ligações
[[roteiro]] · [[PRD]] · [[domain-model]] · [[banco-de-dados]]
