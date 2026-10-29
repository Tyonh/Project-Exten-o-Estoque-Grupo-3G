# Etapa 8 — Documentos de saída

## Objetivo
Receber pedidos de outro sistema e dar baixa por QR code.

## Por que esta etapa existe
Liga o estoque ao que foi vendido ou requisitado, com um responsável e sem baixa repetida.

## O que será construído
Rota que recebe documentos, leitura de QR code, tela do documento com a escolha do local de cada item, confirmação.

## Requisitos atendidos
RF-23 a RF-26.

## Tarefas

### Backend

- [x] **T8.1** Rota de servidor que recebe um documento com protocolo e itens (`POST /api/documentos`, segredo `GEDOC_INTEGRATION_TOKEN`)  
  Responsável: a definir
- [x] **T8.6** Funções de documentos em `backend/src/documentos.ts`: buscar por protocolo com os itens e os locais com saldo de cada um, confirmar a baixa (`confirmarSaidaDocumento`) e listar pendentes e baixados  
  Responsável: a definir

### Front-end

- [x] **T8.2** Página `/leitura/[protocolo]`, aberta pelo QR code  
  Responsável: a definir
- [x] **T8.3** Para cada item, listar os locais com saldo e sugerir de onde tirar  
  Responsável: a definir
- [x] **T8.4** Confirmar a baixa com a função `confirmarSaidaDocumento`  
  Responsável: a definir
- [x] **T8.5** Lista de documentos pendentes e baixados  
  Responsável: a definir

> Situação em 29/10/2026: código escrito, com as regras puras testadas (`npm test`). **Falta validar com banco real**: aplicar a migração `20261030090000_schema_estoque.sql` e rodar os cenários de [[plano-de-testes]] (fases 3 e 4) no Supabase de desenvolvimento. Só então marcar a Definition of Done.

## Pronto quando (Definition of Done)

- [ ] Um documento baixado não pode ser baixado de novo
- [ ] Faltando saldo para um item, nada é baixado e a tela diz qual item
- [ ] Um item pode sair de dois locais na mesma baixa
- [ ] Estoquista abre o documento mas não vê o botão de confirmar
- [ ] Lint e verificação de tipos sem erros
- [ ] Documentação atualizada no mesmo pull request

## Ligações
[[roteiro]] · [[PRD]] · [[domain-model]] · [[banco-de-dados]]
