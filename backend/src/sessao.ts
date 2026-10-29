"use server";

import { headers } from "next/headers";
import { falha, sucesso, type Resultado } from "./resultado";
import { criarClienteDeSessao } from "./servidor/supabase";
import { lerPerfilDaSessao } from "./servidor/perfil";
import type { Perfil } from "./tipos";

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

// O cadastro de novos acessos é feito pelo administrador em
// `backend/src/usuarios.ts`. Não existe cadastro público: a tela de login só
// entra em contas já criadas.

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

  const { error } = await supabase.auth.updateUser({
    password: novaSenha,
    data: { senha_provisoria: false },
  });
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

// Troca a senha de uma conta já autenticada. A senha atual é conferida antes
// para que alguém com a sessão aberta não troque a senha sem conhecer a antiga.
// Depois da troca, as outras sessões da pessoa são encerradas.
export async function alterarSenhaDaConta(
  senhaAtual: string,
  novaSenha: string,
): Promise<Resultado<null>> {
  if (!senhaAtual) return falha("Informe a senha atual.");
  if (novaSenha.length < 6) {
    return falha("A nova senha precisa ter ao menos 6 caracteres.");
  }
  if (senhaAtual === novaSenha) {
    return falha("A nova senha precisa ser diferente da senha atual.");
  }

  const supabase = await criarClienteDeSessao();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return falha("Sua sessão expirou. Entre de novo.");
  }

  const { error: erroDaSenhaAtual } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: senhaAtual,
  });
  if (erroDaSenhaAtual) {
    if (erroDaSenhaAtual.code === "invalid_credentials") {
      return falha("Senha atual incorreta.");
    }
    return falha(
      traduzirErro(erroDaSenhaAtual, "Não foi possível confirmar a senha atual."),
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: novaSenha,
    data: { senha_provisoria: false },
  });
  if (error) {
    return falha(traduzirErro(error, "Não foi possível alterar a senha. Tente novamente."));
  }

  const { error: erroAoEncerrar } = await supabase.auth.signOut({ scope: "others" });
  if (erroAoEncerrar) {
    console.error(
      "[sessao] Senha alterada, mas as outras sessões não foram encerradas:",
      erroAoEncerrar.message,
    );
  }

  return sucesso(null);
}

// Perfil do usuário da sessão. Devolve `dados: null` quando não há sessão.
// A leitura fica em `servidor/perfil.ts` para ser usada também na conferência
// de permissão das outras funções do backend.
export async function buscarPerfilAtual(): Promise<Resultado<Perfil | null>> {
  return lerPerfilDaSessao();
}
