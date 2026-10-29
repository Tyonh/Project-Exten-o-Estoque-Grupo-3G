import type { Cargo } from "@estoque/backend/cargos";

// Rótulos em português para os cargos definidos em backend/src/cargos.ts e em
// docs/06-security/security-model.md. A tela usa só para exibir; a permissão
// de verdade é conferida no backend.
export const ROTULO_CARGO: Record<Cargo, string> = {
  pendente: "Pendente",
  estoquista: "Estoquista",
  gerente: "Gerente",
  gerente_estoque: "Gerente de estoque",
  admin: "Administrador",
};
