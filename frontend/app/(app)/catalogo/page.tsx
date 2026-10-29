"use client";

import { useState } from "react";
import { Pagina } from "@/components/layout/pagina";
import { Abas } from "@/components/ui/abas";
import { AbaCategorias } from "./componentes/aba-categorias";
import { AbaFamilias } from "./componentes/aba-familias";
import { AbaVariantes } from "./componentes/aba-variantes";
import { usePrototipo } from "@/prototipo/contexto";

type AbaDoCatalogo = "variantes" | "familias" | "categorias";

export default function CatalogoPage() {
  const { dados } = usePrototipo();
  const [aba, setAba] = useState<AbaDoCatalogo>("variantes");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
  const [familiaFiltro, setFamiliaFiltro] = useState<string | null>(null);

  function mudarAba(valor: string) {
    const proxima = valor as AbaDoCatalogo;
    setAba(proxima);
    if (proxima !== "familias") setCategoriaFiltro(null);
    if (proxima !== "variantes") setFamiliaFiltro(null);
  }

  return (
    <Pagina
      titulo="Catálogo"
      descricao="Organize as categorias, as famílias e as variantes que o estoque pode guardar."
    >
      <Abas
        valor={aba}
        aoMudar={mudarAba}
        rotulo="Seções do catálogo"
        abas={[
          { valor: "variantes", rotulo: "Variantes", contagem: dados.variantes.length },
          { valor: "familias", rotulo: "Famílias", contagem: dados.familias.length },
          { valor: "categorias", rotulo: "Categorias", contagem: dados.categorias.length },
        ]}
      />

      <div className="mt-5">
        {aba === "categorias" && (
          <AbaCategorias
            aoVerFamilias={(categoriaId) => {
              setCategoriaFiltro(categoriaId);
              setAba("familias");
            }}
          />
        )}

        {aba === "familias" && (
          <AbaFamilias
            categoriaFiltro={categoriaFiltro}
            aoLimparFiltro={() => setCategoriaFiltro(null)}
            aoVerVariantes={(familiaId) => {
              setFamiliaFiltro(familiaId);
              setAba("variantes");
            }}
          />
        )}

        {aba === "variantes" && (
          <AbaVariantes
            familiaFiltro={familiaFiltro}
            aoLimparFiltro={() => setFamiliaFiltro(null)}
          />
        )}
      </div>
    </Pagina>
  );
}
