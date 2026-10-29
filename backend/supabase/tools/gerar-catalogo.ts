// Gera os arquivos SQL do catálogo real da 3G a partir do produtos.db do GEDOC.
//
// Uso (na raiz do repositório, Node 22.18 ou mais novo):
//   npm run catalogo:gerar -- "D:/sistemaDocumentos/gedoc/produtos.db"
//
// Só LÊ o produtos.db (modo somente leitura) e só ESCREVE arquivos em
// backend/supabase/catalogo-real/. Não fala com nenhum banco remoto: quem
// aplica os arquivos é a frente de banco de dados, no editor SQL do Supabase.
//
// Os arquivos são idempotentes (upsert por nome e por código) e podem ser
// aplicados mais de uma vez. Não criam saldos nem movimentações: as
// quantidades reais entram pelas operações do backend (entrada) ou pela
// importação da Etapa 9.
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CATEGORIA_FALLBACK,
  classificarProduto,
  lerPreco,
  limparCodigo,
} from "../../src/servidor/classificacao.ts";

const TAMANHO_DO_LOTE = 400;
const ATRIBUTOS_PADRAO = [
  { chave: "potencia_w", rotulo: "Potência (W)", tipo: "numero" },
  { chave: "temperatura_cor_k", rotulo: "Temperatura de cor (K)", tipo: "numero" },
  { chave: "tensao", rotulo: "Tensão", tipo: "texto" },
];

interface LinhaLegada {
  codigo: string;
  descricao: string;
  imagem_url: string | null;
  preco: unknown;
}

interface Variante {
  codigo: string;
  nome: string;
  familia: string;
  categoria: string;
  marca: string | null;
  atributos: Record<string, string | number>;
  preco: number | null;
  imagem_url: string | null;
}

const aspas = (valor: string): string => `'${valor.replace(/'/g, "''")}'`;
const textoOuNulo = (valor: string | null): string => (valor ? aspas(valor) : "null");

function lerVariantes(caminho: string): Variante[] {
  const banco = new DatabaseSync(caminho, { readOnly: true });
  const linhas = banco
    .prepare("select codigo, descricao, imagem_url, preco from produtos order by codigo")
    .all() as unknown as LinhaLegada[];
  banco.close();

  const vistos = new Set<string>();
  const variantes: Variante[] = [];
  for (const linha of linhas) {
    const codigo = limparCodigo(linha.codigo ?? "");
    const nome = (linha.descricao ?? "").replace(/\s+/g, " ").trim();
    if (!codigo || !nome || vistos.has(codigo)) continue;
    vistos.add(codigo);

    const classe = classificarProduto(nome);
    const imagem = linha.imagem_url && linha.imagem_url !== "null" ? linha.imagem_url.trim() : null;
    variantes.push({
      codigo,
      nome,
      familia: classe.familia,
      categoria: classe.categoria,
      marca: classe.marca,
      atributos: classe.atributos,
      preco: lerPreco(linha.preco),
      imagem_url: imagem || null,
    });
  }
  return variantes;
}

function sqlDaEstrutura(variantes: Variante[]): string {
  const categorias = [...new Set(variantes.map((v) => v.categoria))].sort();
  const familias = new Map<string, string>();
  for (const v of variantes) familias.set(v.familia, v.categoria);

  const linhasCategoria = categorias.map(
    (nome) => `  (${aspas(nome)}, 0, ${aspas(JSON.stringify(ATRIBUTOS_PADRAO))}::jsonb)`,
  );
  const linhasFamilia = [...familias.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([familia, categoria]) => `  (${aspas(familia)}, ${aspas(categoria)})`);

  return `-- Catálogo real 3G: categorias e famílias. Gerado por backend/supabase/tools/gerar-catalogo.ts.
-- Pode ser aplicado mais de uma vez. Aplique ANTES dos arquivos de variantes.
begin;
set local search_path = estoque, public;

insert into categorias (nome, limiar_padrao, atributos) values
${linhasCategoria.join(",\n")}
on conflict (nome) do nothing;

insert into familias (nome, categoria_id)
select v.nome, c.id
from (values
${linhasFamilia.join(",\n")}
) as v(nome, categoria)
join categorias c on c.nome = v.categoria
on conflict (nome) do update set categoria_id = excluded.categoria_id, ativo = true;

commit;
`;
}

