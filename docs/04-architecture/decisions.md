# Decisões de arquitetura (ADRs)

Cada decisão registra o contexto, o que foi escolhido e o que isso custa. Decisões não são apagadas: se uma mudar, registra-se uma nova que substitui a anterior.

## ADR-01 Supabase como banco, login e armazenamento
- **Contexto**: a equipe é pequena, com experiências diferentes, e o prazo é curto.
- **Decisão**: usar Supabase (PostgreSQL, autenticação e armazenamento de imagens).
- **Ganho**: login e banco prontos; regras de acesso no próprio banco.
- **Custo**: dependência de um fornecedor. Atenuado porque a estrutura é PostgreSQL comum, portável.

## ADR-02 Catálogo em dois níveis com atributos configuráveis
- **Contexto**: o mesmo modelo de produto existe em várias potências, cores e tensões, e cada linha de produto tem características próprias.
- **Decisão**: [[glossario#Família|família]] e [[glossario#Variante|variante]]; os atributos são definidos na categoria e guardados na variante em formato flexível.
- **Ganho**: o saldo é sempre de um item real; categorias novas não exigem mudança no banco.
- **Custo**: o banco não valida o conteúdo dos atributos; a validação fica na tela. Filtrar por atributo exige índice próprio quando o catálogo crescer.

## ADR-03 Regras de estoque dentro do banco
- **Contexto**: se a tela ler o saldo, calcular e gravar em passos separados, duas pessoas ao mesmo tempo podem sobrescrever uma à outra, e uma falha no meio deixa a operação pela metade.
- **Decisão**: toda alteração de estoque passa por funções do banco, em transação, com trava na linha de saldo.
- **Ganho**: as regras valem para qualquer tela ou integração; não existe operação pela metade.
- **Custo**: parte da lógica fica em SQL, que menos gente da equipe domina. Atenuado com a documentação em [[banco-de-dados]].
- **Situação**: substituída pelo [[#ADR-15 Regras no backend e banco simples|ADR-15]]. As regras continuam valendo, mas quem as executa é o backend, e a garantia de transação foi alterada pelo [[#ADR-16 Backend acessa o banco pela chave secreta|ADR-16]]

## ADR-04 Saldo derivado do histórico
- **Contexto**: um saldo digitável não explica como chegou àquele valor.
- **Decisão**: o histórico de [[glossario#Movimentação|movimentações]] é permanente; a tabela `saldos` só é escrita pelas funções. O saldo pode ser recalculado a partir do histórico a qualquer momento.
- **Ganho**: rastreabilidade completa e consulta rápida.
- **Custo**: correções exigem uma nova movimentação, nunca edição.

## ADR-05 Locais em árvore livre
- **Contexto**: o estoque será organizado aos poucos, e outras empresas usam outra nomenclatura.
- **Decisão**: cada [[glossario#Local|local]] aponta para o local que o contém e tem um tipo de texto livre. Qualquer nível pode guardar mercadoria.
- **Ganho**: serve a qualquer organização física; permite começar simples e detalhar depois.
- **Custo**: relatórios "por galpão" precisam percorrer a árvore.

## ADR-06 Estoque contado em caixas
- **Contexto**: a mercadoria é armazenada e movimentada em caixas.
- **Decisão**: a quantidade é um número inteiro de caixas.
- **Custo**: venda de unidade avulsa não é representada. Se virar necessidade, registrar a unidade na variante em uma nova decisão.

## ADR-07 Documento de saída como módulo genérico
- **Contexto**: os pedidos de retirada nascem em outro sistema da empresa.
- **Decisão**: o estoque recebe documentos com protocolo e itens, sem depender de como o sistema emissor funciona. A baixa é confirmada por QR code.
- **Ganho**: qualquer sistema emissor pode ser conectado.
- **Custo**: o emissor precisa enviar o código da variante exatamente como está no catálogo.

## ADR-08 Baixa sempre pelo gerente de estoque
- **Contexto**: era preciso definir quem confirma a saída de mercadoria.
- **Decisão**: toda saída, avulsa ou por documento, é confirmada pelo perfil Gerente de Estoque. O Estoquista só consulta.
- **Ganho**: um único responsável por tudo que sai.
- **Custo**: o gerente de estoque vira ponto único da operação. As permissões estão concentradas em um único lugar (desde o [[#ADR-15 Regras no backend e banco simples|ADR-15]], a função `podeOperar` de `backend/src/cargos.ts`), então mudar a regra depois é uma alteração pequena.

## ADR-09 Uma empresa por instalação
- **Contexto**: o sistema deve servir a outras empresas, mas isolar várias empresas no mesmo banco afeta todas as tabelas e regras.
- **Decisão**: cada instalação atende uma empresa. A adaptação a outra empresa vem de dados configuráveis, não de separação por empresa.
- **Custo**: atender várias empresas juntas exigirá uma migração futura. Registrado em [[escopo#Fases futuras]].

## ADR-10 Estrutura do banco versionada em migrações
- **Contexto**: o sistema será desenvolvido em um ambiente e depois montado no servidor da empresa.
- **Decisão**: toda a estrutura fica em arquivos SQL em `backend/supabase/migrations/`, aplicados em ordem.
- **Ganho**: qualquer ambiente é reproduzível; toda mudança passa por revisão.
- **Custo**: ninguém altera o banco pelo painel.

## ADR-11 Sem modo offline
- **Contexto**: há Wi-Fi nos galpões.
- **Decisão**: o sistema exige conexão.
- **Custo**: sem rede, não há consulta nem baixa.

## ADR-12 Repositório dividido em frontend e backend
- **Contexto**: a equipe entende melhor o projeto quando cada parte tem sua pasta, mas o Next.js junta telas e rotas de servidor no mesmo projeto, e as regras ficam em funções de servidor dentro do próprio aplicativo ([[#ADR-15 Regras no backend e banco simples|ADR-15]]).
- **Decisão**: `frontend/` guarda as telas e a estrutura do aplicativo Next.js; `backend/src/` guarda o código do backend, que o aplicativo importa como um pacote (`@estoque/backend`); `backend/supabase/` guarda as migrações e os dados de teste do banco. Não existe servidor de API separado: é um aplicativo só.
- **Ganho**: cada pessoa sabe onde mexer, sem mudar a arquitetura.
- **Custo**: `proxy.ts` e `app/api/`, da frente de backend, continuam em `frontend/` porque o Next.js só as reconhece ali. O projeto passa a ser um conjunto de pacotes npm (workspaces), com os comandos `npm` rodando na raiz.
- **Situação**: a primeira versão deixava o backend em `backend/src/`. Foi movido para `backend/src/` para as pastas corresponderem ao conteúdo.

## ADR-13 Divisão do trabalho por frente
- **Contexto**: a equipe tem 7 integrantes divididos em três frentes, cada uma com um líder mais experiente na área: backend (2), banco de dados (3) e front-end (2). A frente de backend, a mais experiente, fica com a parte mais complexa; a de banco, com a mais simples. Complementa o [[#ADR-12 Repositório dividido em frontend e backend|ADR-12]].
- **Decisão**:

| Frente | Integrantes | Cuida de |
|---|---|---|
| Backend | Antonio Geovane Porto Camelo (líder) e Joel Caleb Coelho dos Santos | Todas as regras e operações do sistema ([[backend]]): as funções de `backend/src/`, a conexão com o banco, a conferência de perfil, `proxy.ts` (sessão e proteção de rotas) e `app/api/` (rotas para outros sistemas). Escreve a especificação do banco, valida o banco entregue e testa as regras |
| Banco de dados | Lucas Amaro Oliveira (líder), Lucas Soares Saraiva e Felipe Cauã Pereira Ladislau Costa | `backend/supabase/`: cria as tabelas e as restrições da especificação em [[banco-de-dados]] (os índices são opcionais), ativa a segurança por linha, cria os dados de teste e testa o que o banco precisa recusar. Não escreve funções, gatilhos nem regras por perfil |
| Front-end | Eduardo Martins da Silva do Carmo (líder) e Antonio Sergio Freitas Rodrigues Filho | Telas e componentes em `frontend/app/` e `frontend/components/`, incluindo as telas funcionais, a identidade visual e a tipografia |

- **Ordem das fases**: (1) o backend estrutura a base do aplicativo e especifica o banco; (2) a frente de banco constrói o banco; (3) o backend valida o banco, liga o servidor a ele e escreve as funções de cada etapa; (4) o front-end constrói as telas sobre essas funções e aplica o design. O plano de ação entregue à faculdade descreve as mesmas fases.
- **Ganho**: cada frente sabe onde mexer e quem revisa cada parte.
- **Custo**: as frentes dependem umas das outras (o banco precisa estar pronto antes da integração).

## ADR-14 Telas acessam os dados pelas funções de lib
- **Contexto**: com uma frente de backend e outra de front-end no mesmo aplicativo Next.js, era preciso definir onde termina o trabalho de uma e começa o da outra. Se cada tela escrevesse a própria consulta ao banco, as regras ficariam espalhadas e as duas frentes mexeriam nos mesmos arquivos.
- **Decisão**: as telas só chamam as funções de `backend/src/`, que rodam no servidor. Há um arquivo por assunto (`sessao.ts`, `catalogo.ts`, `locais.ts`...), escrito pela frente de backend. As telas nunca falam com o banco nem importam nada de `backend/src/servidor/`. Toda função devolve `{ ok: true, dados }` ou `{ ok: false, erro }`, com a mensagem de erro em português, pronta para a tela mostrar.
- **Ganho**: fronteira clara entre as frentes; nomes de tabelas e colunas ficam em um lugar só; a mensagem de erro chega à tela sempre do mesmo jeito.
- **Custo**: o front-end depende de o backend entregar as funções antes. Atenuado com o backend trabalhando uma etapa à frente ([[roteiro#Trabalho por frente]]).

## ADR-15 Regras no backend e banco simples
- **Contexto**: o [[#ADR-03 Regras de estoque dentro do banco|ADR-03]] colocava as regras em funções SQL, com regras de acesso por linha e gatilhos. Com a divisão da equipe ([[#ADR-13 Divisão do trabalho por frente|ADR-13]]), isso deixava a parte mais difícil do sistema com a frente de banco de dados e a mais simples com a frente de backend, que é a mais experiente. Um atraso no banco pararia o projeto inteiro.
- **Decisão**:
  - O **banco** fica simples: tabelas, ligações entre elas, valores únicos e limites simples (quantidade maior que zero, saldo nunca negativo). Não tem funções, gatilhos, visões nem regras por perfil. A segurança por linha fica ativada sem nenhuma política, de modo que o navegador não lê nem grava nada direto ([[banco-de-dados]]).
  - O **backend** concentra todas as regras: confere a sessão e o perfil, valida os dados e executa cada operação em uma transação, com trava na linha de saldo. Usa uma conexão direta do servidor com o banco. Toda leitura e toda gravação passam por ele ([[backend]]).
  - Substitui o [[#ADR-03 Regras de estoque dentro do banco|ADR-03]].
- **Ganho**: o peso técnico fica com a frente mais experiente; a frente de banco tem uma entrega curta e objetiva; as regras ficam em TypeScript, que toda a equipe lê; continua não existindo operação pela metade nem saldo errado por duas operações simultâneas.
- **Situação**: o acesso ao banco e a garantia de atomicidade foram alterados pelo [[#ADR-16 Backend acessa o banco pela chave secreta|ADR-16]].
- **Custo**: as regras valem para tudo que passa pelo backend, e não mais para qualquer acesso ao banco. Quem acessar o banco por fora do sistema encontra só os limites simples. O servidor passa a guardar um segredo a mais, a conexão com o banco (`DATABASE_URL`), que dá acesso total aos dados.

## ADR-16 Backend acessa o banco pela chave secreta
- **Contexto**: o [[#ADR-15 Regras no backend e banco simples|ADR-15]] previa uma conexão direta com o banco, com a senha do banco (`DATABASE_URL`), para gravar saldo e histórico em uma transação. O projeto Supabase pertence a quem criou o banco e a senha não é compartilhada com a frente de backend. Além disso, só o gerente de estoque movimenta estoque ([[#ADR-08 Baixa sempre pelo gerente de estoque|ADR-08]]), então o risco de duas operações simultâneas é mínimo.
- **Decisão**: o backend usa o cliente `supabase-js` com a chave secreta (`SUPABASE_SECRET_KEY`), que só existe no servidor e ignora a segurança por linha. Não há transação: o saldo é gravado de forma condicional (só se não mudou desde a leitura), e, se uma gravação falhar depois de outra, o backend tenta desfazer e registra o erro ([[backend#Como uma operação de estoque acontece]]).
- **Ganho**: não depende da senha do banco; usa o mesmo cliente do login; é simples de configurar; o saldo continua protegido contra duas operações simultâneas.
- **Custo**: perde a garantia de "tudo ou nada". Uma falha de rede entre duas gravações, somada a uma falha ao desfazer, pode deixar saldo e histórico diferentes. O risco é pequeno com um único operador, e o inventário corrige a diferença. Se o número de operadores ou o volume crescer, volta-se à conexão direta com transação, em um novo ADR.

## ADR-17 Acessos criados pelo administrador
- **Contexto**: o cadastro público dependia do envio de e-mails de confirmação do Supabase, que tem limite no plano gratuito. Também permitia que qualquer pessoa criasse uma conta `pendente`. O produto precisa que só pessoas autorizadas entrem e que cada uma já tenha o perfil certo.
- **Decisão**: não existe cadastro público. O administrador cria o acesso em `/usuarios` com nome, e-mail e perfil. O backend cria o login no Supabase com uma senha provisória gerada no servidor, marca `senha_provisoria` no `user_metadata` e grava a linha em `perfis` com o perfil escolhido; se a segunda gravação falhar, apaga o login. A senha é mostrada uma única vez ao administrador e não é guardada. No primeiro acesso, a pessoa precisa trocar a senha em `/primeiro-acesso` antes de usar as telas; depois pode trocar de novo em `/conta`, sempre informando a senha atual. Transferir uma conta troca o nome e o e-mail do titular e gera uma nova senha provisória, mas mantém o mesmo `id` de `perfis`, o mesmo cargo e o histórico. É o caminho para substituir uma pessoa demitida sem perder movimentações, documentos ou inventários; a pessoa anterior perde o acesso. Desconectar um acesso significa mudar o cargo para `pendente`, sem apagar o histórico; o administrador pode liberar de novo escolhendo um perfil. Apagar uma conta remove o login e o perfil de vez, mas só quando ela ainda não é autora de movimentação, baixa de documento ou inventário; com histórico, o backend recusa e orienta a usar Desconectar. O administrador não altera o próprio perfil, não transfere nem desconecta o próprio acesso e não apaga a própria conta.
- **Ganho**: não depende de e-mail para criar contas; não existem contas pendentes criadas por estranhos; o perfil já nasce correto; a senha provisória não vira senha definitiva sem a pessoa escolher uma nova; o sistema não perde o último administrador.
- **Custo**: o administrador precisa criar cada conta e entregar a senha provisória. A recuperação de senha continua dependendo do e-mail do Supabase. Se o único administrador perder a senha, a recuperação precisa ser feita pelo painel do Supabase.
- **Situação**: implementado em `backend/src/usuarios.ts`, `backend/src/sessao.ts` e nas telas `frontend/app/(app)/usuarios`, `frontend/app/(app)/conta` e `frontend/app/primeiro-acesso`. O cadastro público também deve ficar desativado no painel do Supabase.

## ADR-18 Schema `estoque` no projeto Supabase da empresa
- **Contexto**: o banco foi criado no projeto Supabase de uma conta pessoal, só para dar partida. O sistema vai rodar no projeto principal da empresa, que já é usado pelo GEDOC (`public.perfis` com cargos `admin` e `vendedor`, `public.documentos`) e guarda as tabelas do estoque antigo. Nomes como `perfis` e `movimentacoes` colidiriam, e misturar tudo em `public` deixaria difícil saber o que é de cada sistema.
- **Decisão**: todas as tabelas, tipos e índices do estoque ficam no schema `estoque` (migração `20261030090000_schema_estoque.sql`). O backend aponta o `supabase-js` para esse schema em um só lugar (`backend/src/servidor/banco.ts`), então `from("variantes")` lê `estoque.variantes`. O login (`auth.users`) é compartilhado com o GEDOC; `estoque.perfis` guarda o cargo da pessoa no estoque, separado do cargo dela no GEDOC. Só `service_role` tem permissão no schema; `anon` e `authenticated` não têm permissão nem política. O schema precisa ser exposto na API do Supabase (Exposed schemas).
- **Ganho**: nada colide com o GEDOC nem com o estoque antigo; o estoque pode ser inspecionado, copiado ou removido como um bloco; o mesmo login serve aos dois sistemas.
- **Custo**: o schema precisa ser exposto no painel do Supabase uma vez; o SQL escrito à mão (seed, catálogo) precisa de `set local search_path = estoque, public;` ou do prefixo `estoque.`. Quem já existe no GEDOC não tem linha em `estoque.perfis` até o administrador do estoque liberar o acesso.

## Pendentes

### Publicação em container na VPS
- **Contexto**: o aplicativo será publicado como container em uma VPS. A configuração antiga de publicação (PM2) foi removida na [[etapa-0-preparacao|Etapa 0]] por não estar documentada.
- **Opções**: definir na reta final do projeto, ou preparar o container antes, assim que o ambiente de produção estiver definido.
- **Recomendação**: registrar a decisão como novo ADR antes da primeira publicação.
