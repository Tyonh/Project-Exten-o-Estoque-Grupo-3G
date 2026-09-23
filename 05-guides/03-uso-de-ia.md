# 03 — Uso de IA

Usar IA pra programar é o padrão do mercado hoje, e neste projeto ela é **incentivada**. O objetivo é acelerar a construção e liberar tempo pro que importa: entender o problema da empresa e entregar um sistema que funcione.

## Ferramenta recomendada

**Antigravity** — IDE baseada no VS Code, com o Gemini integrado e gratuita para universitários. A IA enxerga os arquivos do projeto, então consegue sugerir código no contexto certo. Instalação no [01 — Setup do ambiente](01-setup-ambiente.md).

Pode usar outras ferramentas também (ChatGPT, Claude, Copilot etc.). O que importa é o resultado seguir os padrões do projeto.

## Onde a IA mais ajuda

- **Gerar código repetitivo** — formulários, rotas CRUD, models, telas de listagem
- **Explicar código** — "o que esse arquivo faz?" antes de mexer nele
- **Corrigir erros** — cole a mensagem de erro e peça a causa e a solução
- **Criar dados de teste** — produtos, variantes e endereços fictícios pra popular o banco
- **Revisar antes da PR** — "revise essa mudança e aponte problemas"
- **Escrever a documentação** — rascunhar a explicação da PR, o glossário, comentários
- **Brainstorm de interface** — ideias de tela, fluxo de uso, textos de botões

## Dicas pra ter respostas melhores

- Diga **onde** está: "neste projeto, no arquivo X, que usa a stack Y..."
- Peça **seguindo o padrão**: "siga o mesmo padrão do arquivo `produtos`"
- Peça **em partes**: uma função por vez funciona melhor que "faz o sistema inteiro"
- Se a resposta não funcionou, **cole o erro** e peça pra corrigir

## Cuidados

- Nunca cole o conteúdo do `.env`, senhas ou tokens em nenhuma IA
- **Rode e teste** antes de abrir a PR. A IA erra, e é mais rápido perceber na sua máquina do que no review

## Prompts que funcionaram

Seção alimentada pela equipe. Achou um prompt bom? Adicione aqui via PR (branch `docs/`).

| Para quê | Prompt | Quem adicionou |
|----------|--------|----------------|
| Exemplo: criar dados de teste | "Gere 20 produtos fictícios de iluminação LED, cada um com 3 variantes de temperatura de cor (3000K, 4000K, 5000K), no formato JSON seguindo o model X" | — |
