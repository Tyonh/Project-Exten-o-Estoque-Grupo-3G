"use server";

import { randomBytes } from "node:crypto";
import { eCargo, type Cargo } from "./cargos";
import { falha, sucesso, type Resultado } from "./resultado";
import { banco } from "./servidor/banco";
import { exigirAdmin } from "./servidor/perfil";
import type { NovoTitular, NovoUsuario, Usuario } from "./tipos";

const CARGO_PENDENTE: Cargo = "pendente";

function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function senhaProvisoria(): string {
  // 14 caracteres aleatórios, com maiúscula e número para atender às políticas
  // de senha mais comuns. O administrador vê a senha uma única vez e a repassa
  // para a pessoa; não guardamos essa senha em lugar nenhum.
  return `E${randomBytes(9).toString("base64url")}7`;
}

function mensagemDoSupabase(codigo: string | undefined): string {
  if (codigo === "email_exists" || codigo === "user_already_exists") {
    return "Este e-mail já está cadastrado.";
  }
  if (codigo === "weak_password") {
    return "Não foi possível gerar uma senha válida. Tente de novo.";
  }
  if (codigo === "email_address_invalid") {
    return "Este e-mail não é aceito. Use um e-mail real.";
  }
  return "Não foi possível criar o acesso. Tente novamente.";
}

/** Lista todos os acessos. Só o administrador pode ver. */
export async function listarUsuarios(): Promise<Resultado<Usuario[]>> {
  const autor = await exigirAdmin();
  if (!autor.ok) return autor;

  const { data, error } = await banco()
    .from("perfis")
    .select("id, nome, email, cargo, criado_em")
    .order("nome", { ascending: true });

  if (error) {
    console.error("[usuarios] Falha ao listar os perfis:", error.message);
    return falha("Não foi possível carregar os usuários.");
  }

  const usuarios = (data ?? [])
    .filter((perfil) => eCargo(perfil.cargo))
    .map((perfil) => ({
      id: perfil.id as string,
      nome: perfil.nome as string,
      email: perfil.email as string,
      cargo: perfil.cargo as Cargo,
      criado_em: perfil.criado_em as string,
    }));

  return sucesso(usuarios);
}

/**
 * Cria o login no Supabase e o perfil no banco em uma única operação do
 * administrador. Não existe cadastro público: a conta já nasce com o cargo
 * escolhido aqui.
 */
export async function criarUsuario(
  dados: NovoUsuario,
): Promise<Resultado<{ perfil: Usuario; senha_provisoria: string }>> {
  const autor = await exigirAdmin();
  if (!autor.ok) return autor;

  const nome = dados.nome.trim();
  const email = dados.email.trim();
  if (!nome) return falha("Informe o nome completo.");
  if (!emailValido(email)) return falha("Informe um e-mail válido.");
  if (!eCargo(dados.cargo) || dados.cargo === CARGO_PENDENTE) {
    return falha("Escolha um perfil de acesso válido.");
  }

  const senha = senhaProvisoria();
  const { data, error } = await banco().auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome, senha_provisoria: true },
  });

  if (error) {
    console.error("[usuarios] Falha ao criar o login:", error.code ?? "sem código", error.message);
    return falha(mensagemDoSupabase(error.code));
  }
  if (!data.user) {
    return falha("Não foi possível criar o acesso. Tente novamente.");
  }

  const { data: perfil, error: erroPerfil } = await banco()
    .from("perfis")
    .insert({
      id: data.user.id,
      nome,
      email,
      cargo: dados.cargo,
    })
    .select("id, nome, email, cargo, criado_em")
    .single();

  if (erroPerfil || !perfil) {
    console.error("[usuarios] Falha ao criar o perfil:", erroPerfil?.message ?? "sem perfil");

    // Desfaz o login criado para não deixar uma conta sem perfil no Supabase.
    const { error: erroAoApagar } = await banco().auth.admin.deleteUser(data.user.id);
    if (erroAoApagar) {
      console.error(
        "[usuarios] Login criado, mas o perfil e o desfazimento falharam:",
        erroAoApagar.message,
      );
    }

    return falha("Não foi possível criar o acesso. Tente novamente.");
  }

  return sucesso({
    perfil: {
      id: perfil.id as string,
      nome: perfil.nome as string,
      email: perfil.email as string,
      cargo: perfil.cargo as Cargo,
      criado_em: perfil.criado_em as string,
    },
    senha_provisoria: senha,
  });
}

