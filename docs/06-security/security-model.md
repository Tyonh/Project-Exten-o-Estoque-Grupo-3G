# Modelo de segurança

## Perfis

| Perfil | Código no banco | Quem é |
|---|---|---|
| Pendente | `pendente` | Acabou de se cadastrar; ainda não foi liberado |
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
| Alterar o perfil de usuários | não | não | não | não | sim |

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
- Todo cadastro novo recebe perfil `pendente`, criado pelo backend.
- O autor de uma movimentação é sempre o usuário da sessão. Nenhuma tela envia "quem fez".
- Recuperação de senha por e-mail: o link temporário volta para `frontend/app/api/auth/confirmar-recuperacao`, que abre uma sessão só para a troca. A tela de nova senha encerra as sessões abertas ao salvar.
- O pedido de recuperação responde sempre de forma neutra, para não revelar quais e-mails estão cadastrados.

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
3. Tentar ler uma tabela direto, com a chave pública do Supabase: não deve voltar nenhuma linha.

A lista completa de proteções está em [[backend#Proteções garantidas pelo backend]].
