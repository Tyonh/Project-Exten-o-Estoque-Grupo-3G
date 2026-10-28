"use server";

import { headers } from "next/headers";
import { eCargo } from "./cargos";
import { falha, sucesso, type Resultado } from "./resultado";
import { banco } from "./servidor/banco";
import { criarClienteDeSessao } from "./servidor/supabase";
import type { DadosDeCadastro, Perfil } from "./tipos";

// O Supabase devolve os erros em inglês. As mensagens que o usuário vê ficam
// aqui, em português, escolhidas pelo código do erro.
const MENSAGENS_POR_CODIGO: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed: "Confirme seu e-mail antes de entrar.",
  user_already_exists: "Este e-mail já está cadastrado.",
  email_address_invalid: "Este e-mail não é aceito. Use um e-mail real.",
  weak_password: "A senha é fraca demais. Use ao menos 6 caracteres, com letras e números.",
  over_email_send_rate_limit: "Muitos e-mails enviados em pouco tempo. Aguarde alguns minutos e tente de novo.",
  over_request_rate_limit: "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.",
  signup_disabled: "O cadastro está desativado. Fale com o administrador.",
  same_password: "A nova senha precisa ser diferente da senha atual.",
};

function traduzirErro(erro: { code?: string; message: string }, padrao: string): string {
  console.error("[sessao] Erro do Supabase:", erro.code ?? "sem código", erro.message);
  return (erro.code && MENSAGENS_POR_CODIGO[erro.code]) || padrao;
}

export async function entrar(email: string, senha: string): Promise<Resultado<null>> {
  const supabase = await criarClienteDeSessao();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) {
    return falha(traduzirErro(error, "Não foi possível entrar. Tente novamente."));
  }
  return sucesso(null);
}

// Cria o usuário no login do Supabase e, em seguida, o perfil com cargo
// "pendente". O perfil só é criado pelo backend: o banco não tem gatilho.
export async function cadastrar(dados: DadosDeCadastro): Promise<Resultado<null>> {
  const nome = dados.nome.trim();
  if (nome === "") {
    return falha("Informe seu nome completo.");
  }

  const supabase = await criarClienteDeSessao();
  const { data, error } = await supabase.auth.signUp({
    email: dados.email,
    password: dados.senha,
    options: { data: { nome } },
  });
  if (error) {
    return falha(traduzirErro(error, "Não foi possível criar a conta. Tente novamente."));
  }
  if (!data.user) {
    return falha("Não foi possível criar a conta. Tente novamente.");
  }

  const { error: erroPerfil } = await banco()
    .from("perfis")
    .upsert(
      { id: data.user.id, nome, email: dados.email, cargo: "pendente" },
      { onConflict: "id", ignoreDuplicates: true },
    );
  if (erroPerfil) {
    console.error("[sessao] Falha ao criar o perfil:", erroPerfil.message);
    return falha("A conta foi criada, mas o perfil não. Fale com o administrador.");
  }
  return sucesso(null);
}

export async function sair(): Promise<Resultado<null>> {
  const supabase = await criarClienteDeSessao();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return falha("Não foi possível sair. Tente novamente.");
  }
  return sucesso(null);
}

// Endereço público do site, usado no link que o Supabase envia por e-mail.
// Em produção, o proxy do servidor informa o host e o protocolo originais.
async function origemDoSite(): Promise<string> {
  const cabecalhos = await headers();
  const host = (
    cabecalhos.get("x-forwarded-host") ??
    cabecalhos.get("host") ??
    "localhost:3000"
  )
    .split(",")[0]
    .trim();
  const protocolo = (
    cabecalhos.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https")
  )
    .split(",")[0]
    .trim();
  return `${protocolo}://${host}`;
}

// Pede ao Supabase o e-mail com o link de recuperação. A resposta é sempre a
// mesma, mesmo quando o e-mail não está cadastrado: assim ninguém descobre
// quais e-mails existem no sistema.
export async function solicitarRecuperacaoSenha(email: string): Promise<Resultado<null>> {
  const emailLimpo = email.trim();
  if (emailLimpo === "") {
    return falha("Informe o e-mail da sua conta.");
  }

  const origem = await origemDoSite();
  const supabase = await criarClienteDeSessao();
  const { error } = await supabase.auth.resetPasswordForEmail(emailLimpo, {
    redirectTo: `${origem}/api/auth/confirmar-recuperacao`,
  });

  if (error) {
    // Só os erros que não revelam se o e-mail existe viram mensagem na tela.
    if (
      error.code === "email_address_invalid" ||
      error.code === "over_email_send_rate_limit" ||
      error.code === "over_request_rate_limit"
    ) {
      return falha(
        MENSAGENS_POR_CODIGO[error.code] ?? "Não foi possível enviar o link. Tente novamente.",
      );
    }
    console.error(
      "[sessao] Erro ao pedir a recuperação de senha:",
      error.code ?? "sem código",
      error.message,
    );
  }

  return sucesso(null);
}

// Troca a senha do usuário da sessão de recuperação. Ao terminar, encerra as
// sessões abertas para que o próximo acesso use a senha nova.
export async function alterarSenha(novaSenha: string): Promise<Resultado<null>> {
  if (novaSenha.length < 6) {
    return falha("A senha precisa ter ao menos 6 caracteres.");
  }

  const supabase = await criarClienteDeSessao();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return falha("Sua sessão expirou. Peça um novo link de recuperação.");
  }

  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  if (error) {
    return falha(traduzirErro(error, "Não foi possível alterar a senha. Tente novamente."));
  }

  const { error: erroAoEncerrar } = await supabase.auth.signOut({ scope: "global" });
  if (erroAoEncerrar) {
    console.error(
      "[sessao] Senha alterada, mas as sessões não foram encerradas:",
      erroAoEncerrar.message,
    );
  }

  return sucesso(null);
}

// Perfil do usuário da sessão. Devolve `dados: null` quando não há sessão.
// O usuário vem do cookie validado pelo Supabase, nunca de um dado da tela.
export async function buscarPerfilAtual(): Promise<Resultado<Perfil | null>> {
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
    console.error("[sessao] Falha ao buscar o perfil:", error.message);
    return falha("Não foi possível carregar seu perfil.");
  }
  if (!perfil || !eCargo(perfil.cargo)) {
    return falha("Seu perfil não foi encontrado. Fale com o administrador.");
  }
  return sucesso({ id: perfil.id, nome: perfil.nome, email: perfil.email, cargo: perfil.cargo });
}