/**
 * Passa a conta para outra pessoa sem perder o histórico. O ID do perfil não
 * muda: só o nome, o e-mail, a senha e a marca de senha provisória. Assim,
 * movimentações, documentos e inventários continuam ligados à mesma conta.
 */
export async function transferirUsuario(
  id: string,
  dados: NovoTitular,
): Promise<Resultado<{ perfil: Usuario; senha_provisoria: string }>> {
  const autor = await exigirAdmin();
  if (!autor.ok) return autor;

  if (!id) return falha("Usuário não encontrado.");
  if (id === autor.dados.id) {
    return falha("Você não pode transferir o próprio acesso.");
  }

  const nome = dados.nome.trim();
  const email = dados.email.trim();
  if (!nome) return falha("Informe o nome do novo titular.");
  if (!emailValido(email)) return falha("Informe um e-mail válido para o novo titular.");

  const { data: atual, error: erroAtual } = await banco()
    .from("perfis")
    .select("id, nome, email, cargo, criado_em")
    .eq("id", id)
    .maybeSingle();

  if (erroAtual) {
    console.error("[usuarios] Falha ao buscar o perfil para transferir:", erroAtual.message);
    return falha("Não foi possível carregar a conta. Tente novamente.");
  }
  if (!atual) return falha("Usuário não encontrado.");

  // Primeiro os dados do perfil, que são reversíveis. O login só muda depois.
  const { data: perfil, error: erroPerfil } = await banco()
    .from("perfis")
    .update({ nome, email })
    .eq("id", id)
    .select("id, nome, email, cargo, criado_em")
    .single();

  if (erroPerfil || !perfil) {
    console.error("[usuarios] Falha ao atualizar o titular:", erroPerfil?.message ?? "sem perfil");
    return falha("Não foi possível atualizar os dados do novo titular.");
  }

  const senha = senhaProvisoria();
  const { error: erroLogin } = await banco().auth.admin.updateUserById(id, {
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome, senha_provisoria: true },
  });

  if (erroLogin) {
    console.error(
      "[usuarios] Falha ao transferir o login:",
      erroLogin.code ?? "sem código",
      erroLogin.message,
    );

    // Desfaz o nome e o e-mail do perfil; a senha antiga do login não é tocada.
    const { error: erroDesfazer } = await banco()
      .from("perfis")
      .update({ nome: atual.nome, email: atual.email })
      .eq("id", id);
    if (erroDesfazer) {
      console.error("[usuarios] Falha ao desfazer a transferência:", erroDesfazer.message);
    }

    if (erroLogin.code === "email_exists" || erroLogin.code === "user_already_exists") {
      return falha("Este e-mail já está em uso por outra conta.");
    }
    if (erroLogin.code === "user_not_found" || erroLogin.status === 404) {
      return falha("A conta de login não foi encontrada.");
    }
    return falha("Não foi possível transferir a conta. Tente novamente.");
  }

  return sucesso({
    perfil: {
      id: perfil.id as string,
      nome: perfil.nome as string,
      email: perfil.email as string,
      cargo: perfil.cargo as Cargo,
      criado_em: perfil.criado_em as string,
    },
    senha_provisoria: senha,
  });
}

/**
 * Altera o cargo de um usuário. Usar `pendente` encerra o acesso sem apagar o
 * histórico. O administrador não pode alterar o próprio cargo, para o sistema
 * nunca ficar sem administrador.
 */
