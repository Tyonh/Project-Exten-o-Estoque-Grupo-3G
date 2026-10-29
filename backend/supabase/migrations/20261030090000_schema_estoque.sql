-- Schema `estoque`: todas as tabelas do sistema de estoque, separadas das do
-- GEDOC (que ficam em `public`) no mesmo projeto Supabase da empresa.
--
-- Por que um schema próprio:
--   * O projeto da empresa já tem `public.perfis` (cargos admin/vendedor do
--     GEDOC), `public.documentos` e as tabelas do estoque3G antigo. Nomes como
--     `perfis` e `movimentacoes` colidiriam. Dentro de `estoque` não colidem.
--   * Fica claro, no painel e nos backups, o que pertence ao estoque.
--   * O login (`auth.users`) é compartilhado: a mesma pessoa entra nos dois
--     sistemas, e `estoque.perfis` guarda o cargo dela no estoque.
--
-- Contrato: docs/04-architecture/banco-de-dados.md (nomes e tipos).
-- O banco é simples: tabelas, ligações, valores únicos e limites. Nenhuma
-- função, gatilho, visão ou política (ADR-15). RLS ativada em todas as
-- tabelas, sem política, e só `service_role` (o backend) tem acesso (ADR-16).
--
-- Depois de aplicar, ver "Expor o schema na API" no fim deste arquivo.

create schema if not exists Estoque;

-- Tipos com valores fixos ----------------------------------------------------

do $$ begin
  create type estoque.cargo as enum ('pendente', 'estoquista', 'gerente', 'gerente_estoque', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estoque.tipo_movimentacao as enum ('entrada', 'saida', 'transferencia', 'ajuste');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estoque.status_inventario as enum ('aberto', 'concluido', 'cancelado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estoque.status_documento as enum ('pendente', 'baixado', 'cancelado');
exception when duplicate_object then null; end $$;

-- Usuários -------------------------------------------------------------------

create table if not exists estoque.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  email text not null,
  cargo estoque.cargo not null default 'pendente',
  criado_em timestamptz not null default now()
);

-- Catálogo -------------------------------------------------------------------

create table if not exists estoque.categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  limiar_padrao integer not null default 0 check (limiar_padrao >= 0),
  atributos jsonb not null default '[]'::jsonb,
  criado_em timestamptz not null default now()
);

