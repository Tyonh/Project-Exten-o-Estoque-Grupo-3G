-- Dados de teste do ambiente de desenvolvimento.
--
-- Como aplicar: abra o editor SQL do Supabase, cole este arquivo inteiro e
-- execute. Este arquivo NÃO é aplicado automaticamente.
--
-- Pode ser executado mais de uma vez: as linhas são atualizadas pelo nome ou
-- pelo código, sem duplicar.
--
-- O que ele cria (mínimo da especificação em docs/04-architecture/banco-de-dados.md):
--   - 2 categorias com a lista de atributos
--   - 3 famílias
--   - 8 variantes
--   - 6 locais (1 galpão, 2 setores e 3 módulos)
--
-- O que ele NÃO cria: saldos, movimentações, documentos e inventários. Esses
-- dados nascem das operações do backend, nunca do seed.

begin;
set local search_path = estoque, public;

-- Categorias -----------------------------------------------------------------

insert into categorias (nome, limiar_padrao, atributos) values
  (
    'Refletor',
    20,
    '[
      {"chave": "potencia_w", "rotulo": "Potência (W)", "tipo": "numero"},
      {"chave": "temperatura_cor_k", "rotulo": "Temperatura de cor (K)", "tipo": "numero"},
      {"chave": "tensao", "rotulo": "Tensão", "tipo": "texto"}
    ]'
  ),
  (
    'Cordão natalino',
    15,
    '[
      {"chave": "comprimento_m", "rotulo": "Comprimento (m)", "tipo": "numero"},
      {"chave": "cor_luz", "rotulo": "Cor da luz", "tipo": "texto"},
      {"chave": "tensao", "rotulo": "Tensão", "tipo": "texto"}
    ]'
  )
on conflict (nome) do update set
  limiar_padrao = excluded.limiar_padrao,
  atributos = excluded.atributos;

-- Famílias -------------------------------------------------------------------

insert into familias (categoria_id, nome, descricao)
select c.id, 'Refletor Slim', 'Refletor de sobrepor com corpo slim em alumínio.'
from categorias c
where c.nome = 'Refletor'
on conflict (nome) do update set
  categoria_id = excluded.categoria_id,
  descricao = excluded.descricao,
  ativo = true;

insert into familias (categoria_id, nome, descricao)
select c.id, 'Refletor Projetor', 'Projetor para áreas externas.'
from categorias c
where c.nome = 'Refletor'
on conflict (nome) do update set
  categoria_id = excluded.categoria_id,
  descricao = excluded.descricao,
  ativo = true;

insert into familias (categoria_id, nome, descricao)
select c.id, 'Cordão Microled', 'Cordão de LED micro para uso interno e externo.'
from categorias c
where c.nome = 'Cordão natalino'
on conflict (nome) do update set
  categoria_id = excluded.categoria_id,
  descricao = excluded.descricao,
  ativo = true;

-- Variantes ------------------------------------------------------------------

insert into variantes (familia_id, codigo, nome, atributos, preco, estoque_minimo)
select f.id, 'REF-SLIM-50-5K-BI', 'Refletor Slim 50 W 5000 K bivolt',
       '{"potencia_w": 50, "temperatura_cor_k": 5000, "tensao": "bivolt"}',
       89.90, null
from familias f
where f.nome = 'Refletor Slim'
on conflict (codigo) do update set
  familia_id = excluded.familia_id,
  nome = excluded.nome,
  atributos = excluded.atributos,
  preco = excluded.preco,
  estoque_minimo = excluded.estoque_minimo,
  ativo = true;

insert into variantes (familia_id, codigo, nome, atributos, preco, estoque_minimo)
select f.id, 'REF-SLIM-100-5K-BI', 'Refletor Slim 100 W 5000 K bivolt',
       '{"potencia_w": 100, "temperatura_cor_k": 5000, "tensao": "bivolt"}',
       129.90, null
from familias f
where f.nome = 'Refletor Slim'
on conflict (codigo) do update set
  familia_id = excluded.familia_id,
  nome = excluded.nome,
  atributos = excluded.atributos,
  preco = excluded.preco,
  estoque_minimo = excluded.estoque_minimo,
  ativo = true;

insert into variantes (familia_id, codigo, nome, atributos, preco, estoque_minimo)
select f.id, 'REF-SLIM-200-5K-BI', 'Refletor Slim 200 W 5000 K bivolt',
       '{"potencia_w": 200, "temperatura_cor_k": 5000, "tensao": "bivolt"}',
       219.90, 10
from familias f
where f.nome = 'Refletor Slim'
on conflict (codigo) do update set
  familia_id = excluded.familia_id,
  nome = excluded.nome,
  atributos = excluded.atributos,
  preco = excluded.preco,
  estoque_minimo = excluded.estoque_minimo,
  ativo = true;

insert into variantes (familia_id, codigo, nome, atributos, preco, estoque_minimo)
select f.id, 'REF-SLIM-100-3K-BI', 'Refletor Slim 100 W 3000 K bivolt',
       '{"potencia_w": 100, "temperatura_cor_k": 3000, "tensao": "bivolt"}',
       134.90, null