export async function alterarCargo(id: string, cargo: Cargo): Promise<Resultado<Usuario>> {
  const autor = await exigirAdmin();
  if (!autor.ok) return autor;

  if (!id) return falha("Usuário não encontrado.");
  if (!eCargo(cargo)) return falha("Escolha um perfil de acesso válido.");
  if (id === autor.dados.id) {
    return falha("Você não pode alterar o próprio cargo.");
  }

  const { data: perfil, error } = await banco()
    .from("perfis")
    .update({ cargo })
    .eq("id", id)
    .select("id, nome, email, cargo, criado_em")
    .maybeSingle();

  if (error) {
    console.error("[usuarios] Falha ao alterar o cargo:", error.message);
    return falha("Não foi possível alterar o cargo.");
  }
  if (!perfil) return falha("Usuário não encontrado.");

  return sucesso({
    id: perfil.id as string,
    nome: perfil.nome as string,
    email: perfil.email as string,
    cargo: perfil.cargo as Cargo,
    criado_em: perfil.criado_em as string,
  });
}

/**
 * Encerra o acesso de uma pessoa sem apagar o histórico. A conta continua
 * existindo, mas fica com o cargo `pendente` e perde o acesso na próxima
 * chamada ao backend. O administrador pode liberar de novo escolhendo um cargo.
 */
export async function desconectarUsuario(id: string): Promise<Resultado<Usuario>> {
  return alterarCargo(id, "pendente");
}

/**
 * Apaga definitivamente o login e o perfil de uma pessoa. O banco recusa
 * quando a conta é autora de movimentações, baixas de documento ou inventários;
 * nesse caso o administrador deve usar `desconectarUsuario` para preservar o
 * histórico. O administrador não pode apagar o próprio acesso.
 */
export async function apagarUsuario(id: string): Promise<Resultado<null>> {
  const autor = await exigirAdmin();
  if (!autor.ok) return autor;

  if (!id) return falha("Usuário não encontrado.");
  if (id === autor.dados.id) {
    return falha("Você não pode apagar o próprio acesso.");
  }

  const referencias = await Promise.all([
    banco()
      .from("movimentacoes")
      .select("id", { count: "exact", head: true })
      .eq("usuario_id", id),
    banco()
      .from("documentos_saida")
      .select("id", { count: "exact", head: true })
      .eq("baixado_por", id),
    banco()
      .from("inventarios")
      .select("id", { count: "exact", head: true })
      .eq("aberto_por", id),
    banco()
      .from("inventarios")
      .select("id", { count: "exact", head: true })
      .eq("concluido_por", id),
  ]);

  const falhaNaConferencia = referencias.find((resultado) => resultado.error);
  if (falhaNaConferencia?.error) {
    console.error(
      "[usuarios] Falha ao conferir o histórico antes de apagar:",
      falhaNaConferencia.error.message,
    );
    return falha("Não foi possível conferir o histórico da conta. Tente novamente.");
  }

  if (referencias.some((resultado) => (resultado.count ?? 0) > 0)) {
    return falha(
      "Esta conta tem histórico de movimentações, documentos ou inventários e não pode ser apagada. Use Desconectar para encerrar o acesso e preservar o histórico.",
    );
  }

  const { error: erroAoApagarLogin } = await banco().auth.admin.deleteUser(id);
  if (erroAoApagarLogin) {
    console.error(
      "[usuarios] Falha ao apagar o login:",
      erroAoApagarLogin.code ?? "sem código",
      erroAoApagarLogin.message,
    );

    if (
      erroAoApagarLogin.code === "user_not_found" ||
      erroAoApagarLogin.status === 404
    ) {
      // Login já não existe; apaga o perfil órfão para concluir a limpeza.
      const { error: erroAoApagarPerfil } = await banco()
        .from("perfis")
        .delete()
        .eq("id", id);
      if (erroAoApagarPerfil) {
        console.error("[usuarios] Falha ao apagar o perfil órfão:", erroAoApagarPerfil.message);
        return falha("Não foi possível apagar o perfil da conta. Tente novamente.");
      }
      return sucesso(null);
    }

    return falha("Não foi possível apagar a conta. Tente novamente.");
  }

  // A exclusão do login apaga o perfil pela ligação do banco. A limpeza abaixo
  // cobre uma eventual conta antiga sem essa ligação.
  const { error: erroAoApagarPerfil } = await banco().from("perfis").delete().eq("id", id);
  if (erroAoApagarPerfil) {
    console.error("[usuarios] Login apagado, mas o perfil não:", erroAoApagarPerfil.message);
    return falha("O login foi apagado, mas o perfil não. Tente apagar de novo.");
  }

  return sucesso(null);
}
