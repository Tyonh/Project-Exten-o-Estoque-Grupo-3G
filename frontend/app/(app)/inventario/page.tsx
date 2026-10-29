"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ClipboardCheck, Plus } from "lucide-react";
import { podeOperar } from "@estoque/backend/cargos";
import { abrirInventario, listarInventarios } from "@estoque/backend/inventarios";
import type { Inventario, StatusInventario } from "@estoque/backend/tipos";
import { Pagina } from "@/components/layout/pagina";
import { Alerta } from "@/components/ui/alerta";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";
import { Carregando } from "@/components/ui/carregando";
import { Cartao } from "@/components/ui/cartao";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Selecao } from "@/components/ui/selecao";
import { usePrototipo } from "@/prototipo/contexto";
import { formatarDataHora } from "@/prototipo/formatos";

const ROTULO_STATUS: Record<StatusInventario, string> = {
  aberto: "Aberto",
  concluido: "Concluído",
  cancelado: "Cancelado",
};
const TOM_STATUS: Record<StatusInventario, "info" | "sucesso" | "neutro"> = {
  aberto: "info",
  concluido: "sucesso",
  cancelado: "neutro",
};

/** T7.1: lista de inventários e abertura de um novo por local. */
export default function InventarioPage() {
  const router = useRouter();
  const { cargoVisualizado, dados, caminhoDoLocal } = usePrototipo();
  const operador = podeOperar(cargoVisualizado);

  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [abrindoForm, setAbrindoForm] = useState(false);
  const [localId, setLocalId] = useState("");
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erroDoForm, setErroDoForm] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    listarInventarios().then((resultado) => {
      if (cancelado) return;
      if (resultado.ok) setInventarios(resultado.dados);
      else setErro(resultado.erro);
      setCarregando(false);
    });
    return () => {
      cancelado = true;
    };
  }, []);

  const locaisAtivos = dados.locais
    .filter((local) => local.ativo)
    .sort((a, b) => caminhoDoLocal(a.id).localeCompare(caminhoDoLocal(b.id)));

  async function abrir(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setErroDoForm(null);
    const resultado = await abrirInventario(localId, observacao);
    setEnviando(false);
    if (resultado.ok) {
      router.push(`/inventario/${resultado.dados.id}`);
    } else {
      setErroDoForm(resultado.erro);
    }
  }

  return (
    <Pagina
      sobretitulo="Etapa 7"
      titulo="Inventário"
      descricao="A contagem física de um local, comparada com o saldo do sistema."
      acoes={
        operador && !abrindoForm ? (
          <Botao icone={Plus} onClick={() => setAbrindoForm(true)}>
            Abrir inventário
          </Botao>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {operador && abrindoForm && (
          <Cartao titulo="Abrir inventário" descricao="Só pode haver um inventário aberto por local.">
            <form onSubmit={abrir} className="space-y-3">
              <Selecao
                rotulo="Local a contar"
                value={localId}
                onChange={(evento) => setLocalId(evento.target.value)}
                required
              >
                <option value="">Escolha o local</option>
                {locaisAtivos.map((local) => (
                  <option key={local.id} value={local.id}>
                    {caminhoDoLocal(local.id)} · {local.codigo}
                  </option>
                ))}
              </Selecao>
              <Campo
                rotulo="Observação (opcional)"
                value={observacao}
                onChange={(evento) => setObservacao(evento.target.value)}
                maxLength={200}
              />
              {erroDoForm && <Alerta tom="erro">{erroDoForm}</Alerta>}
              <div className="flex flex-wrap gap-2">
                <Botao type="submit" carregando={enviando} disabled={!localId}>
                  Abrir e começar a contar
                </Botao>
                <Botao type="button" variante="fantasma" onClick={() => setAbrindoForm(false)}>
                  Cancelar
                </Botao>
              </div>
            </form>
          </Cartao>
        )}

        {carregando && <Carregando texto="Carregando inventários..." />}
        {!carregando && erro && <Alerta tom="erro">{erro}</Alerta>}
        {!carregando && !erro && inventarios.length === 0 && (
          <EstadoVazio
            icone={ClipboardCheck}
            titulo="Nenhum inventário ainda"
            descricao="Escolha um local para abrir um inventário. Só pode haver um aberto por local."
          />
        )}
        {!carregando && !erro && inventarios.length > 0 && (
          <ul className="space-y-2">
            {inventarios.map((inventario) => (
              <li key={inventario.id}>
                <Link
                  href={
                    inventario.status === "aberto"
                      ? `/inventario/${inventario.id}`
                      : `/inventario/${inventario.id}/resumo`
                  }
                  className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:border-marca-300"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {inventario.local_codigo} · {inventario.local_caminho}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {inventario.total_contados} de {inventario.total_de_itens} contados · aberto por{" "}
                      {inventario.aberto_por_nome} em {formatarDataHora(inventario.aberto_em)}
                    </p>
                  </div>
                  <Etiqueta tom={TOM_STATUS[inventario.status]}>{ROTULO_STATUS[inventario.status]}</Etiqueta>
                  <ChevronRight className="size-4 shrink-0 text-slate-400" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Pagina>
  );
}