from familias f
where f.nome = 'Refletor Slim'
on conflict (codigo) do update set
  familia_id = excluded.familia_id,
  nome = excluded.nome,
  atributos = excluded.atributos,
  preco = excluded.preco,
  estoque_minimo = excluded.estoque_minimo,
  ativo = true;

insert into variantes (familia_id, codigo, nome, atributos, preco, estoque_minimo)
select f.id, 'REF-PROJ-300-6K-BI', 'Refletor Projetor 300 W 6000 K bivolt',
       '{"potencia_w": 300, "temperatura_cor_k": 6000, "tensao": "bivolt"}',
       349.90, null
from familias f
where f.nome = 'Refletor Projetor'
on conflict (codigo) do update set
  familia_id = excluded.familia_id,
  nome = excluded.nome,
  atributos = excluded.atributos,
  preco = excluded.preco,
  estoque_minimo = excluded.estoque_minimo,
  ativo = true;

insert into variantes (familia_id, codigo, nome, atributos, preco, estoque_minimo)
select f.id, 'COR-MICRO-5-AZ', 'Cordão Microled 5 m azul 127 V',
       '{"comprimento_m": 5, "cor_luz": "azul", "tensao": "127 V"}',
       39.90, null
from familias f
where f.nome = 'Cordão Microled'
on conflict (codigo) do update set
  familia_id = excluded.familia_id,
  nome = excluded.nome,
  atributos = excluded.atributos,
  preco = excluded.preco,
  estoque_minimo = excluded.estoque_minimo,
  ativo = true;

insert into variantes (familia_id, codigo, nome, atributos, preco, estoque_minimo)
select f.id, 'COR-MICRO-10-QT', 'Cordão Microled 10 m quente 127 V',
       '{"comprimento_m": 10, "cor_luz": "quente", "tensao": "127 V"}',
       69.90, 20
from familias f
where f.nome = 'Cordão Microled'
on conflict (codigo) do update set
  familia_id = excluded.familia_id,
  nome = excluded.nome,
  atributos = excluded.atributos,
  preco = excluded.preco,
  estoque_minimo = excluded.estoque_minimo,
  ativo = true;

insert into variantes (familia_id, codigo, nome, atributos, preco, estoque_minimo)
select f.id, 'COR-MICRO-10-MULTI', 'Cordão Microled 10 m multicolor bivolt',
       '{"comprimento_m": 10, "cor_luz": "multicolor", "tensao": "bivolt"}',
       79.90, null
from familias f
where f.nome = 'Cordão Microled'
on conflict (codigo) do update set
  familia_id = excluded.familia_id,
  nome = excluded.nome,
  atributos = excluded.atributos,
  preco = excluded.preco,
  estoque_minimo = excluded.estoque_minimo,
  ativo = true;

-- Locais ---------------------------------------------------------------------
-- A ordem importa: o pai precisa existir antes do filho.

insert into locais (pai_id, nome, tipo, codigo)
values (null, 'Galpão 1', 'Galpão', 'G1')
on conflict (codigo) do update set
  pai_id = excluded.pai_id,
  nome = excluded.nome,
  tipo = excluded.tipo,
  ativo = true;

insert into locais (pai_id, nome, tipo, codigo)
select l.id, 'Setor A', 'Setor', 'G1-A'
from locais l
where l.codigo = 'G1'
on conflict (codigo) do update set
  pai_id = excluded.pai_id,
  nome = excluded.nome,
  tipo = excluded.tipo,
  ativo = true;

insert into locais (pai_id, nome, tipo, codigo)
select l.id, 'Setor B', 'Setor', 'G1-B'
from locais l
where l.codigo = 'G1'
on conflict (codigo) do update set
  pai_id = excluded.pai_id,
  nome = excluded.nome,
  tipo = excluded.tipo,
  ativo = true;

insert into locais (pai_id, nome, tipo, codigo)
select l.id, 'Módulo 01', 'Módulo', 'G1-A-01'
from locais l
where l.codigo = 'G1-A'
on conflict (codigo) do update set
  pai_id = excluded.pai_id,
  nome = excluded.nome,
  tipo = excluded.tipo,
  ativo = true;

insert into locais (pai_id, nome, tipo, codigo)
select l.id, 'Módulo 02', 'Módulo', 'G1-A-02'
from locais l
where l.codigo = 'G1-A'
on conflict (codigo) do update set
  pai_id = excluded.pai_id,
  nome = excluded.nome,
  tipo = excluded.tipo,
  ativo = true;

insert into locais (pai_id, nome, tipo, codigo)
select l.id, 'Módulo 03', 'Módulo', 'G1-A-03'
from locais l
where l.codigo = 'G1-A'
on conflict (codigo) do update set
  pai_id = excluded.pai_id,
  nome = excluded.nome,
  tipo = excluded.tipo,
  ativo = true;

commit;
