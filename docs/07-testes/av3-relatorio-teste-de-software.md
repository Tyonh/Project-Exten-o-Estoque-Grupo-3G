---
titulo: Relatório de Teste de Software — Sistema de Catalogação e Endereçamento de Estoque
disciplina: Teste de Software (AV3) — UNIFAMETRO
docente: Kaio Mesquita
entrega: 26/11/2026 (PDF, por e-mail)
---

# 1. Capa

**CENTRO UNIVERSITÁRIO FAMETRO – UNIFAMETRO**
**CURSO DE ANÁLISE E DESENVOLVIMENTO DE SISTEMAS**

**ANTONIO GEOVANE PORTO CAMELO**

**TESTE DE SOFTWARE: RELATÓRIO TÉCNICO DE TESTES DO SISTEMA DE CATALOGAÇÃO E ENDEREÇAMENTO DE ESTOQUE**

**FORTALEZA · 2026**

# 2. Sumário

1. Capa
2. Sumário
3. Introdução (definição do problema)
4. Descrição da aplicação
5. Descrição do método de teste
6. Aplicação do método à aplicação
7. Tabela resumo com os erros encontrados e possíveis soluções
8. Requisitos mínimos para garantir que a aplicação funcione como deveria
9. Conclusão
10. Bibliografia utilizada

# 3. Introdução (definição do problema)

A empresa atendida pelo Projeto de Extensão, do setor de iluminação, guarda mais de três mil itens em cerca de oito galpões. Saber o que existe, em que quantidade e onde está dependia da memória dos funcionários; variações do mesmo produto eram registradas sob um único código e o saldo do sistema não batia com o físico. Para resolver isso, o projeto desenvolveu um sistema web de catalogação e endereçamento de estoque.

Um sistema de estoque que registra saldo errado perde a confiança de quem o usa. Por isso, este trabalho verifica se o sistema funciona como deveria e, quando não funciona, onde e por quê, aplicando cinco métodos de teste: funcional, estrutural, critérios de fluxo de dados, inspeção de software e baseado em modelo.

A aplicação escolhida (Etapa 1) é esse sistema, porque tem código-fonte acessível, regras de negócio documentadas e risco real de prejuízo. O código, a documentação e os testes estão disponíveis em: https://github.com/Tyonh/Project-Exten-o-Estoque-Grupo-3G.

# 4. Descrição da aplicação

## 4.1 Visão geral

O sistema responde a duas perguntas: o que a empresa tem, e em que quantidade, e onde cada item está. É construído com Next.js, React e Tailwind no front-end, funções de servidor em TypeScript no backend e Supabase/PostgreSQL no banco. As regras de negócio ficam no backend; as telas apenas chamam essas funções. Há quatro perfis de acesso: estoquista e gerente apenas consultam; gerente de estoque consulta e opera; administrador também libera o acesso de novos usuários.

## 4.2 Funcionamento esperado (Etapa 2)

Em condições normais e ideais, o sistema deve funcionar assim (cada regra recebe um código, usado nas seções seguintes):

1. O gerente de estoque cadastra os produtos (família e variantes, cada variante com código único) e os locais em árvore (galpão, setor, módulo). Um local só pode ser apagado se não tiver sublocais, saldo nem histórico (RN-08).
2. Toda alteração de quantidade é uma movimentação (entrada, saída, transferência ou ajuste) com quantidade inteira e maior que zero (RN-01), que nunca deixa o saldo negativo (RN-02), é gravada junto com o saldo (RN-03) e nunca é editada nem apagada.
3. Qualquer usuário autorizado consulta onde está um produto ou o que há em um local, pelo celular ou computador.
4. Um pedido emitido pelo sistema de documentos da empresa chega pela API como documento de saída, com protocolo único, e nasce pendente. Documento baixado ou cancelado não muda mais (RN-04).
5. Depois de validado na origem, o gerente de estoque lê o QR code do documento, indica de qual local sai cada item e confirma a baixa. O total retirado de cada item deve ser exatamente o pedido; se faltar saldo em qualquer item, nada é baixado (RN-05). Duas confirmações simultâneas resultam em uma só baixa (RN-06).
6. Periodicamente um local é contado em um inventário. Só pode haver um inventário aberto por local, e um inventário concluído ou cancelado não reabre (RN-07). Ao concluir, cada diferença vira um ajuste.
7. Só o gerente de estoque e o administrador alteram o estoque (RN-09), e o retorno após o login nunca leva para fora do sistema (RN-10).

# 5. Descrição do método de teste

