// Caminho completo de um local na árvore ("Galpão 1 > Setor A > Módulo 03").
// Usado por quem mostra locais ao usuário (documentos, inventários).

export interface LocalDaArvore {
  id: string;
  pai_id: string | null;
  nome: string;
  codigo: string;
  ativo: boolean;
}

export function montarCaminhos(locais: readonly LocalDaArvore[]): (localId: string) => string {
  const porId = new Map(locais.map((local) => [local.id, local]));
  return (localId) => {
    const nomes: string[] = [];
    const vistos = new Set<string>();
    let atual = porId.get(localId);
    while (atual && !vistos.has(atual.id)) {
      vistos.add(atual.id);
      nomes.unshift(atual.nome);
      atual = atual.pai_id ? porId.get(atual.pai_id) : undefined;
    }
    return nomes.join(" > ");
  };
}
