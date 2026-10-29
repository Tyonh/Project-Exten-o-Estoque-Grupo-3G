import "server-only";
import { createClient } from "@supabase/supabase-js";

// Todas as tabelas do estoque ficam neste schema do projeto Supabase da
// empresa, separadas das do GEDOC (`public`). ADR-18.
export const SCHEMA_DO_ESTOQUE = "estoque" as const;

function criarClienteDoBanco(url: string, chave: string) {
  return createClient(url, chave, {
    db: { schema: SCHEMA_DO_ESTOQUE },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type ClienteDoBanco = ReturnType<typeof criarClienteDoBanco>;

// Em desenvolvimento o Next recarrega os módulos a cada alteração. Guardar o
// cliente no objeto global evita criar um novo a cada recarga.
const global = globalThis as typeof globalThis & { clienteDoBanco?: ClienteDoBanco };

// Cliente do Supabase com a chave secreta. Ela ignora a segurança por linha e
// dá acesso total aos dados, por isso só existe no servidor. É o único caminho
// do sistema até as tabelas (ADR-16). `.from("x")` lê `estoque.x`; as funções
// de administração de login (`auth.admin`) não dependem do schema.
export function banco(): ClienteDoBanco {
  if (!global.clienteDoBanco) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const chave = process.env.SUPABASE_SECRET_KEY;
    if (!url || !chave) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY precisam estar definidas. Veja frontend/.env.example.",
      );
    }
    global.clienteDoBanco = criarClienteDoBanco(url, chave);
  }
  return global.clienteDoBanco;
}
