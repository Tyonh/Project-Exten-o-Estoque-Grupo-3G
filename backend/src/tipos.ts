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
  /** Marca do produto (Crown, 3G, Ebron...). Vazio quando não se sabe. */
  marca?: string | null;
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

export type StatusDocumento = "pendente" | "baixado" | "cancelado";

export type TipoDocumento = "ORCAMENTO" | "AMOSTRA" | "PRODUCAO";

/** Documento de saída recebido de outro sistema (hoje o GEDOC). O QR code carrega o protocolo. */
export interface DocumentoSaida {
  id: string;
  protocolo: string;
  origem: string;
  tipo_documento: TipoDocumento | null;
  cliente_nome: string | null;
  solicitante_nome: string | null;
  status: StatusDocumento;
  /** O GEDOC só libera a baixa depois que o documento foi validado lá. */
  validado_na_origem: boolean;
  criado_em: string;
  baixado_em: string | null;
  baixado_por_nome: string | null;
  total_de_itens: number;
}

export interface LocalComSaldo {
  local_id: string;
  codigo: string;
  caminho: string;
  quantidade: number;
}

export interface ItemDoDocumento {
  variante_id: string;
  codigo: string;
  nome: string;
  marca: string | null;
  familia: string | null;
  quantidade: number;
  /** Locais com saldo desta variante, do maior saldo para o menor. */
  locais: LocalComSaldo[];
  /** De onde tirar, sugerido pelo backend. Pode juntar mais de um local. */
  sugestao: Retirada[];
  /** Quanto falta de saldo para cobrir o pedido (0 quando há saldo suficiente). */
  falta: number;
}

export interface DocumentoDetalhe extends DocumentoSaida {
  itens: ItemDoDocumento[];
}

export interface Retirada {
  variante_id: string;
  local_id: string;
  quantidade: number;
}

export type StatusInventario = "aberto" | "concluido" | "cancelado";

/** Contagem física de um local, comparada com o saldo do sistema. */
export interface Inventario {
  id: string;
  local_id: string;
  local_codigo: string;
  local_caminho: string;
  status: StatusInventario;
  observacao: string | null;
  aberto_por_nome: string;
  aberto_em: string;
  concluido_por_nome: string | null;
  concluido_em: string | null;
  total_de_itens: number;
  total_contados: number;
}

export interface ItemDoInventario {
  variante_id: string;
  codigo: string;
  nome: string;
  marca: string | null;
  familia: string | null;
  /** Saldo que o sistema tinha ao abrir (ou ao incluir o item). */
  quantidade_sistema: number;
  /** Vazio enquanto o item não foi contado. */
  quantidade_contada: number | null;
}

/** Diferença que a conclusão vai gravar para uma variante, com o saldo de agora. */
export interface AjusteDoInventario {
  variante_id: string;
  tipo: "entrada" | "saida";
  quantidade: number;
  saldo_atual: number;
  saldo_novo: number;
}

export interface InventarioDetalhe extends Inventario {
  itens: ItemDoInventario[];
  /** Calculado com o saldo atual, só enquanto o inventário está aberto. */
  ajustes: AjusteDoInventario[];
}
