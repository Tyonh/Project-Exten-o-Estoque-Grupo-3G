// Os tipos do estoque vivem no backend para que a tela e as funções do
// servidor usem exatamente o mesmo contrato (docs/04-architecture/banco-de-dados.md).
// Este arquivo mantém o caminho antigo de importação das telas.
export type {
  Atributo,
  Categoria,
  DadosDeMovimentacao,
  DadosDoEstoque,
  Familia,
  Local,
  Movimentacao,
  NovaCategoria,
  NovaFamilia,
  NovaVariante,
  NovoLocal,
  Saldo,
  TipoAtributo,
  TipoMovimentacao,
  Variante,
} from "@estoque/backend/tipos";

import type { DadosDoEstoque } from "@estoque/backend/tipos";

export type DadosDoPrototipo = DadosDoEstoque;
