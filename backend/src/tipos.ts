import type { Cargo } from "./cargos";

// Tipos compartilhados entre o backend e as telas. Os nomes das colunas
// seguem o contrato de docs/04-architecture/banco-de-dados.md.

export interface Perfil {
  id: string;
  nome: string;
  email: string;
  cargo: Cargo;
  /**
   * Vem do `user_metadata` do Supabase, não de uma coluna de `perfis`.
   * Verdadeiro enquanto a pessoa ainda usa a senha provisória criada pelo
   * administrador. O backend limpa a marca depois da primeira troca.
   */
  senha_provisoria: boolean;
}

export interface Usuario extends Omit<Perfil, "senha_provisoria"> {
  criado_em: string;
}

export interface NovoUsuario {
  nome: string;
  email: string;
  cargo: Cargo;
}

export interface NovoTitular {
  nome: string;
  email: string;
}

export type TipoAtributo = "numero" | "texto";

export interface Atributo {
  chave: string;
  rotulo: string;
  tipo: TipoAtributo;
}

export interface Categoria {
  id: string;
  nome: string;
  limiar_padrao: number;
  atributos: Atributo[];
}

export interface Familia {
  id: string;
  categoria_id: string;
  nome: string;
  descricao?: string;
  imagem_url?: string;
  ativo: boolean;
}

export interface Variante {
  id: string;
  familia_id: string;
  codigo: string;
  nome: string;
  atributos: Record<string, string | number>;
  preco?: number | null;
  imagem_url?: string | null;
  estoque_minimo?: number | null;
  monitorar: boolean;
  ativo: boolean;
}

export interface Local {
  id: string;
  pai_id: string | null;
  nome: string;
  tipo: string;
  codigo: string;
  capacidade?: number | null;
  ativo: boolean;
}

export interface Saldo {
  variante_id: string;
  local_id: string;
  quantidade: number;
}

export type TipoMovimentacao = "entrada" | "saida" | "transferencia" | "ajuste";

export interface Movimentacao {
  id: number;
  variante_id: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  local_origem_id: string | null;
  local_destino_id: string | null;
  documento_id?: string | null;
  inventario_id?: string | null;
  justificativa?: string;
  usuario_id: string;
  usuario_nome: string;
  criado_em: string;
}

export interface DadosDoEstoque {
  categorias: Categoria[];
  familias: Familia[];
  variantes: Variante[];
  locais: Local[];
  saldos: Saldo[];
  movimentacoes: Movimentacao[];
}

export type NovaCategoria = Omit<Categoria, "id">;
export type NovaFamilia = Omit<Familia, "id">;
export type NovaVariante = Omit<Variante, "id">;
export type NovoLocal = Omit<Local, "id">;

export interface DadosDeMovimentacao {
  variante_id: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  local_origem_id: string | null;
  local_destino_id: string | null;
  justificativa?: string;
}
