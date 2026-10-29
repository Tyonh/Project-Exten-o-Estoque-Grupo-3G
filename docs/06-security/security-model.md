# Modelo de segurança

## Perfis

| Perfil | Código no banco | Quem é |
|---|---|---|
| Pendente | `pendente` | Acesso encerrado pelo administrador ou conta antiga ainda não liberada |
| Estoquista | `estoquista` | Trabalha no galpão e consulta |
| Gerente | `gerente` | Acompanha os números |
| Gerente de Estoque | `gerente_estoque` | Responsável pela operação |
| Administrador | `admin` | Cuida dos acessos |

## O que cada perfil pode fazer

| Ação | Pendente | Estoquista | Gerente | Gerente de Estoque | Admin |
|---|---|---|---|---|---|
| Consultar catálogo, locais, saldos e histórico | não | sim | sim | sim | sim |
| Cadastrar e editar catálogo e locais | não | não | não | sim | sim |
| Registrar entrada, saída e transferência | não | não | não | sim | sim |
| Confirmar baixa de documento | não | não | não | sim | sim |
| Abrir e concluir inventário | não | não | não | sim | sim |
| Criar acessos, transferir contas, desconectar, apagar contas sem histórico e alterar o perfil de usuários | não | não | não | não | sim |
| Trocar a própria senha dentro da conta | não | sim | sim | sim | sim |

## Onde a regra é aplicada

A permissão é verificada em **três lugares**:

1. **Na tela**: botões e páginas que o perfil não pode usar não aparecem. Isso é conforto, não segurança.
2. **No backend**: toda função confere a sessão e o perfil antes de ler ou gravar qualquer coisa. Esta é a proteção de verdade: vale mesmo que alguém contorne a tela, porque a tela não tem outro caminho até os dados ([[backend#Permissões]]).
3. **No banco**: a segurança por linha fica ativada sem nenhuma política. Quem tentar acessar as tabelas direto com a chave pública do Supabase não lê nem grava nada ([[banco-de-dados#Acesso]]).

As permissões estão concentradas em três funções de `backend/src/cargos.ts`. Mudar quem pode o quê é alterar uma delas:

| Função | Verdadeira para |
|---|---|
| `podeConsultar` | estoquista, gerente, gerente de estoque, admin |
| `podeOperar` | gerente de estoque, admin |
| `eAdmin` | admin |

## Autenticação

- Login por e-mail e senha, feito pelo Supabase.
- A sessão fica em cookie e é validada no servidor a cada chamada.
- **Não existe cadastro público.** O administrador cria o acesso em `/usuarios`, já com o perfil escolhido. O backend cria o login no Supabase e a linha em `perfis`; se a segunda gravação falhar, apaga o login criado.
- A senha provisória é gerada pelo servidor e mostrada uma única vez ao administrador. Ela não é guardada no banco nem no repositório.
- A conta criada pelo administrador nasce com a marca `senha_provisoria` no `user_metadata` do Supabase. Enquanto a marca estiver verdadeira, o layout manda a pessoa para `/primeiro-acesso` e o backend recusa as outras operações. A primeira troca de senha limpa a marca. Ela é uma marca de autenticação, não uma coluna de negócio de `perfis`.
- Cada pessoa troca a própria senha em `/conta`, informando a senha atual. O backend confere a senha atual antes de gravar a nova e encerra as outras sessões abertas.
- O perfil `pendente` serve para encerrar um acesso ou para contas antigas ainda não liberadas. Quem está `pendente` não lê nem grava dados.
- **Desconectar** um acesso significa mudar o perfil para `pendente`. A pessoa perde o acesso na próxima chamada ao backend, mas o histórico é preservado. Para liberar de novo, o administrador escolhe outro perfil.
- **Transferir** uma conta troca o nome e o e-mail do titular, gera uma nova senha provisória e mantém o mesmo `id` de `perfis` e o mesmo cargo. Por isso, movimentações, documentos e inventários continuam ligados à conta. A pessoa anterior perde o acesso: o e-mail antigo deixa de entrar, a senha é trocada e a nova pessoa é obrigada a escolher outra senha no primeiro acesso.
- **Apagar** uma conta remove o login e o perfil de vez. Só é permitido quando a conta não é autora de nenhuma movimentação, baixa de documento ou inventário; se houver histórico, o backend recusa e orienta a usar Desconectar. Não existe desfazer.
- O administrador não altera o próprio perfil, não desconecta o próprio acesso e não apaga a própria conta, para o sistema nunca ficar sem administrador.
- O autor de uma movimentação é sempre o usuário da sessão. Nenhuma tela envia "quem fez".
- Recuperação de senha por e-mail: o link temporário volta para `frontend/app/api/auth/confirmar-recuperacao`, que abre uma sessão só para a troca. A tela de nova senha encerra as sessões abertas ao salvar.
- O pedido de recuperação responde sempre de forma neutra, para não revelar quais e-mails estão cadastrados.
- No painel do Supabase, o cadastro público também fica desativado. A tela de login não tem cadastro, e o backend não expõe função de cadastro.

## Segredos

| Segredo | Onde pode ficar | Observação |
|---|---|---|
| URL do projeto e chave pública do Supabase | `.env.local` e navegador | Servem só para o login. O banco não aceita leitura nem gravação com a chave pública |
| Chave secreta do Supabase (`SUPABASE_SECRET_KEY`) | Somente `.env.local`, usada só no servidor | Dá acesso total aos dados e ignora a segurança por linha. Nunca vai para o navegador nem para o repositório |

Regras:
- `.env.local` está no `.gitignore` e nunca é enviado ao repositório.
- Nenhum arquivo do repositório contém chave escrita no código, nem em scripts de teste.
- Variáveis que começam com `NEXT_PUBLIC_` vão para o navegador. `SUPABASE_SECRET_KEY` nunca recebe esse prefixo.
- A chave secreta que a equipe usa é a do projeto de **desenvolvimento**. A de produção fica só no servidor da empresa.
- Se uma chave ou a senha do banco vazar, ela é trocada no painel do Supabase na mesma hora.

## Dados pessoais (LGPD)

O sistema guarda poucos dados pessoais: nome e e-mail dos usuários, e o nome do cliente e do solicitante nos documentos de saída. Esses dados são usados só para identificar quem fez o quê e para quem a mercadoria saiu. Não há dado sensível.

## Como testar

1. Para cada perfil, entrar no sistema e conferir a tabela de permissões acima.
2. Repetir a tentativa **chamando a função do backend**, não só pela tela: por exemplo, `registrarMovimentacao` chamada com a sessão de um estoquista deve devolver erro de permissão.
3. Criar um acesso pelo administrador, entrar com a senha provisória e conferir se o sistema manda para `/primeiro-acesso` antes de mostrar qualquer tela.
4. Trocar a senha em `/conta` e conferir se a senha antiga deixa de entrar e se as outras sessões caíram.
5. Desconectar um acesso e conferir se a pessoa cai na tela `pendente`; liberar de novo escolhendo um perfil.
6. Transferir uma conta para outro nome e e-mail e conferir se o histórico continua ligado e se a pessoa anterior não entra mais.
7. Apagar uma conta sem histórico e conferir que ela sumiu da lista e não entra mais; tentar apagar uma conta com histórico e conferir a recusa.
8. Tentar ler uma tabela direto, com a chave pública do Supabase: não deve voltar nenhuma linha.

A lista completa de proteções está em [[backend#Proteções garantidas pelo backend]].
