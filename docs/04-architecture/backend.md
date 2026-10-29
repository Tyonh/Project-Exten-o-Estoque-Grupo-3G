# Backend

Este documento descreve como o servidor aplica as regras do sistema. É o trabalho da frente de backend. As regras de negócio que ele implementa estão em [[domain-model]]; as tabelas que ele usa estão em [[banco-de-dados]]. A decisão de concentrar as regras aqui está em [[decisions#ADR-15 Regras no backend e banco simples|ADR-15]].

## Visão geral

```
Tela (navegador)
   |  chama uma função de backend/src/
   v
Função do backend (roda no servidor do Next.js)
   |  1. confere a sessão e o perfil
   |  2. valida os dados recebidos
   |  3. executa a operação, gravando o saldo de forma condicional
   v
Banco PostgreSQL (Supabase)
```

- **O navegador nunca fala com o banco.** Toda leitura e toda gravação passam por uma função do backend.
- **O login é do Supabase.** A sessão fica em cookie e é validada no servidor a cada chamada. A recuperação de senha também: o link do e-mail volta para uma rota de `app/api/`, que troca o código por sessão.
- **O servidor acessa o banco com a chave secreta do Supabase** (`SUPABASE_SECRET_KEY`), que só existe no servidor. Ela ignora a segurança por linha, e é por isso que só o backend a usa ([[decisions#ADR-16 Backend acessa o banco pela chave secreta|ADR-16]]).
- **O banco é simples de propósito**: guarda os dados e recusa valores inválidos. Quem decide se uma operação pode acontecer é o backend.

## Organização do código

| Lugar | O que tem | Quem usa |
|---|---|---|
| `backend/src/<assunto>.ts` | As funções que as telas chamam, uma por operação ou consulta: `sessao.ts`, `usuarios.ts`, `catalogo.ts`, `locais.ts`, `movimentacoes.ts`, `consulta.ts`, `inventarios.ts`, `documentos.ts`. Rodam no servidor | Telas |
| `backend/src/servidor/` | Código interno do servidor: a conexão com o banco, a conferência de sessão e perfil e as regras usadas por mais de uma função | Só as funções de `backend/src/` |
| `backend/src/resultado.ts` | O formato de resposta das funções | Telas e backend |
| `backend/src/cargos.ts` | Os perfis e os grupos de permissão | Telas e backend |
| `frontend/proxy.ts` | Proteção de rotas: sem sessão, volta para o login | Next.js |
| `frontend/app/api/` | Rotas chamadas por outros sistemas, como o recebimento de documentos de saída, e a confirmação do link de recuperação de senha | Sistemas externos e o Supabase |

Uma tela nunca importa nada de `backend/src/servidor/` nem o cliente do banco.

O `proxy.ts` e as rotas de `app/api/` ficam em `frontend/` porque o Next.js só as reconhece dentro da pasta do aplicativo. Mesmo assim são da frente de backend: devem ser finas e apenas chamar as funções de `backend/src/`.

## Formato de resposta

Toda função devolve um destes dois formatos:

```ts
{ ok: true, dados: ... }      // deu certo
{ ok: false, erro: "..." }    // não deu; a mensagem está em português
```

A tela confere `ok` antes de usar `dados` e mostra `erro` ao usuário. Uma operação só é sucesso depois de o banco confirmar. Erro de permissão ou de regra nunca pode parecer sucesso.

## Permissões

Toda função começa conferindo quem está chamando. O perfil vem da sessão, nunca de um dado enviado pela tela.

| Grupo | Perfis | Pode |
|---|---|---|
| Consulta | estoquista, gerente, gerente de estoque, admin | Ler catálogo, locais, saldos, histórico, inventários e documentos |
| Operação | gerente de estoque, admin | Cadastrar e editar catálogo e locais, movimentar estoque, fazer inventário e dar baixa em documentos |
| Admin | admin | Criar acessos, transferir contas, desconectar, apagar contas sem histórico e alterar o perfil de outros usuários |

O perfil `pendente` e quem não tem sessão não leem nem gravam nada, exceto o próprio perfil. Quem ainda está com a senha provisória também não usa as funções de estoque: o backend só permite ler o próprio perfil e trocar a senha. A tabela completa por ação está em [[security-model]]. Os grupos ficam em `backend/src/cargos.ts`: mudar quem pode o quê é alterar esse arquivo.

## Como uma operação de estoque acontece

1. A função confere a sessão e se o perfil pode operar.
2. Valida os dados recebidos (quantidade maior que zero, origem e destino de acordo com o tipo).
3. Se há local de origem, lê o saldo daquela variante naquele local e confere se é suficiente. Se não for, devolve o erro e nada é gravado.
4. Grava o novo saldo da origem **de forma condicional**: só grava se o saldo ainda for o que foi lido. Se outra operação o mudou nesse meio tempo, a gravação não afeta nenhuma linha e a função devolve um erro pedindo para tentar de novo. É isso que impede duas operações simultâneas de deixarem o saldo errado.
5. Grava o saldo do destino, somando ao que já existe ou criando a linha.
6. Grava a linha em `movimentacoes`, com o usuário da sessão.
7. Se uma gravação falhar depois de outra já ter acontecido, tenta **desfazer** as anteriores (grava o saldo de volta) e registra o erro no servidor com `console.error`.

**Limite conhecido:** como não há transação, uma falha de rede entre duas gravações, somada a uma falha ao desfazer, pode deixar saldo e histórico diferentes. Como só o gerente de estoque movimenta (ADR-08), o risco é pequeno, e o inventário corrige a diferença.

Nenhuma tela soma ou subtrai saldo. Nenhuma outra parte do sistema grava em `saldos` ou em `movimentacoes`.

## Operações de estoque

| Função | Recebe | Devolve | Quem pode |
|---|---|---|---|
| `registrarMovimentacao` | variante, tipo, quantidade, local de origem, local de destino, justificativa | O identificador da movimentação | Operação |
| `confirmarSaidaDocumento` | documento e a lista de retiradas (variante, local, quantidade) | Nada | Operação |
| `abrirInventario` | local e observação | O identificador do inventário | Operação |
| `concluirInventario` | inventário | A quantidade de ajustes gerados | Operação |
| `cancelarInventario` | inventário | Nada | Operação |

### registrarMovimentacao

Serve para entrada, saída avulsa, transferência e ajuste manual.

- A quantidade é sempre maior que zero. O tipo e os locais dizem o sentido.
- `entrada` tem só destino; `saida` tem só origem; `transferencia` tem origem e destino diferentes; `ajuste` tem exatamente um dos dois.
- Saída e transferência não podem ser maiores que o saldo da origem.

### confirmarSaidaDocumento

Dá baixa em um documento de saída. As retiradas dizem de qual local sai cada item:

```json
[
  {"variante_id": "…", "local_id": "…", "quantidade": 8},
  {"variante_id": "…", "local_id": "…", "quantidade": 2}
]
```

- Trava o documento: duas confirmações ao mesmo tempo viram uma só.
- O documento precisa estar `pendente`.
- A soma das retiradas de cada variante precisa ser exatamente a quantidade pedida no documento. Não existe baixa parcial.
- Cada retirada vira uma movimentação de saída ligada ao documento, com a justificativa "Saída do documento" seguida do protocolo.
- Ao final, o documento fica `baixado`, com quem baixou e quando.
- Se faltar saldo para qualquer item, nada é baixado.

### abrirInventario

- Só pode existir um inventário `aberto` por local. A função confere se já existe um aberto para o local antes de criar.
- Copia para `inventario_itens` cada variante com saldo maior que zero naquele local, guardando o saldo do momento em `quantidade_sistema`.

### concluirInventario

- O inventário precisa estar `aberto`.
- Para cada item com quantidade contada, compara o contado com o saldo **do momento da conclusão**. Se contou mais, gera um ajuste de entrada no local; se contou menos, um ajuste de saída. Cada ajuste fica ligado ao inventário, com a justificativa "Ajuste de inventário".
- Itens sem quantidade contada são ignorados.
- Ao final, o inventário fica `concluido`, com quem concluiu e quando.

### cancelarInventario

- Só um inventário `aberto` pode ser cancelado. Nenhum ajuste é gerado.
- Um inventário `concluido` ou `cancelado` não volta a ser aberto.

## Regras de cadastro

| Situação | Regra |
|---|---|
| Criar um acesso | Só admin. O backend cria o login no Supabase com senha provisória e a linha em `perfis` com o perfil escolhido; se a linha falhar, apaga o login |
| Cadastro público | Não existe. A tela de login só entra em contas criadas pelo administrador |
| Primeiro acesso | A conta nasce com `senha_provisoria` no `user_metadata`. O layout manda para `/primeiro-acesso` e as funções de estoque recusam até a troca; a troca limpa a marca |
| Alterar o perfil de um usuário | Só admin. O admin não altera o próprio perfil |
| Transferir um acesso | Só admin. Troca nome e e-mail do titular, gera nova senha provisória e mantém o mesmo `id` e cargo. O histórico continua; a pessoa anterior perde o acesso. O admin não transfere o próprio acesso |
| Desconectar um acesso | Só admin. O cargo vira `pendente`; a sessão aberta perde o acesso na próxima chamada e o histórico é preservado |
| Apagar um acesso | Só admin. O backend confere se a conta é autora de movimentação, baixa de documento ou inventário; se for, recusa. Sem histórico, apaga o login e o perfil de vez. O admin não apaga a própria conta |
| Trocar a própria senha | Qualquer perfil ativo, em `/conta`, informando a senha atual. A nova senha precisa ter ao menos 6 caracteres e ser diferente da atual |
| Senha provisória tentando usar o estoque | Recusado no backend até a troca da senha |
| Código de variante, de local ou protocolo repetido | Recusado, com mensagem clara (o banco também recusa) |
| Colocar um local dentro de si mesmo ou de um descendente | Recusado |
| Desativar um local que ainda tem saldo | Recusado |
| Apagar uma variante com histórico | Recusado. A variante é desativada |
| Informar ou incluir quantidade contada em um inventário | Só enquanto o inventário está `aberto` |
| Alterar ou apagar uma movimentação | Não existe função para isso. Um erro se corrige com outra movimentação |

## Consultas calculadas

Algumas informações não estão prontas em uma tabela: o backend calcula.

| Consulta | O que devolve |
|---|---|
| Caminho do local | Cada local com o caminho completo ("Galpão 1 > Setor A > Módulo 03") e o nível na árvore |
| Estoque por variante | O saldo total de cada variante, o estoque mínimo que vale para ela e se está crítica |

O estoque mínimo que vale para uma variante é o `estoque_minimo` dela ou, se estiver vazio, o `limiar_padrao` da categoria. Uma variante é **crítica** quando está ativa, tem `monitorar` verdadeiro, o estoque mínimo é maior que zero e o saldo total é menor ou igual a ele.

Listas longas (histórico, catálogo) são sempre paginadas.

## Mensagens de erro

As mensagens são escritas no backend, em português, prontas para a tela mostrar. Exemplos:

- "Saldo insuficiente no local de origem (disponível: 3, solicitado: 8)."
- "Seu perfil não tem permissão para movimentar estoque."
- "Este documento já foi baixado e não pode ser baixado de novo."
- "As retiradas informadas não batem com os itens do documento."
- "Este local ainda tem mercadoria e não pode ser desativado."

Quando o banco recusa um dado (por exemplo, um código repetido), o backend traduz a recusa em uma mensagem dessas. O erro técnico vai para o registro do servidor, com `console.error`, e não para a tela.

## Proteções garantidas pelo backend

São o critério de aceite do backend. Cada linha precisa de um teste.

| Situação | Resultado |
|---|---|
| Saída ou transferência maior que o saldo | Erro "Saldo insuficiente", nada é gravado |
| Duas saídas simultâneas do mesmo item | O saldo final é o correto e nunca fica negativo |
| Falha no meio de uma operação | O backend tenta desfazer o que já gravou e registra o erro |
| Entrada com local de origem preenchido | Recusada |
| Baixar o mesmo documento duas vezes | Erro na segunda tentativa |
| Retirada diferente do pedido no documento | Erro, nada é baixado |
| Abrir dois inventários do mesmo local | Erro no segundo |
| Colocar um local dentro de um descendente | Erro |
| Desativar um local com mercadoria | Erro |
| Estoquista ou gerente tentando movimentar ou cadastrar | Erro de permissão |
| Perfil pendente ou visitante sem login chamando qualquer consulta | Não recebe nenhum dado |
| Conta com senha provisória chamando uma função de estoque | Erro pedindo para trocar a senha antes |
| Quem não é admin tentando alterar um perfil, transferir, desconectar ou apagar um acesso | Erro de permissão |
| Admin tentando transferir ou apagar a própria conta | Erro de permissão |
| Transferir para um e-mail que já pertence a outra conta | Erro, e o perfil volta ao titular anterior |
| Pessoa anterior tentando entrar depois da transferência | E-mail antigo e senha antiga não funcionam; a conta agora é do novo titular |
| Apagar uma conta que tem histórico | Erro explicando para usar Desconectar; nada é apagado |
| Troca de senha com a senha atual errada | Erro, e a senha não muda |

## Segredos

| Variável | Onde fica | Para que serve |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Servidor e navegador | Login |
| `SUPABASE_SECRET_KEY` | Só no servidor | Chave secreta do Supabase. Dá acesso total aos dados e ignora a segurança por linha: nunca vai para o navegador nem para o repositório |

Detalhes em [[security-model#Segredos]].
