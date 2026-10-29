"use server";

import { falha, sucesso, type Resultado } from "./resultado";
import { banco } from "./servidor/banco";
import { lerTodasAsLinhas } from "./servidor/paginar";
import { exigirConsulta, exigirOperacao } from "./servidor/perfil";
import type {
  Atributo,
  Categoria,
  Familia,
  NovaCategoria,
  NovaFamilia,
  NovaVariante,
  Variante,
} from "./tipos";

interface LinhaDoBanco {
  [chave: string]: unknown;
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

function numero(valor: unknown): number {
  return typeof valor === "number" ? valor : Number(valor ?? 0);
}

function mapearCategoria(linha: LinhaDoBanco): Categoria {
  const atributos = Array.isArray(linha.atributos) ? (linha.atributos as Atributo[]) : [];
  return {
    id: texto(linha.id),
    nome: texto(linha.nome),
    limiar_padrao: numero(linha.limiar_padrao),
    atributos,
  };
}

function mapearFamilia(linha: LinhaDoBanco): Familia {
  return {
    id: texto(linha.id),
    categoria_id: texto(linha.categoria_id),
    nome: texto(linha.nome),
    descricao: typeof linha.descricao === "string" ? linha.descricao : undefined,
    imagem_url: typeof linha.imagem_url === "string" ? linha.imagem_url : undefined,
    ativo: Boolean(linha.ativo),
  };
}

function mapearVariante(linha: LinhaDoBanco): Variante {
  const atributos =
    linha.atributos && typeof linha.atributos === "object"
      ? (linha.atributos as Record<string, string | number>)
      : {};
  return {
    id: texto(linha.id),
    familia_id: texto(linha.familia_id),
    codigo: texto(linha.codigo),
    nome: texto(linha.nome),
    marca: typeof linha.marca === "string" ? linha.marca : null,
    atributos,
    preco: linha.preco == null ? null : Number(linha.preco),
    imagem_url: typeof linha.imagem_url === "string" ? linha.imagem_url : null,
    estoque_minimo:
      linha.estoque_minimo == null ? null : Number(linha.estoque_minimo),
    monitorar: Boolean(linha.monitorar),
    ativo: Boolean(linha.ativo),
  };
}

function traduzirErroDoBanco(
  erro: { code?: string; message: string },
  padrao: string,
  duplicado: string,
): string {
  console.error("[catalogo] Erro do banco:", erro.code ?? "sem código", erro.message);
  if (erro.code === "23505") return duplicado;
  return padrao;
}

function normalizarAtributos(atributos: Atributo[]): { erro?: string; dados?: Atributo[] } {
  const normalizados: Atributo[] = [];
  const chaves = new Set<string>();

  for (const atributo of atributos) {
    const chave = atributo.chave.trim();
    const rotulo = atributo.rotulo.trim();
    const tipo = atributo.tipo;

    if (!chave && !rotulo) continue;
    if (!chave) return { erro: "Toda característica precisa de uma chave interna." };
    if (!rotulo) return { erro: "Toda característica precisa de um rótulo na tela." };
    if (tipo !== "numero" && tipo !== "texto") {
      return { erro: "O tipo da característica precisa ser número ou texto." };
    }
    if (chaves.has(chave)) return { erro: "Há duas características com a mesma chave." };

    chaves.add(chave);
    normalizados.push({ chave, rotulo, tipo });
  }

  return { dados: normalizados };
}

function validarCategoria(entrada: NovaCategoria): { erro?: string; atributos?: Atributo[] } {
  if (!entrada.nome.trim()) return { erro: "Informe o nome da categoria." };
  if (
    !Number.isInteger(entrada.limiar_padrao) ||
    entrada.limiar_padrao < 0
  ) {
    return {
      erro: "O estoque mínimo padrão precisa ser um número inteiro maior ou igual a zero.",
    };
  }

  const atributos = normalizarAtributos(entrada.atributos);
  if (atributos.erro) return { erro: atributos.erro };
  return { atributos: atributos.dados };
}

export async function listarCategorias(): Promise<Resultado<Categoria[]>> {
  const autor = await exigirConsulta();
  if (!autor.ok) return autor;

  const { data, error } = await banco()
    .from("categorias")
    .select("id, nome, limiar_padrao, atributos")
    .order("nome", { ascending: true });

  if (error) {
    console.error("[catalogo] Falha ao listar categorias:", error.message);
    return falha("Não foi possível carregar as categorias.");
  }

  return sucesso((data ?? []).map((linha) => mapearCategoria(linha as LinhaDoBanco)));
}

export async function criarCategoria(entrada: NovaCategoria): Promise<Resultado<Categoria>> {
  const autor = await exigirOperacao();
  if (!autor.ok) return autor;

  const validacao = validarCategoria(entrada);
  if (validacao.erro) return falha(validacao.erro);

  const { data, error } = await banco()
    .from("categorias")
    .insert({
      nome: entrada.nome.trim(),
      limiar_padrao: entrada.limiar_padrao,
      atributos: validacao.atributos ?? [],
    })
    .select("id, nome, limiar_padrao, atributos")
    .single();

  if (error || !data) {
    return falha(
      traduzirErroDoBanco(
        error ?? { message: "sem dados" },
        "Não foi possível criar a categoria.",
        "Já existe uma categoria com esse nome.",
      ),
    );
  }

  return sucesso(mapearCategoria(data as LinhaDoBanco));
}

export async function editarCategoria(
  id: string,
  entrada: NovaCategoria,
): Promise<Resultado<Categoria>> {
  const autor = await exigirOperacao();
  if (!autor.ok) return autor;

  const validacao = validarCategoria(entrada);
  if (validacao.erro) return falha(validacao.erro);

  const { data, error } = await banco()
    .from("categorias")
    .update({
      nome: entrada.nome.trim(),
      limiar_padrao: entrada.limiar_padrao,
      atributos: validacao.atributos ?? [],
    })
    .eq("id", id)
    .select("id, nome, limiar_padrao, atributos")
    .maybeSingle();

  if (error) {
    return falha(
      traduzirErroDoBanco(
        error,
        "Não foi possível salvar a categoria.",
        "Já existe uma categoria com esse nome.",
      ),
    );
  }
  if (!data) return falha("Categoria não encontrada.");

  return sucesso(mapearCategoria(data as LinhaDoBanco));
}

export async function listarFamilias(): Promise<Resultado<Familia[]>> {
  const autor = await exigirConsulta();
  if (!autor.ok) return autor;

  const { data, error } = await banco()
    .from("familias")
    .select("id, categoria_id, nome, descricao, imagem_url, ativo")
    .order("nome", { ascending: true });

  if (error) {
    console.error("[catalogo] Falha ao listar famílias:", error.message);
    return falha("Não foi possível carregar as famílias.");
  }

  return sucesso((data ?? []).map((linha) => mapearFamilia(linha as LinhaDoBanco)));
}

export async function criarFamilia(entrada: NovaFamilia): Promise<Resultado<Familia>> {
  const autor = await exigirOperacao();
  if (!autor.ok) return autor;

  if (!entrada.nome.trim()) return falha("Informe o nome da família.");
  const { data: categoria, error: erroCategoria } = await banco()
    .from("categorias")
    .select("id")
    .eq("id", entrada.categoria_id)
    .maybeSingle();
  if (erroCategoria) {
    console.error("[catalogo] Falha ao conferir a categoria:", erroCategoria.message);
    return falha("Não foi possível conferir a categoria.");
  }
  if (!categoria) return falha("Escolha uma categoria válida.");

  const { data, error } = await banco()
    .from("familias")
    .insert({
      categoria_id: entrada.categoria_id,
      nome: entrada.nome.trim(),
      descricao: entrada.descricao?.trim() || null,
      imagem_url: entrada.imagem_url?.trim() || null,
      ativo: entrada.ativo !== false,
    })
    .select("id, categoria_id, nome, descricao, imagem_url, ativo")
    .single();

  if (error || !data) {
    return falha(
      traduzirErroDoBanco(
        error ?? { message: "sem dados" },
        "Não foi possível criar a família.",
        "Já existe uma família com esse nome.",
      ),
    );
  }

  return sucesso(mapearFamilia(data as LinhaDoBanco));
}

export async function editarFamilia(
  id: string,
  entrada: NovaFamilia,
): Promise<Resultado<Familia>> {
  const autor = await exigirOperacao();
  if (!autor.ok) return autor;

  if (!entrada.nome.trim()) return falha("Informe o nome da família.");
  const { data: categoria, error: erroCategoria } = await banco()
    .from("categorias")
    .select("id")
    .eq("id", entrada.categoria_id)
    .maybeSingle();
  if (erroCategoria) {
    console.error("[catalogo] Falha ao conferir a categoria:", erroCategoria.message);
    return falha("Não foi possível conferir a categoria.");
  }
  if (!categoria) return falha("Escolha uma categoria válida.");

  const { data, error } = await banco()
    .from("familias")
    .update({
      categoria_id: entrada.categoria_id,
      nome: entrada.nome.trim(),
      descricao: entrada.descricao?.trim() || null,
      imagem_url: entrada.imagem_url?.trim() || null,
      ativo: entrada.ativo !== false,
    })
    .eq("id", id)
    .select("id, categoria_id, nome, descricao, imagem_url, ativo")
    .maybeSingle();

  if (error) {
    return falha(
      traduzirErroDoBanco(
        error,
        "Não foi possível salvar a família.",
        "Já existe uma família com esse nome.",
      ),
    );
  }
  if (!data) return falha("Família não encontrada.");

  return sucesso(mapearFamilia(data as LinhaDoBanco));
}

export async function listarVariantes(): Promise<Resultado<Variante[]>> {
  const autor = await exigirConsulta();
  if (!autor.ok) return autor;

  // O catálogo real passa de mil variantes: a leitura é paginada (o Supabase
  // corta em 1000 linhas). Ordem por nome e id para as páginas não repetirem.
  const { data, error } = await lerTodasAsLinhas((de, ate) =>
    banco()
      .from("variantes")
      .select(
        "id, familia_id, codigo, nome, marca, atributos, preco, imagem_url, estoque_minimo, monitorar, ativo",
      )
      .order("nome", { ascending: true })
      .order("id", { ascending: true })
      .range(de, ate),
  );

  if (error) {
    console.error("[catalogo] Falha ao listar variantes:", error.message);
    return falha("Não foi possível carregar as variantes.");
  }

  return sucesso((data ?? []).map((linha) => mapearVariante(linha as LinhaDoBanco)));
}

async function categoriaDaFamilia(familiaId: string): Promise<Categoria | null> {
  const { data: familia, error: erroFamilia } = await banco()
    .from("familias")
    .select("categoria_id")
    .eq("id", familiaId)
    .maybeSingle();
  if (erroFamilia || !familia) return null;

  const { data: categoria, error: erroCategoria } = await banco()
    .from("categorias")
    .select("id, nome, limiar_padrao, atributos")
    .eq("id", familia.categoria_id)
    .maybeSingle();
  if (erroCategoria || !categoria) return null;

  return mapearCategoria(categoria as LinhaDoBanco);
}

function normalizarAtributosDaVariante(
  categoria: Categoria,
  atributos: Record<string, string | number>,
): { erro?: string; dados?: Record<string, string | number> } {
  const resultado: Record<string, string | number> = {};

  for (const definicao of categoria.atributos) {
    const valor = atributos[definicao.chave];
    if (valor == null || valor === "") continue;

    if (definicao.tipo === "numero") {
      const numeroConvertido = typeof valor === "number" ? valor : Number(valor);
      if (!Number.isFinite(numeroConvertido)) {
        return { erro: `O valor de “${definicao.rotulo}” precisa ser um número.` };
      }
      resultado[definicao.chave] = numeroConvertido;
    } else {
      resultado[definicao.chave] = String(valor).trim();
    }
  }

  return { dados: resultado };
}

function validarVariante(
  entrada: NovaVariante,
): { erro?: string; categoria?: Categoria; atributos?: Record<string, string | number> } {
  if (!entrada.codigo.trim()) return { erro: "Informe o código da variante." };
  if (!entrada.nome.trim()) return { erro: "Informe o nome da variante." };
  if (entrada.preco != null && (!Number.isFinite(entrada.preco) || entrada.preco < 0)) {
    return { erro: "O preço não pode ser negativo." };
  }
  if (
    entrada.estoque_minimo != null &&
    (!Number.isInteger(entrada.estoque_minimo) || entrada.estoque_minimo < 0)
  ) {
    return { erro: "O estoque mínimo precisa ser um número inteiro maior ou igual a zero." };
  }
  return {};
}

export async function criarVariante(entrada: NovaVariante): Promise<Resultado<Variante>> {
  const autor = await exigirOperacao();
  if (!autor.ok) return autor;

  const validacao = validarVariante(entrada);
  if (validacao.erro) return falha(validacao.erro);

  const categoria = await categoriaDaFamilia(entrada.familia_id);
  if (!categoria) return falha("Escolha uma família válida.");

  const atributos = normalizarAtributosDaVariante(categoria, entrada.atributos);
  if (atributos.erro) return falha(atributos.erro);

  const { data, error } = await banco()
    .from("variantes")
    .insert({
      familia_id: entrada.familia_id,
      codigo: entrada.codigo.trim().toUpperCase(),
      nome: entrada.nome.trim(),
      marca: entrada.marca?.trim() || null,
      atributos: atributos.dados ?? {},
      preco: entrada.preco ?? null,
      imagem_url: entrada.imagem_url ?? null,
      estoque_minimo: entrada.estoque_minimo ?? null,
      monitorar: entrada.monitorar !== false,
      ativo: entrada.ativo !== false,
    })
    .select(
      "id, familia_id, codigo, nome, marca, atributos, preco, imagem_url, estoque_minimo, monitorar, ativo",
    )
    .single();

  if (error || !data) {
    return falha(
      traduzirErroDoBanco(
        error ?? { message: "sem dados" },
        "Não foi possível criar a variante.",
        "Já existe uma variante com esse código.",
      ),
    );
  }

  return sucesso(mapearVariante(data as LinhaDoBanco));
}

export async function editarVariante(
  id: string,
  entrada: NovaVariante,
): Promise<Resultado<Variante>> {
  const autor = await exigirOperacao();
  if (!autor.ok) return autor;

  const validacao = validarVariante(entrada);
  if (validacao.erro) return falha(validacao.erro);

  const categoria = await categoriaDaFamilia(entrada.familia_id);
  if (!categoria) return falha("Escolha uma família válida.");

  const atributos = normalizarAtributosDaVariante(categoria, entrada.atributos);
  if (atributos.erro) return falha(atributos.erro);

  const { data, error } = await banco()
    .from("variantes")
    .update({
      familia_id: entrada.familia_id,
      codigo: entrada.codigo.trim().toUpperCase(),
      nome: entrada.nome.trim(),
      marca: entrada.marca?.trim() || null,
      atributos: atributos.dados ?? {},
      preco: entrada.preco ?? null,
      imagem_url: entrada.imagem_url ?? null,
      estoque_minimo: entrada.estoque_minimo ?? null,
      monitorar: entrada.monitorar !== false,
      ativo: entrada.ativo !== false,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .select(
      "id, familia_id, codigo, nome, marca, atributos, preco, imagem_url, estoque_minimo, monitorar, ativo",
    )
    .maybeSingle();

  if (error) {
    return falha(
      traduzirErroDoBanco(
        error,
        "Não foi possível salvar a variante.",
        "Já existe uma variante com esse código.",
      ),
    );
  }
  if (!data) return falha("Variante não encontrada.");

  return sucesso(mapearVariante(data as LinhaDoBanco));
}

export async function alternarVariante(id: string): Promise<Resultado<Variante>> {
  const autor = await exigirOperacao();
  if (!autor.ok) return autor;

  const { data: atual, error: erroLeitura } = await banco()
    .from("variantes")
    .select("ativo")
    .eq("id", id)
    .maybeSingle();
  if (erroLeitura) {
    console.error("[catalogo] Falha ao ler a variante:", erroLeitura.message);
    return falha("Não foi possível carregar a variante.");
  }
  if (!atual) return falha("Variante não encontrada.");

  const { data, error } = await banco()
    .from("variantes")
    .update({ ativo: !atual.ativo, atualizado_em: new Date().toISOString() })
    .eq("id", id)
    .select(
      "id, familia_id, codigo, nome, marca, atributos, preco, imagem_url, estoque_minimo, monitorar, ativo",
    )
    .maybeSingle();

  if (error) {
    console.error("[catalogo] Falha ao alternar a variante:", error.message);
    return falha("Não foi possível alterar a variante.");
  }
  if (!data) return falha("Variante não encontrada.");

  return sucesso(mapearVariante(data as LinhaDoBanco));
}
