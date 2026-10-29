# Etapa 2 — Acesso

## Objetivo
Login, perfis e liberação de usuários.

## Por que esta etapa existe
Nada no sistema deve ser visível sem login, e cada perfil enxerga só o que lhe cabe.

## O que será construído
Tela de login, tela de "acesso sem liberação", tela de administração de usuários (criar, transferir, desconectar, apagar contas sem histórico e alterar perfil), tela de primeiro acesso para trocar a senha provisória, tela "Minha conta" para trocar a própria senha e menu que muda conforme o perfil. Não há cadastro público.

## Requisitos atendidos
RF-01, RF-02, RF-03, RF-28, RF-29, RF-30, RF-31, RF-32, RNF-04.

## Tarefas

### Backend

- [x] **T2.4** Proteção de rotas: sem sessão, volta para o login  
  Responsável: a definir
- [x] **T2.6** Funções de sessão em `backend/src/sessao.ts`, rodando no servidor: entrar, sair e perfil atual. Não existe função de cadastro público  
  Responsável: a definir
- [x] **T2.7** Funções de usuários em `backend/src/usuarios.ts`: listar usuários, criar acesso com senha provisória, alterar o perfil, transferir a conta para outro titular, desconectar o acesso e apagar contas sem histórico, só para admin  
  Responsável: a definir
- [x] **T2.8** Funções de recuperação de senha em `backend/src/sessao.ts` (pedir o link e trocar a senha) e rota `frontend/app/api/auth/confirmar-recuperacao` para trocar o código do e-mail por sessão  
  Responsável: a definir
- [x] **T2.10** Troca de senha da conta em `backend/src/sessao.ts`: conferir a senha atual, gravar a nova, limpar a marca de senha provisória e encerrar as outras sessões  
  Responsável: a definir
- [x] **T2.13** Transferência de titular em `backend/src/usuarios.ts`: trocar nome e e-mail, gerar senha provisória e manter o mesmo `id` de `perfis` e o histórico  
  Responsável: a definir

### Front-end

- [x] **T2.1** Tela de login com e-mail e senha, sem cadastro público  
  Responsável: a definir
- [x] **T2.2** Tela "acesso sem liberação" para o perfil pendente  
  Responsável: a definir
- [x] **T2.3** Tela de usuários: criar acesso com senha provisória, alterar perfis, transferir contas, desconectar acessos e apagar contas sem histórico  
  Responsável: a definir
- [x] **T2.5** Menu e navegação no celular conforme o perfil  
  Responsável: a definir
- [x] **T2.9** Telas de recuperar senha (`app/recuperar-senha`) e criar nova senha (`app/redefinir-senha`), com link na tela de login  
  Responsável: a definir
- [x] **T2.11** Tela "Minha conta" (`app/(app)/conta`) para consultar nome, e-mail e perfil e trocar a própria senha  
  Responsável: a definir
- [x] **T2.12** Tela de primeiro acesso (`app/primeiro-acesso`), obrigatória enquanto a senha provisória não for trocada  
  Responsável: a definir

A base de T2.1 a T2.7 está no repositório e foi testada contra o banco real em 28/10/2026: login, leitura do perfil, proteção de rota, menu por perfil, carregamento dos dados reais e criação de acesso pela tela com senha provisória (a conta descartável foi apagada depois). Em 29/10/2026 foram testados com contas descartáveis, removidas ao final: desconexão (tela `pendente`), primeiro acesso obrigatório, troca de senha em "Minha conta" e exclusão definitiva de uma conta sem histórico. A troca de perfil pela tela, a recusa de exclusão de conta com histórico e o teste de cada perfil ainda faltam. O cadastro público foi removido; a regra está em [[security-model#Autenticação]].

T2.8 e T2.9 foram testadas em 28/10/2026: pedido pela tela, recebimento do e-mail, criação da nova senha e login com a senha nova. A configuração de URLs do Supabase está em [[01-setup-ambiente]].

## Pronto quando (Definition of Done)

- [x] Admin cria um acesso com perfil e senha provisória, e a pessoa é obrigada a trocar a senha no primeiro acesso
- [ ] Admin altera um perfil e a mudança vale no próximo acesso
- [ ] Admin transfere uma conta para outro nome e e-mail, e o histórico continua ligado
- [ ] Admin desconecta um acesso e a pessoa perde o acesso; depois o admin libera de novo
- [ ] Admin apaga uma conta sem histórico e ela some da lista; a exclusão de conta com histórico é recusada
- [x] A pessoa troca a própria senha em "Minha conta" e a senha antiga deixa de entrar
- [x] Perfil `pendente` não vê nenhum dado
- [ ] Cada perfil foi testado contra a tabela de [[security-model]]
- [x] Lint e verificação de tipos sem erros
- [x] Documentação atualizada no mesmo pull request

## Ligações
[[roteiro]] · [[PRD]] · [[domain-model]] · [[banco-de-dados]]
