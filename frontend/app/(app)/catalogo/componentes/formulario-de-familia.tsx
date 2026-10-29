"use client";

import { useState } from "react";
import { Alerta } from "@/components/ui/alerta";
import { AreaDeTexto } from "@/components/ui/area-de-texto";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";
import { CampoDeImagem } from "@/components/ui/campo-de-imagem";
import { CampoDeMarcacao } from "@/components/ui/campo-de-marcacao";
import { Cartao } from "@/components/ui/cartao";
import { Selecao } from "@/components/ui/selecao";
import { usePrototipo } from "@/prototipo/contexto";

interface FormularioDeFamiliaProps {
  id?: string;
  categoriaInicial?: string;
  aoFechar: () => void;
}

export function FormularioDeFamilia({
  id,
  categoriaInicial,
  aoFechar,
}: FormularioDeFamiliaProps) {
  const { dados, criarFamilia, editarFamilia } = usePrototipo();
  const familia = id ? dados.familias.find((item) => item.id === id) : undefined;

  const [nome, setNome] = useState(familia?.nome ?? "");
  const [categoriaId, setCategoriaId] = useState(
    familia?.categoria_id ?? categoriaInicial ?? dados.categorias[0]?.id ?? "",
  );
  const [descricao, setDescricao] = useState(familia?.descricao ?? "");
  const [imagemUrl, setImagemUrl] = useState<string | null>(familia?.imagem_url ?? null);
  const [ativo, setAtivo] = useState(familia?.ativo ?? true);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (dados.categorias.length === 0) {
    return (
      <Cartao titulo="Crie uma categoria primeiro">
        <Alerta tom="atencao">
          Toda família precisa estar dentro de uma categoria. Cadastre uma categoria e volte aqui.
        </Alerta>
        <Botao variante="secundario" className="mt-3" onClick={aoFechar}>
          Fechar
        </Botao>
      </Cartao>
    );
  }

  if (id && !familia) {
    return (
      <Cartao titulo="Família não encontrada">
        <Alerta tom="erro">A família não existe mais. Feche e tente de novo.</Alerta>
        <Botao variante="secundario" className="mt-3" onClick={aoFechar}>
          Fechar
        </Botao>
      </Cartao>
    );
  }

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    if (!categoriaId) {
      setErro("Escolha a categoria da família.");
      return;
    }

    const dadosDaFamilia = {
      categoria_id: categoriaId,
      nome,
      descricao,
      imagem_url: imagemUrl ?? undefined,
      ativo,
    };

    setEnviando(true);
    const resultado = id
      ? await editarFamilia(id, dadosDaFamilia)
      : await criarFamilia(dadosDaFamilia);
    setEnviando(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    aoFechar();
  }

  return (
    <Cartao
      titulo={id ? "Editar família" : "Nova família"}
      descricao="A foto e a descrição aparecem na consulta do produto."
    >
      <form onSubmit={enviar} className="space-y-4">
        {erro && <Alerta tom="erro">{erro}</Alerta>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Nome da família"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            placeholder="Ex.: Refletor Slim"
            required
          />
          <Selecao
            rotulo="Categoria"
            value={categoriaId}
            onChange={(evento) => setCategoriaId(evento.target.value)}
            required
          >
            {dados.categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </Selecao>
        </div>

        <AreaDeTexto
          rotulo="Descrição"
          value={descricao}
          onChange={(evento) => setDescricao(evento.target.value)}
          placeholder="Uma frase sobre o uso ou o material desta família."
          dica="Opcional."
        />

        <CampoDeImagem rotulo="Imagem da família" valor={imagemUrl} aoMudar={setImagemUrl} />

        <CampoDeMarcacao
          rotulo="Família ativa"
          descricao="Famílias inativas continuam no histórico, mas não aparecem na consulta."
          checked={ativo}
          onChange={setAtivo}
        />

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          <Botao type="button" variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao type="submit" carregando={enviando}>
            {id ? "Salvar alterações" : "Criar família"}
          </Botao>
        </div>
      </form>
    </Cartao>
  );
}