Os cinco métodos foram escolhidos conforme o enunciado e aplicados com as técnicas descritas por Pezzè e Young (2008), Pressman e Maxim (2016) e Sommerville (2007).

| Método | Em que consiste | Técnicas usadas |
|---|---|---|
| Teste funcional (caixa-preta) | Testa o comportamento a partir da especificação, sem olhar o código | Partição em classes de equivalência, análise de valores-limite e tabela de decisão |
| Teste estrutural (caixa-branca) | Testa a partir da estrutura interna do código | Grafo de fluxo de controle, complexidade ciclomática V(G) e cobertura de linhas e ramos |
| Critérios de fluxo de dados | Acompanha cada variável desde onde recebe valor (definição) até onde é usada (uso) | Pares definição–uso e busca de anomalias |
| Inspeção de software | Leitura do código contra uma lista de verificação, sem executá-lo | Checklist de entradas, erros, concorrência, atomicidade e segurança |
| Teste baseado em modelo | Deriva os testes de um modelo do comportamento esperado | Máquinas de estados e modelo de referência do estoque |

# 6. Aplicação do método à aplicação

Os testes foram aplicados às regras de negócio do backend. O projeto já tinha 31 testes automatizados; nesta avaliação foram criados mais 26, no arquivo `backend/tests/av3-teste-de-software.test.ts`. Os 57 testes rodam com o comando `npm test` (Node.js 22, sem banco de dados) e todos passam. Cenários que dependem do banco foram verificados no roteiro de testes com banco real executado pela equipe do projeto em 29/10/2026.

## 6.1 Teste funcional

A entrada mais exposta do sistema é o documento recebido pela API, por vir de outro sistema. Suas entradas foram divididas em classes de equivalência:

| Campo | Classes válidas | Classes inválidas | Resultado |
|---|---|---|---|
| Corpo da requisição | Objeto JSON | `null`, lista, texto, número | Correto |
| `protocolo` | `PREFIXO-AAAAMMDD-XXXX` | Partes faltando; prefixo com mais de 12 caracteres | Falha: aceita data impossível (E-03) |
| `tipo_documento` | ORCAMENTO, AMOSTRA, PRODUCAO | Outro texto | Correto |
| `itens[].codigo` | 1 a 50 caracteres | Vazio; 51 ou mais | Falha: apaga espaço interno (E-04) e não soma códigos que só diferem em maiúsculas (E-05) |
| `itens[].quantidade` | Inteiro de 1 a 1.000.000 | 0, negativo, fracionário, acima do limite | Falha: aceita `true`, `"0x10"`, `"1e3"` e `[7]` (E-01); a soma de itens repetidos ultrapassa o limite (E-02) |

Os valores nos limites de cada faixa também foram testados:

| Entrada | Valores testados | Resultado |
|---|---|---|
| Quantidade do item | 0, 1, 1.000.000 e 1.000.001 | Correto |
| Itens por documento | 0, 1, 500 e 501 | Correto |
| Tamanho do código | 0, 50 e 51 caracteres | Correto |
| Contagem de inventário | −1, 0, 1.000.000 e 1.000.001 | Correto; porém texto em branco vira 0 (E-06) |
| Endereço de retorno após login | 300 e 301 caracteres | Correto; porém `/LOGIN` e `/login#x` não são reconhecidos como login (E-09) |

A confirmação de baixa (RN-05 e RN-06) foi verificada por tabela de decisão:

| Condição | R1 | R2 | R3 | R4 | R5 | R6 |
|---|---|---|---|---|---|---|
| Perfil pode operar? | Não | Sim | Sim | Sim | Sim | Sim |
| Documento pendente? | — | Não | Sim | Sim | Sim | Sim |
| Validado na origem? | — | — | Não | Sim | Sim | Sim |
| Soma retirada igual ao pedido? | — | — | — | Não | Sim | Sim |
| Saldo suficiente? | — | — | — | — | Não | Sim |
| Resultado esperado | Recusa | Recusa | Recusa | Recusa | Recusa, nada baixado | Baixa feita |

R4, R5 e R6 são cobertos pelos testes automáticos; R2 e R3, pelo roteiro com banco real; R1, pela inspeção. Todas as regras se comportaram como esperado.

## 6.2 Teste estrutural

Foi calculada a complexidade ciclomática, V(G) = número de decisões + 1, das funções centrais, a partir do grafo de fluxo de controle de cada uma:

| Função | Arquivo | V(G) |
|---|---|---|
| `sugerirRetiradas` | `retiradas.ts` | 6 |
| `validarRetiradas` | `retiradas.ts` | 11 |
| `validarPayloadDoGedoc` | `documento-payload.ts` | 14 |

