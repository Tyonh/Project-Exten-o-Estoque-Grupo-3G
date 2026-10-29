# 01 — Setup do ambiente

Objetivo: sair do zero até o sistema rodando na sua máquina em uns 10 minutos.

## 1. Contas

- [ ] Criar conta no [GitHub](https://github.com) (use seu nome real ou algo reconhecível no perfil)
- [ ] Passar seu usuário do GitHub pro responsável pelo repositório
- [ ] Aceitar o convite do repositório (chega por e-mail)

## 2. Ferramentas

- [ ] **Git** — https://git-scm.com/downloads
- [ ] **Node.js 20 ou mais recente** — https://nodejs.org
- [ ] **Um editor de código.** Recomendado: **Antigravity**, IDE baseada no VS Code, com Gemini integrado e gratuita para universitários
- [ ] **Obsidian** (opcional), para ler a pasta `docs/` com os links navegáveis

> O Antigravity é a IDE **recomendada**, mas não é obrigatória. As regras de formatação ficam no próprio repositório (config do linter), então quem usar VS Code ou outra IDE segue o mesmo padrão.

Não é preciso instalar banco de dados: o projeto usa um Supabase de desenvolvimento, na nuvem, compartilhado pela equipe.

## 3. Configurar o Git (só na primeira vez)

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email-do-github@exemplo.com"
```

Use o mesmo e-mail da conta do GitHub, senão seus commits não aparecem no seu perfil.

## 4. Clonar o projeto

```bash
git clone https://github.com/Tyonh/Project-Exten-o-Estoque-Grupo-3G.git
cd Project-Exten-o-Estoque-Grupo-3G
```

## 5. Instalar e configurar o aplicativo

O projeto tem duas pastas de código, `frontend/` (telas) e `backend/` (regras), e é instalado de uma vez só. Todos os comandos `npm` rodam **na raiz do repositório**.

```bash
npm install
cp frontend/.env.example frontend/.env.local
```

Preencha o `frontend/.env.local` com os valores que o responsável pelo projeto passar por mensagem privada. Nunca commite o `.env.local`.

| Variável | O que é |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Endereço do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública, usada no login |
| `SUPABASE_SECRET_KEY` | Chave secreta do projeto de desenvolvimento (Project Settings > API Keys). Dá acesso total aos dados: trate como senha |

### Configurar o login no Supabase

No painel do Supabase, em **Authentication > URL Configuration**:

- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: inclua `http://localhost:3000/**`

Sem isso, o link de recuperação de senha não volta para o aplicativo. Em produção, troque pelo endereço real do sistema.

## 6. Rodar

```bash
npm run dev
```

Abra `http://localhost:3000`.

## ✅ Checklist final

- [ ] A tela de login abriu no navegador
- [ ] `npm run lint` e `npm run typecheck` rodam sem erros

Se algum item falhar, veja os problemas comuns abaixo e o guia [07 — Quando travar](07-quando-travar.md).

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| Tela "aguardando liberação" após o login | Perfil ainda `pendente` |
| "Seu perfil não tem permissão" ao movimentar | Seu perfil não é gerente de estoque nem admin |
| Erro de conexão com o banco ao abrir qualquer tela | `SUPABASE_SECRET_KEY` ausente ou errada no `.env.local` |
| Cadastro falha com "Muitos e-mails enviados em pouco tempo" | Limite de envio de e-mails do Supabase. Aguarde cerca de 1 hora. A solução definitiva está em "Confirmação de e-mail no cadastro", em `docs/04-architecture/decisions.md` |
| O e-mail de recuperação de senha não chega | Limite de envio do Supabase, caixa de spam ou URL de retorno não configurada (veja "Configurar o login no Supabase") |
| O link de recuperação volta para o login em vez da tela de nova senha | **Redirect URLs** do Supabase sem o endereço do aplicativo |
| Listas vazias | Dados de teste não aplicados, ou perfil sem permissão de leitura |

## Montando um banco do zero

Só para quem cuida do banco. O mesmo procedimento monta o ambiente de produção, sem o passo 3.

1. Crie um projeto novo no Supabase.
2. No editor SQL, execute os arquivos de `backend/supabase/migrations/` na ordem dos nomes.
3. Execute `backend/supabase/seed.sql` para ter dados de teste.
4. Cadastre-se pelo aplicativo e, no painel do Supabase, altere seu cargo para `admin` na tabela `perfis`. Esse é o único ajuste manual, feito uma vez por ambiente.
