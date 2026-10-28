# Requisitos do produto (PRD)

Cada requisito tem um código. As tarefas das [[roteiro|etapas]] apontam para esses códigos.

## Requisitos funcionais

### Acesso
- **RF-01** Como usuário, quero entrar com e-mail e senha.
- **RF-02** Como novo usuário, fico com perfil "pendente" e sem acesso aos dados até ser liberado.
- **RF-03** Como administrador, quero definir o perfil de cada usuário.
- **RF-28** Como usuário, quero recuperar minha senha por e-mail quando esquecê-la.

### Catálogo
- **RF-04** Como gerente de estoque, quero cadastrar [[glossario#Categoria|categorias]] com a lista de atributos que elas usam e um estoque mínimo padrão.
- **RF-05** Como gerente de estoque, quero cadastrar [[glossario#Família|famílias]] dentro de uma categoria.
- **RF-06** Como gerente de estoque, quero cadastrar [[glossario#Variante|variantes]] de uma família, com código único, atributos, preço e imagem.
- **RF-07** Como gerente de estoque, quero desativar uma variante sem apagar seu histórico.
- **RF-08** Como qualquer perfil liberado, quero buscar um produto por código ou nome.

### Locais
- **RF-09** Como gerente de estoque, quero cadastrar [[glossario#Local|locais]] dentro de outros locais, com tipo e código de endereço.
- **RF-10** Como gerente de estoque, quero mover um local para dentro de outro e desativar um local vazio.
- **RF-11** Como qualquer perfil liberado, quero ver o caminho completo de um local (por exemplo, "Galpão 1 > Setor A > Módulo 03").

### Movimentações
- **RF-12** Como gerente de estoque, quero registrar a entrada de uma variante em um local.
- **RF-13** Como gerente de estoque, quero transferir uma quantidade de um local para outro.
- **RF-14** Como gerente de estoque, quero registrar uma saída avulsa com motivo.
- **RF-15** O sistema deve impedir saída ou transferência maior que o saldo do local de origem.
- **RF-16** Como qualquer perfil liberado, quero ver o histórico de [[glossario#Movimentação|movimentações]] de uma variante, com data, tipo, quantidade, locais e responsável.

### Consulta
- **RF-17** Como estoquista, quero digitar ou buscar um produto e ver em quais locais ele está e quanto há em cada um.
- **RF-18** Como estoquista, quero abrir um local e ver tudo que há nele.
- **RF-19** Como gerente, quero ver a lista de variantes com saldo igual ou abaixo do [[glossario#Estoque mínimo (limiar)|estoque mínimo]].

### Inventário
- **RF-20** Como gerente de estoque, quero abrir um [[glossario#Inventário|inventário]] de um local e receber a lista do que o sistema diz haver lá.
- **RF-21** Como gerente de estoque, quero informar a quantidade contada de cada item e incluir itens encontrados que não estavam na lista.
- **RF-22** Ao concluir o inventário, o sistema deve gerar um ajuste para cada diferença.

### Documentos de saída
- **RF-23** O sistema deve receber [[glossario#Documento de saída|documentos de saída]] com protocolo e itens.
- **RF-24** Como gerente de estoque, quero escanear o QR code de um documento e ver seus itens, com os locais onde cada um está disponível.
- **RF-25** Como gerente de estoque, quero indicar de qual local cada item sai e confirmar a [[glossario#Baixa|baixa]].
- **RF-26** O sistema deve impedir que um documento seja baixado mais de uma vez.

### Importação
- **RF-27** Como gerente de estoque, quero carregar o catálogo inicial a partir de uma planilha CSV.

## Requisitos não funcionais

| Código | Requisito | Como verificar |
|---|---|---|
| **RNF-01** Integridade | Uma movimentação grava histórico e saldo juntos, ou não grava nada | Teste: forçar erro no meio e conferir que nada mudou |
| **RNF-02** Concorrência | Duas saídas simultâneas do mesmo item não deixam o saldo errado nem negativo | Teste com duas sessões ao mesmo tempo |
| **RNF-03** Rastreabilidade | Toda movimentação guarda quem fez e quando; o histórico não pode ser editado | Conferir que nenhuma função do backend altera ou apaga uma movimentação |
| **RNF-04** Segurança | Cada perfil só lê e grava o que lhe cabe, e a regra vale no servidor, não só na tela | Testes por perfil em [[security-model]] |
| **RNF-05** Uso no celular | Todas as telas de consulta e de baixa funcionam em tela de 360 px de largura | Teste manual no celular |
| **RNF-06** Desempenho | Objetivo: busca de produto responde em até 1 segundo com 5 mil variantes, sem exigir índices extras no início | Medir com a carga inicial. Se passar de 1 segundo, criar os índices de [[banco-de-dados#Índices]] |
| **RNF-07** Portabilidade | Um ambiente novo é montado só com os arquivos de migração | Montar do zero seguindo `05-guides/01-setup-ambiente.md` |
| **RNF-08** Adaptabilidade | Tipos de local, categorias e atributos são dados, não código | Cadastrar uma categoria nova sem alterar o sistema |

## Pontos de atenção conforme o volume crescer

- **Histórico de movimentações**: cresce sem parar. Com centenas de milhares de linhas, as telas de histórico precisam de paginação e filtro por período desde o início.
- **Busca por nome**: a busca por trecho de texto fica lenta em catálogos grandes. Se passar de dezenas de milhares de variantes, adotar índice de texto do PostgreSQL.
- **Atributos em formato livre**: filtrar por atributo ("todas as variantes de 5000 K") exige índice próprio quando o catálogo crescer.
- **Árvore de locais**: o cálculo do caminho completo percorre a árvore inteira. É imperceptível com centenas de locais; com milhares, guardar o caminho pronto.
