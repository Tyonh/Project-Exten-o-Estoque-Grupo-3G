# Etapa 2 — Acesso

## Objetivo
Login, perfis e liberação de usuários.

## Por que esta etapa existe
Nada no sistema deve ser visível sem login, e cada perfil enxerga só o que lhe cabe.

## O que será construído
Tela de login, tela de "aguardando liberação", tela de administração de usuários, menu que muda conforme o perfil.

## Requisitos atendidos
RF-01, RF-02, RF-03, RF-28, RNF-04.

## Tarefas

### Backend

- [ ] **T2.4** Proteção de rotas: sem sessão, volta para o login  
  Responsável: a definir
- [ ] **T2.6** Funções de sessão em `backend/src/sessao.ts`, rodando no servidor: entrar, cadastrar (criando o perfil `pendente`), sair e perfil atual  
  Responsável: a definir
- [ ] **T2.7** Funções de usuários em `backend/src/usuarios.ts`: listar perfis e alterar o perfil de um usuário, só para admin  
  Responsável: a definir
- [ ] **T2.8** Funções de recuperação de senha em `backend/src/sessao.ts` (pedir o link e trocar a senha) e rota `frontend/app/api/auth/confirmar-recuperacao` para trocar o código do e-mail por sessão  
  Responsável: a definir

### Front-end

- [ ] **T2.1** Tela de login e cadastro com e-mail e senha  
  Responsável: a definir
- [ ] **T2.2** Tela "aguardando liberação" para o perfil pendente  
  Responsável: a definir
- [ ] **T2.3** Tela de usuários para o admin alterar perfis  
  Responsável: a definir
- [ ] **T2.5** Menu e navegação no celular conforme o perfil  
  Responsável: a definir
- [ ] **T2.9** Telas de recuperar senha (`app/recuperar-senha`) e criar nova senha (`app/redefinir-senha`), com link na tela de login  
  Responsável: a definir

A base de T2.4 e T2.6 está no repositório (`proxy.ts`, `backend/src/sessao.ts`, que roda no servidor, e telas provisórias em `app/login` e `app/pendente`) e foi testada contra o banco real em 22/10/2026: login, leitura do perfil, liberação de cargo e sair. Falta testar o **cadastro pela tela**, bloqueado pelo limite de e-mails do Supabase (ver "Confirmação de e-mail no cadastro" em [[decisions#Pendentes]]).

T2.8 e T2.9 estão implementadas; falta testar o **link recebido por e-mail** no ambiente de desenvolvimento (o envio depende do limite de e-mails e da configuração de URLs do Supabase, em [[01-setup-ambiente]]).

## Pronto quando (Definition of Done)

- [ ] Usuário novo entra como pendente e não vê nenhum dado
- [ ] Admin altera um perfil e a mudança vale no próximo acesso
- [ ] Cada perfil foi testado contra a tabela de [[security-model]]
- [ ] Lint e verificação de tipos sem erros
- [ ] Documentação atualizada no mesmo pull request

## Ligações
[[roteiro]] · [[PRD]] · [[domain-model]] · [[banco-de-dados]]