As duas últimas passam de 10, valor a partir do qual uma função é considerada difícil de manter e testar, e por isso receberam mais casos de teste. A cobertura foi medida com o próprio Node.js:

| Arquivo | Linhas | Ramos |
|---|---|---|
| `retiradas.ts` | 98,35 % | 93,94 % |
| `documento-payload.ts` | 100 % | 87,23 % |
| `classificacao.ts` | 100 % | 96,43 % |
| Demais arquivos de regras | 100 % | 100 % |
| Total | 99,82 % | 92,28 % |

Com os testes criados nesta avaliação, a cobertura de ramos subiu de 88,73 % para 92,28 %. Um ramo continua sem teste: as linhas 85–86 de `retiradas.ts`, que recusam uma retirada sem local. O caso é possível na prática, pois a função que lê os dados da tela aceita local vazio (G-01).

## 6.3 Critérios de fluxo de dados

Na função `sugerirRetiradas`, foram exercitados todos os pares definição–uso da variável `restante`, que guarda quanto ainda falta retirar de um item:

| Definição | Usos | Resultado |
|---|---|---|
| d1: `restante = quantidade pedida` | cálculo da retirada; teste `restante <= 0`; teste `restante > 0` | Correto |
| d2: `restante -= quantidade retirada` | teste `restante <= 0` na volta seguinte; teste `restante > 0` ao sair do laço | Correto |

A análise encontrou duas anomalias. A primeira: o mapa de saldos é definido uma vez e usado a cada item, sem ser atualizado quando uma retirada consome saldo. Se a mesma variante aparecer em duas linhas do pedido, a função retira duas vezes do mesmo saldo (E-07). A segunda: quantidades vindas de fora entram no fluxo pela conversão `Number()`, que transforma `true`, listas e texto em branco em números válidos. Essa é a origem de E-01 e E-06.

## 6.4 Inspeção de software

Os arquivos de regras, a rota da API e as migrações do banco foram lidos com a lista de verificação abaixo:

| Item verificado | Parecer |
|---|---|
| Entradas externas são validadas em tipo, faixa e tamanho? | Parcial: tipo não é validado (E-01, E-06) |
| Operações com várias gravações são atômicas? | Não (E-12) |
| Operações simultâneas se protegem? | Sim na baixa; não ao desfazer uma gravação (E-13) |
| Erros de banco são tratados sem expor detalhes? | Sim |
| O segredo da API é comparado em tempo constante? | Sim |
| O tamanho da requisição é limitado? | Parcial: depende de um cabeçalho opcional (E-14) |
| A permissão é conferida no servidor? | Sim, em todas as operações |
| Todo estado previsto é alcançável? | Não: nenhuma função cancela um documento (E-15) |

O achado mais grave é E-12. A baixa marca o documento como baixado, atualiza os saldos e grava o histórico em passos separados, desfazendo manualmente o que já foi feito se algum passo falhar. Se o servidor cair no meio, o documento fica baixado sem histórico e com saldos parcialmente alterados, contrariando RN-03.

## 6.5 Teste baseado em modelo

O ciclo de vida do documento de saída foi modelado como máquina de estados, e cada transição, válida ou proibida, foi testada:

| Estado \ evento | Receber | Reenviar | Confirmar baixa | Cancelar |
|---|---|---|---|---|
| Inexistente | Vira pendente | — | — | — |
| Pendente | — | Atualiza | Vira baixado | Deveria virar cancelado: não existe (E-15) |
| Baixado | — | Recusa | Recusa | Recusa |
| Cancelado | — | Recusa | Recusa | — |

As transições existentes se comportaram como o modelo, inclusive a baixa simultânea, verificada no roteiro com banco real. O mesmo foi feito com o inventário:

| Estado \ evento | Abrir | Contar | Concluir | Cancelar |
|---|---|---|---|---|
| Sem inventário aberto | Vira aberto | — | — | — |
| Aberto | Recusa | Permanece aberto | Vira concluído | Vira cancelado |
| Concluído ou cancelado | Abre um novo | Recusa | Recusa | Recusa |

Também foi criado um modelo de referência do estoque em memória, que gerou 500 pedidos aleatórios e comparou o resultado esperado com o das funções de baixa. Não houve nenhuma divergência para variantes distintas; o único caso fora do modelo é a variante repetida (E-07).

# 7. Tabela resumo com os erros encontrados e possíveis soluções

Severidade alta indica risco de corromper o saldo; média, comportamento errado com entrada realista; baixa, falta de robustez. Cada erro de E-01 a E-11 tem um teste automático que o reproduz, no arquivo de testes da avaliação.

