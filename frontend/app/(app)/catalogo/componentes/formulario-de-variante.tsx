"use client";

import { useState } from "react";
import { Alerta } from "@/components/ui/alerta";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";
import { CampoDeImagem } from "@/components/ui/campo-de-imagem";
import { CampoDeMarcacao } from "@/components/ui/campo-de-marcacao";
import { Cartao } from "@/components/ui/cartao";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Selecao } from "@/components/ui/selecao";
import { usePrototipo } from "@/prototipo/contexto";

interface FormularioDeVarianteProps {
  id?: string;
  familiaInicial?: string;
  aoFechar: () => void;
}

export function FormularioDeVariante({
  id,
  familiaInicial,
  aoFechar,
}: FormularioDeVarianteProps) {
  const { dados, criarVariante, editarVariante, categoriaDaFamilia } = usePrototipo();
  const variante = id ? dados.variantes.find((item) => item.id === id) : undefined;

  const [codigo, setCodigo] = useState(variante?.codigo ?? "");
  const [nome, setNome] = useState(variante?.nome ?? "");
  const [familiaId, setFamiliaId] = useState(
    variante?.familia_id ?? familiaInicial ?? dados.familias[0]?.id ?? "",
  );
  const [atributos, setAtributos] = useState<Record<string, string>>(() => {
    const iniciais: Record<string, string> = {};
    for (const [chave, valor] of Object.entries(variante?.atributos ?? {})) {
      iniciais[chave] = String(valor);
    }
    return iniciais;
  });
  const [preco, setPreco] = useState(
    variante?.preco != null ? String(variante.preco) : "",
  );
  const [estoqueMinimo, setEstoqueMinimo] = useState(
    variante?.estoque_minimo != null ? String(variante.estoque_minimo) : "",
  );
  const [monitorar, setMonitorar] = useState(variante?.monitorar ?? true);
  const [ativo, setAtivo] = useState(variante?.ativo ?? true);
  const [imagemUrl, setImagemUrl] = useState<string | null>(variante?.imagem_url ?? null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (dados.familias.length === 0) {
    return (
      <Cartao titulo="Crie uma família primeiro">
        <Alerta tom="atencao">
          Toda variante precisa estar dentro de uma família. Cadastre uma família e volte aqui.
        </Alerta>
        <Botao variante="secundario" className="mt-3" onClick={aoFechar}>
          Fechar
        </Botao>
      </Cartao>
    );
  }

  if (id && !variante) {
    return (
      <Cartao titulo="Variante não encontrada">
        <Alerta tom="erro">A variante não existe mais. Feche e tente de novo.</Alerta>
        <Botao variante="secundario" className="mt-3" onClick={aoFechar}>
          Fechar
        </Botao>
      </Cartao>
    );
  }

  const categoria = familiaId ? categoriaDaFamilia(familiaId) : undefined;
  const atributosDaCategoria = categoria?.atributos ?? [];

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    if (!familiaId) {
      setErro("Escolha a família da variante.");
      return;
    }

    const precoNumero = preco.trim() === "" ? null : Number(preco);
    if (precoNumero != null && (!Number.isFinite(precoNumero) || precoNumero < 0)) {
      setErro("O preço precisa ser um número maior ou igual a zero.");
      return;
    }

    const minimoNumero = estoqueMinimo.trim() === "" ? null : Number(estoqueMinimo);
    if (
      minimoNumero != null &&
      (!Number.isInteger(minimoNumero) || minimoNumero < 0)
    ) {
      setErro("O estoque mínimo precisa ser um número inteiro maior ou igual a zero.");
      return;
    }

    const dadosDaVariante = {
      familia_id: familiaId,
      codigo,
      nome,
      atributos,
      preco: precoNumero,
      estoque_minimo: minimoNumero,
      monitorar,
      ativo,
      imagem_url: imagemUrl ?? undefined,
    };

    setEnviando(true);
    const resultado = id
      ? await editarVariante(id, dadosDaVariante)
      : await criarVariante(dadosDaVariante);
    setEnviando(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    aoFechar();
  }

  return (
    <Cartao
      titulo={id ? "Editar variante" : "Nova variante"}
      descricao="O código é a referência única do item no estoque, nas etiquetas e nas buscas."
    >
      <form onSubmit={enviar} className="space-y-4">
        {erro && <Alerta tom="erro">{erro}</Alerta>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Código"
            value={codigo}
            onChange={(evento) => setCodigo(evento.target.value)}
            placeholder="Ex.: REF-SLIM-50-5K-BI"
            autoCapitalize="characters"
            maxLength={60}
            required
          />
          <Campo
            rotulo="Nome da variante"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            placeholder="Ex.: Refletor Slim 50 W 5000 K bivolt"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Selecao
            rotulo="Família"
            value={familiaId}
            onChange={(evento) => setFamiliaId(evento.target.value)}
            required
          >
            {dados.familias
              .slice()
              .sort((a, b) => a.nome.localeCompare(b.nome))
              .map((familia) => (
                <option key={familia.id} value={familia.id}>
                  {familia.nome}
                </option>
              ))}
          </Selecao>
          <div className="flex items-end pb-1">
            {categoria ? (
              <Etiqueta tom="info">Categoria: {categoria.nome}</Etiqueta>
            ) : (
              <span className="text-xs text-slate-400">A família não tem categoria.</span>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-800">Características</p>
          {atributosDaCategoria.length === 0 ? (
            <p className="mt-1 text-xs text-slate-500">
              A categoria desta família ainda não tem características. Você pode salvar só com código
              e nome.
            </p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {atributosDaCategoria.map((atributo) => (
                <Campo
                  key={atributo.chave}
                  rotulo={atributo.rotulo}
                  type={atributo.tipo === "numero" ? "number" : "text"}
                  step={atributo.tipo === "numero" ? "any" : undefined}
                  value={atributos[atributo.chave] ?? ""}
                  onChange={(evento) =>
                    setAtributos((atuais) => ({
                      ...atuais,
                      [atributo.chave]: evento.target.value,
                    }))
                  }
                  placeholder={atributo.tipo === "numero" ? "0" : "Ex.: bivolt"}
                />
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Preço (R$)"
            type="number"
            min={0}
            step="0.01"
            value={preco}
            onChange={(evento) => setPreco(evento.target.value)}
            placeholder="0,00"
            dica="Opcional."
          />
          <Campo
            rotulo="Estoque mínimo"
            type="number"
            min={0}
            step={1}
            value={estoqueMinimo}
            onChange={(evento) => setEstoqueMinimo(evento.target.value)}
            placeholder={categoria ? String(categoria.limiar_padrao) : "0"}
            dica={
              categoria
                ? `Vazio = herda o mínimo da categoria (${categoria.limiar_padrao}).`
                : "Vazio = herda o mínimo da categoria."
            }
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <CampoDeMarcacao
            rotulo="Monitorar estoque baixo"
            descricao="Entra no aviso quando o saldo ficar abaixo do mínimo."
            checked={monitorar}
            onChange={setMonitorar}
          />
          <CampoDeMarcacao
            rotulo="Variante ativa"
            descricao="Variantes inativas não aparecem na consulta e não podem ser movimentadas."
            checked={ativo}
            onChange={setAtivo}
          />
        </div>

        <CampoDeImagem rotulo="Imagem da variante" valor={imagemUrl} aoMudar={setImagemUrl} />

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          <Botao type="button" variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao type="submit" carregando={enviando}>
            {id ? "Salvar alterações" : "Criar variante"}
          </Botao>
        </div>
      </form>
    </Cartao>
  );
}
