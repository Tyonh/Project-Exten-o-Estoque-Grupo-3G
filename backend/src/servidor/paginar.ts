// O Supabase devolve no máximo 1000 linhas por consulta e corta o resto sem
// avisar. O catálogo real da 3G tem milhares de variantes, então leituras
// completas (catálogo, saldos) precisam buscar em páginas.

const TAMANHO_DA_PAGINA = 1000;
const MAX_PAGINAS = 50;

interface RespostaDaPagina<T> {
  data: T[] | null;
  error: { message: string } | null;
}

const TAMANHO_DO_LOTE_DE_IDS = 100;

/** Divide uma lista em lotes. Um `.in()` com milhares de ids estoura o tamanho da URL. */
export function emLotes<T>(itens: readonly T[], tamanho = TAMANHO_DO_LOTE_DE_IDS): T[][] {
  const lotes: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) lotes.push(itens.slice(i, i + tamanho));
  return lotes;
}

/**
 * Lê todas as linhas de uma consulta, página a página. `buscarPagina` recebe o
 * intervalo (inclusivo) e deve aplicar `.range(de, ate)` com uma ordenação
 * estável, senão linhas podem repetir ou faltar entre as páginas.
 */
export async function lerTodasAsLinhas<T>(
  buscarPagina: (de: number, ate: number) => PromiseLike<RespostaDaPagina<T>>,
): Promise<{ data: T[]; error: { message: string } | null }> {
  const linhas: T[] = [];
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    const de = pagina * TAMANHO_DA_PAGINA;
    const { data, error } = await buscarPagina(de, de + TAMANHO_DA_PAGINA - 1);
    if (error) return { data: [], error };
    const recebidas = data ?? [];
    linhas.push(...recebidas);
    if (recebidas.length < TAMANHO_DA_PAGINA) return { data: linhas, error: null };
  }
  return { data: [], error: { message: "Consulta passou do limite de páginas." } };
}