function sqlDoLote(lote: Variante[], numero: number, total: number): string {
  const linhas = lote.map(
    (v) =>
      `  (${aspas(v.codigo)}, ${aspas(v.nome)}, ${aspas(v.familia)}, ${textoOuNulo(v.marca)}, ` +
      `${aspas(JSON.stringify(v.atributos))}::jsonb, ${v.preco ?? "null"}::numeric, ${textoOuNulo(v.imagem_url)})`,
  );
  return `-- Catálogo real 3G: variantes, lote ${numero} de ${total}. Aplique depois de 000-estrutura.sql
-- e da migração do schema estoque. Pode ser aplicado mais de uma vez.
begin;
set local search_path = estoque, public;

insert into variantes (codigo, nome, familia_id, marca, atributos, preco, imagem_url)
select v.codigo, v.nome, f.id, v.marca, v.atributos, v.preco, v.imagem_url
from (values
${linhas.join(",\n")}
) as v(codigo, nome, familia, marca, atributos, preco, imagem_url)
join familias f on f.nome = v.familia
on conflict (codigo) do update set
  nome = excluded.nome,
  familia_id = excluded.familia_id,
  marca = excluded.marca,
  atributos = excluded.atributos,
  preco = excluded.preco,
  imagem_url = coalesce(excluded.imagem_url, variantes.imagem_url),
  atualizado_em = now();

commit;
`;
}

function resumo(variantes: Variante[]): string {
  const contar = (chave: (v: Variante) => string): string =>
    Object.entries(
      variantes.reduce<Record<string, number>>((acc, v) => {
        const nome = chave(v);
        return { ...acc, [nome]: (acc[nome] ?? 0) + 1 };
      }, {}),
    )
      .sort((a, b) => b[1] - a[1])
      .map(([nome, n]) => `  ${String(n).padStart(5)}  ${nome}`)
      .join("\n");

  const diversos = variantes.filter((v) => v.categoria === CATEGORIA_FALLBACK).length;
  return [
    `Variantes: ${variantes.length}`,
    `Sem classificação (Diversos): ${diversos} (${((diversos / variantes.length) * 100).toFixed(1)}%)`,
    `Sem marca: ${variantes.filter((v) => !v.marca).length}`,
    `\nPor categoria:\n${contar((v) => v.categoria)}`,
    `\nPor marca:\n${contar((v) => v.marca ?? "(sem marca)")}`,
    `\nPor família:\n${contar((v) => v.familia)}`,
  ].join("\n");
}

function principal(): void {
  const caminho = process.argv[2];
  if (!caminho) {
    console.error('Informe o caminho do produtos.db. Ex.: npm run catalogo:gerar -- "D:/sistemaDocumentos/gedoc/produtos.db"');
    process.exit(1);
  }

  const variantes = lerVariantes(caminho);
  const destino = join(dirname(fileURLToPath(import.meta.url)), "..", "catalogo-real");
  mkdirSync(destino, { recursive: true });
  for (const arquivo of readdirSync(destino)) {
    if (arquivo.endsWith(".sql")) rmSync(join(destino, arquivo));
  }

  writeFileSync(join(destino, "000-estrutura.sql"), sqlDaEstrutura(variantes));
  const totalDeLotes = Math.ceil(variantes.length / TAMANHO_DO_LOTE);
  for (let i = 0; i < totalDeLotes; i++) {
    const lote = variantes.slice(i * TAMANHO_DO_LOTE, (i + 1) * TAMANHO_DO_LOTE);
    const nome = `${String(i + 1).padStart(3, "0")}-variantes.sql`;
    writeFileSync(join(destino, nome), sqlDoLote(lote, i + 1, totalDeLotes));
  }

  const texto = resumo(variantes);
  writeFileSync(join(destino, "RESUMO.txt"), texto);
  console.log(texto);
  console.log(`\nArquivos gerados em ${destino}`);
}

principal();