create table if not exists estoque.familias (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references estoque.categorias (id),
  nome text not null unique,
  descricao text,
  imagem_url text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists estoque.variantes (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references estoque.familias (id),
  codigo text not null unique,
  nome text not null,
  marca text check (marca is null or length(btrim(marca)) > 0),
  atributos jsonb not null default '{}'::jsonb,
  preco numeric(12, 2) check (preco is null or preco >= 0),
  imagem_url text,
  estoque_minimo integer check (estoque_minimo is null or estoque_minimo >= 0),
  monitorar boolean not null default true,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Locais ---------------------------------------------------------------------

create table if not exists estoque.locais (
  id uuid primary key default gen_random_uuid(),
  pai_id uuid references estoque.locais (id),
  nome text not null,
  tipo text not null,
  codigo text not null unique,
  capacidade integer check (capacidade is null or capacidade > 0),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  check (pai_id is null or pai_id <> id)
);

-- Documentos de saída (pedidos vindos do GEDOC) ------------------------------

create table if not exists estoque.documentos_saida (
  id uuid primary key default gen_random_uuid(),
  protocolo text not null unique,
  origem text not null,
  tipo_documento text check (tipo_documento is null or tipo_documento in ('ORCAMENTO', 'AMOSTRA', 'PRODUCAO')),
  cliente_nome text,
  solicitante_nome text,
  status estoque.status_documento not null default 'pendente',
  validado_na_origem boolean not null default false,
  criado_em timestamptz not null default now(),
  baixado_por uuid references estoque.perfis (id),
  baixado_em timestamptz
);

create table if not exists estoque.documento_itens (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references estoque.documentos_saida (id) on delete cascade,
  variante_id uuid not null references estoque.variantes (id),
  quantidade integer not null check (quantidade > 0),
  unique (documento_id, variante_id)
);

-- Inventário -----------------------------------------------------------------

create table if not exists estoque.inventarios (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references estoque.locais (id),
  status estoque.status_inventario not null default 'aberto',
  observacao text,
  aberto_por uuid not null references estoque.perfis (id),
  aberto_em timestamptz not null default now(),
  concluido_por uuid references estoque.perfis (id),
  concluido_em timestamptz
);

create table if not exists estoque.inventario_itens (
  inventario_id uuid not null references estoque.inventarios (id) on delete cascade,
  variante_id uuid not null references estoque.variantes (id),
  quantidade_sistema integer not null check (quantidade_sistema >= 0),
  quantidade_contada integer check (quantidade_contada is null or quantidade_contada >= 0),
  primary key (inventario_id, variante_id)
);

-- Movimentações e saldos -----------------------------------------------------

create table if not exists estoque.movimentacoes (
  id bigint generated always as identity primary key,
  variante_id uuid not null references estoque.variantes (id),
  tipo estoque.tipo_movimentacao not null,
  quantidade integer not null check (quantidade > 0),
  local_origem_id uuid references estoque.locais (id),
  local_destino_id uuid references estoque.locais (id),
  documento_id uuid references estoque.documentos_saida (id),
  inventario_id uuid references estoque.inventarios (id),
  justificativa text,
  usuario_id uuid not null references estoque.perfis (id),
  criado_em timestamptz not null default now()
);

create table if not exists estoque.saldos (
  variante_id uuid not null references estoque.variantes (id),
  local_id uuid not null references estoque.locais (id),
  quantidade integer not null check (quantidade >= 0),
  atualizado_em timestamptz not null default now(),
  primary key (variante_id, local_id)
);

-- Índices (a especificação os considera opcionais; estes aceleram as telas) --

create index if not exists idx_estoque_familias_categoria_id on estoque.familias (categoria_id);
create index if not exists idx_estoque_variantes_familia_id on estoque.variantes (familia_id);
create index if not exists idx_estoque_variantes_marca on estoque.variantes (marca);
create index if not exists idx_estoque_locais_pai_id on estoque.locais (pai_id);
create index if not exists idx_estoque_saldos_local_id on estoque.saldos (local_id);
create index if not exists idx_estoque_movimentacoes_variante on estoque.movimentacoes (variante_id, criado_em desc);
create index if not exists idx_estoque_movimentacoes_criado_em on estoque.movimentacoes (criado_em desc);
create index if not exists idx_estoque_movimentacoes_documento on estoque.movimentacoes (documento_id);
create index if not exists idx_estoque_documentos_status on estoque.documentos_saida (status, criado_em desc);

-- Acesso ---------------------------------------------------------------------
-- RLS ligada e nenhuma política: quem usa a chave pública (navegador) não lê
-- nem grava nada. O backend usa a chave secreta (service_role).

alter table estoque.perfis enable row level security;
alter table estoque.categorias enable row level security;
alter table estoque.familias enable row level security;
alter table estoque.variantes enable row level security;
alter table estoque.locais enable row level security;
alter table estoque.documentos_saida enable row level security;
alter table estoque.documento_itens enable row level security;
alter table estoque.inventarios enable row level security;
alter table estoque.inventario_itens enable row level security;
alter table estoque.movimentacoes enable row level security;
alter table estoque.saldos enable row level security;

-- Só o service_role enxerga o schema. `anon` e `authenticated` ficam sem
-- permissão nenhuma, além de sem política.
revoke all on schema estoque from public, anon, authenticated;
revoke all on all tables in schema estoque from public, anon, authenticated;
revoke all on all sequences in schema estoque from public, anon, authenticated;

grant usage on schema estoque to service_role;
grant all on all tables in schema estoque to service_role;
grant all on all sequences in schema estoque to service_role;

alter default privileges in schema estoque grant all on tables to service_role;
alter default privileges in schema estoque grant all on sequences to service_role;

-- Expor o schema na API ------------------------------------------------------
-- O supabase-js só enxerga schemas expostos pela API. No painel do projeto:
--   Project Settings > API (Data API) > Exposed schemas > acrescentar `estoque`
-- (mantenha `public` e os que já estiverem na lista). Por SQL, confira antes o
-- valor atual e acrescente `estoque` a ele, sem apagar os outros:
--   show pgrst.db_schemas;   -- ou: select current_setting('pgrst.db_schemas', true);
--   alter role authenticator set pgrst.db_schemas = '<valor atual>,estoque';
--   notify pgrst, 'reload config';
