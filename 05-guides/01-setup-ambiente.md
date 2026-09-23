# 01 — Setup do ambiente

Objetivo: sair do zero até o sistema rodando na sua máquina em uns 10 minutos.

> ⚠️ Os comandos marcados com `<!-- DEFINIR -->` dependem da stack, que ainda está sendo decidida. Esta página será atualizada quando isso acontecer.

## 1. Contas

- [ ] Criar conta no [GitHub](https://github.com) (use seu nome real ou algo reconhecível no perfil)
- [ ] Passar seu usuário do GitHub pro responsável pelo repositório
- [ ] Aceitar o convite do repositório (chega por e-mail)

## 2. Ferramentas

- [ ] **Git** — https://git-scm.com/downloads
- [ ] **Docker Desktop** — https://www.docker.com/products/docker-desktop (roda o banco de dados sem precisar instalar nada na mão)
- [ ] **Antigravity** — IDE baseada no VS Code, com Gemini integrado e gratuita para universitários. <!-- DEFINIR: link oficial e passo a passo da ativação com e-mail da faculdade -->
- [ ] <!-- DEFINIR: runtime da stack (Node, Python, etc.) e versão -->

> O Antigravity é a IDE **recomendada**, mas não é obrigatória. As regras de formatação ficam no próprio repositório (`.editorconfig` e config do linter), então quem usar VS Code ou outra IDE segue o mesmo padrão.

## 3. Configurar o Git (só na primeira vez)

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email-do-github@exemplo.com"
```

Use o mesmo e-mail da conta do GitHub, senão seus commits não aparecem no seu perfil.

## 4. Clonar o projeto

```bash
git clone <!-- DEFINIR: URL do repositório -->
cd <!-- DEFINIR: nome da pasta -->
```

## 5. Variáveis de ambiente

```bash
cp .env.example .env
```

Peça os valores que faltarem no grupo da equipe. Nunca commite o `.env`.

## 6. Subir o banco

```bash
docker compose up -d
```

## 7. Rodar o back e o front

```bash
# <!-- DEFINIR: comandos de instalação de dependências e execução -->
```

## ✅ Checklist final

- [ ] Abri o front no navegador e a tela inicial apareceu
- [ ] A API respondeu em <!-- DEFINIR: rota de teste -->
- [ ] O Docker mostra o container do banco rodando

Se algum item falhar, vá direto pro guia [07 — Quando travar](07-quando-travar.md).
