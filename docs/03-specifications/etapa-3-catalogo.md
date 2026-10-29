# Etapa 3 — Catálogo

## Objetivo
Cadastro de categorias, famílias e variantes.

## Por que esta etapa existe
É a raiz do problema: sem separar as variantes, nenhum saldo fecha.

## O que será construído
Telas de categorias (com editor de atributos), famílias e variantes; busca por código e nome; envio de imagem.

## Requisitos atendidos
RF-04 a RF-08, RNF-08.

## Tarefas

### Backend

- [ ] **T3.7** Funções do catálogo em `backend/src/catalogo.ts`: listar, criar e editar categorias, famílias e variantes; desativar e reativar variante; busca por código ou nome com paginação  
  Responsável: a definir
- [ ] **T3.8** Armazenamento de imagens no Supabase e função de envio em `backend/src/imagens.ts`  
  Responsável: a definir

### Front-end

- [x] **T3.1** Tela de categorias, com a lista de atributos e o estoque mínimo padrão  
  Responsável: a definir
- [x] **T3.2** Tela de famílias  
  Responsável: a definir
- [x] **T3.3** Tela de variantes: o formulário mostra os atributos da categoria  
  Responsável: a definir
- [ ] **T3.4** Envio de imagem para o armazenamento do Supabase  
  Responsável: a definir
- [ ] **T3.5** Busca por código ou nome, com paginação  
  Responsável: a definir
- [x] **T3.6** Desativar e reativar variante  
  Responsável: a definir

> Situação em 28/10/2026: as telas e as funções de catálogo operam com os dados reais do Supabase. A busca funciona no navegador, mas ainda sem paginação. A imagem é guardada como data URL no cadastro; o envio para um bucket do Supabase é a T3.4.

> Atualização em 29/10/2026, com o catálogo real da 3G (3.905 variantes): a leitura do catálogo e dos saldos é paginada no backend (o Supabase corta em 1.000 linhas). A aba **Variantes** ganhou filtros de **categoria, família, marca e situação** (ativas/inativas), busca que também procura pela marca, contador de resultados e "Mostrar mais" de 50 em 50 (antes desenhava tudo de uma vez). A variante tem o campo **marca** (formulário com sugestão das marcas já cadastradas). A busca com paginação **no servidor** continua na T3.5 e a imagem em bucket na T3.4. Como o catálogo real foi montado: [[plano-de-testes]] (fase 1) e `backend/supabase/migrations/README.md`.

## Pronto quando (Definition of Done)

- [ ] Criar uma categoria nova com atributos próprios sem alterar código
- [ ] Código de variante repetido é recusado com mensagem clara
- [ ] Estoquista vê o catálogo mas não vê botões de edição
- [ ] A busca funciona em tela de celular
- [x] Lint e verificação de tipos sem erros
- [x] Documentação atualizada no mesmo pull request

## Ligações
[[roteiro]] · [[PRD]] · [[domain-model]] · [[banco-de-dados]]
