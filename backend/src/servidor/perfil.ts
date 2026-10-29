import "server-only";

import { eAdmin, eCargo, podeConsultar, podeOperar } from "../cargos";
import { falha, sucesso, type Resultado } from "../resultado";
import type { Perfil } from "../tipos";
import { banco } from "./banco";
import { criarClienteDeSessao } from "./supabase";

/**
 * Lê o perfil do usuário da sessão. O usuário vem do cookie validado pelo
 * Supabase, nunca de um dado enviado pela tela.
 *
 * Devolve `dados: null` quando não há sessão, para o chamador decidir se isso
 * é um erro ou apenas um visitante.
 */
export async function lerPerfilDaSessao(): Promise<Resultado<Perfil | null>> {
  const supabase = await criarClienteDeSessao();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return sucesso(null);
  }

  const { data: perfil, error } = await banco()
    .from("perfis")
    .select("id, nome, email, cargo")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[perfil] Falha ao buscar o perfil:", error.message);
    return falha("Não foi possível carregar seu perfil.");
  }
  if (!perfil || !eCargo(perfil.cargo)) {
    return falha("Seu perfil não foi encontrado. Fale com o administrador.");
  }

  return sucesso({
    id: perfil.id,
    nome: perfil.nome,
    email: perfil.email,
    cargo: perfil.cargo,
    senha_provisoria: user.user_metadata?.senha_provisoria === true,
  });
}

/** Exige uma sessão com perfil reconhecido e sem senha provisória pendente. */
export async function exigirPerfil(): Promise<Resultado<Perfil>> {
  const resultado = await lerPerfilDaSessao();
  if (!resultado.ok) return resultado;
  if (!resultado.dados) return falha("Entre no sistema para continuar.");
  if (resultado.dados.senha_provisoria) {
    return falha("Troque a senha provisória antes de continuar.");
  }
  return sucesso(resultado.dados);
}

/** Exige um perfil que possa consultar catálogo, locais, saldos e histórico. */
export async function exigirConsulta(): Promise<Resultado<Perfil>> {
  const resultado = await exigirPerfil();
  if (!resultado.ok) return resultado;
  if (!podeConsultar(resultado.dados.cargo)) {
    return falha("Seu acesso ainda não foi liberado.");
  }
  return resultado;
}

/** Exige um perfil que possa cadastrar, movimentar estoque e fazer inventário. */
export async function exigirOperacao(): Promise<Resultado<Perfil>> {
  const resultado = await exigirPerfil();
  if (!resultado.ok) return resultado;
  if (!podeOperar(resultado.dados.cargo)) {
    return falha("Seu perfil não tem permissão para alterar o estoque.");
  }
  return resultado;
}

/** Exige o perfil de administrador. */
export async function exigirAdmin(): Promise<Resultado<Perfil>> {
  const resultado = await exigirPerfil();
  if (!resultado.ok) return resultado;
  if (!eAdmin(resultado.dados.cargo)) {
    return falha("Só o administrador pode fazer isso.");
  }
  return resultado;
}