| Id | Erro | Método | Sev. | Solução possível |
|---|---|---|---|---|
| E-12 | Baixa não é atômica: queda no meio deixa documento baixado sem histórico | Inspeção | Alta | Executar a baixa em uma única transação no banco (função SQL) |
| E-01 | Quantidade aceita `true`, `"0x10"`, `"1e3"` e `[7]` | Funcional | Média | Aceitar apenas números inteiros de fato, sem conversão automática |
| E-05 | Códigos que só diferem em maiúsculas não são somados, e o registro falha | Funcional | Média | Somar os itens pelo código em maiúsculas |
| E-06 | Contagem em branco vira 0 e pode zerar o estoque do item | Funcional e fluxo de dados | Média | Recusar texto em branco e tipos não numéricos |
| E-13 | Desfazer uma gravação pode apagar alteração de outro usuário | Inspeção | Média | Desfazer só se o saldo não mudou; resolvido junto com E-12 |
| E-15 | Não é possível cancelar um documento | Baseado em modelo | Média | Criar a operação de cancelamento para documentos pendentes |
| E-02 | Soma de itens repetidos ultrapassa o limite de 1.000.000 | Funcional | Baixa | Conferir o limite depois de somar |
| E-03 | Data do protocolo não é validada | Funcional | Baixa | Validar a data como data real |
| E-04 | Espaço dentro do código é apagado sem aviso | Funcional | Baixa | Recusar código com espaço interno |
| E-07 | Variante repetida no pedido é retirada duas vezes do mesmo saldo | Fluxo de dados | Baixa | Agrupar os itens por variante antes de sugerir |
| E-08 | Saldo inválido (NaN) passa na validação da baixa | Estrutural | Baixa | Inverter a comparação para recusar valores inválidos |
| E-09 | `/LOGIN` e `/login#x` não são reconhecidos como a tela de login | Funcional | Baixa | Normalizar o endereço antes de comparar |
| E-10 | QR code de outro site é aceito se terminar com um protocolo | Funcional | Baixa | Conferir o endereço de origem do QR code |
| E-11 | Saldo negativo vindo do banco vira ajuste em vez de alerta | Funcional | Baixa | Tratar saldo negativo como erro |
| E-14 | Limite de tamanho da requisição depende de cabeçalho opcional | Inspeção | Baixa | Medir o tamanho do corpo ao lê-lo |
| G-01 | Ramo de retirada sem local nunca é testado | Estrutural | Baixa | Criar o teste correspondente |

No total, são 15 erros (1 de severidade alta, 5 médias e 9 baixas) e 1 lacuna de cobertura.

# 8. Requisitos mínimos para garantir que a aplicação funcione como deveria

1. O saldo nunca pode ficar negativo e deve ser sempre igual à soma das movimentações (RN-01, RN-02).
2. A baixa de um documento deve ser completa ou não acontecer, mesmo com queda do servidor (correção de E-12 e E-13).
3. Toda quantidade recebida de fora deve ser validada também quanto ao tipo (correção de E-01, E-02 e E-06).
4. Um documento baixado nunca muda, e um documento errado pode ser cancelado (correção de E-15).
5. Apenas o gerente de estoque e o administrador alteram o estoque, com a permissão conferida no servidor.
6. Os testes automáticos devem passar antes de cada alteração no código, mantendo a cobertura de ramos acima de 90 %.
7. Deve ser feito backup do banco antes de cargas de dados ou mudanças de estrutura.

# 9. Conclusão

A aplicação dos cinco métodos mostrou que as regras centrais do sistema estão corretas: os 57 testes passam, a cobertura de ramos chega a 92,28 %, o modelo de referência não apontou divergências e as proteções contra baixa duplicada e acesso indevido funcionam.

Os erros se concentram em dois pontos. O primeiro é a entrada de dados externos, em que a conversão automática de tipos aceita valores que não são números e, no inventário, pode zerar o estoque de um item. O segundo, e mais grave, é a falta de atomicidade na baixa de documentos, que deve ser corrigida antes do uso diário.

Cada método encontrou erros que os outros não encontrariam: o funcional achou a conversão de tipos; o fluxo de dados, a retirada dupla do mesmo saldo; a inspeção, a falta de transação; e o modelo, o cancelamento inexistente. Isso mostra que os métodos se complementam. Como limitação, os testes automáticos cobrem o backend, não as telas, e os erros E-05 e E-14 foram identificados pela leitura do código.

# 10. Bibliografia utilizada
