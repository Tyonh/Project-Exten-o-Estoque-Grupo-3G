"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, Check, Copy, Trash2, UserPlus, Users, UserX } from "lucide-react";
import { type Cargo } from "@estoque/backend/cargos";
import {
  alterarCargo,
  apagarUsuario,
  criarUsuario,
  desconectarUsuario,
  listarUsuarios,
  transferirUsuario,
} from "@estoque/backend/usuarios";
import { Pagina } from "@/components/layout/pagina";
import { Alerta } from "@/components/ui/alerta";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";
import { Cartao } from "@/components/ui/cartao";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Selecao } from "@/components/ui/selecao";
import { ROTULO_CARGO } from "@/lib/rotulos";
import { formatarDataHora } from "@/prototipo/formatos";
import type { Usuario } from "@estoque/backend/tipos";
import { usePrototipo } from "@/prototipo/contexto";

const CARGOS_ATRIBUIVEIS: Cargo[] = ["estoquista", "gerente", "gerente_estoque", "admin"];
const CARGOS_DO_FILTRO: Cargo[] = [...CARGOS_ATRIBUIVEIS, "pendente"];

function tomDoCargo(cargo: Cargo): "sucesso" | "info" | "neutro" | "alerta" {
  if (cargo === "admin") return "sucesso";
  if (cargo === "gerente_estoque") return "info";
  if (cargo === "pendente") return "alerta";
  return "neutro";
}

function ordenarUsuarios(lista: Usuario[]): Usuario[] {
  return [...lista].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

interface SenhaGerada {
  nome: string;
  email: string;
  senha: string;
  motivo: "criado" | "transferido";
}

export default function UsuariosPage() {
  const { perfil } = usePrototipo();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cargo, setCargo] = useState<Cargo>("estoquista");
  const [enviando, setEnviando] = useState(false);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [desconectandoId, setDesconectandoId] = useState<string | null>(null);
  const [apagandoId, setApagandoId] = useState<string | null>(null);
  const [transferindoId, setTransferindoId] = useState<string | null>(null);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [enviandoTransferencia, setEnviandoTransferencia] = useState(false);
  const [senhaGerada, setSenhaGerada] = useState<SenhaGerada | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let cancelado = false;

    listarUsuarios().then((resultado) => {
      if (cancelado) return;
      if (!resultado.ok) {
        setErro(resultado.erro);
      } else {
        setUsuarios(ordenarUsuarios(resultado.dados));
      }
      setCarregando(false);
    });

    return () => {
      cancelado = true;
    };
  }, []);

  async function enviarNovo(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setAviso(null);
    setEnviando(true);

    const resultado = await criarUsuario({ nome, email, cargo });
    setEnviando(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    setUsuarios((atuais) => ordenarUsuarios([...atuais, resultado.dados.perfil]));
    setSenhaGerada({
      nome: resultado.dados.perfil.nome,
      email: resultado.dados.perfil.email,
      senha: resultado.dados.senha_provisoria,
      motivo: "criado",
    });
    setNome("");
    setEmail("");
    setCargo("estoquista");
    setFormularioAberto(false);
    setAviso(`Acesso de ${resultado.dados.perfil.nome} criado.`);
  }

  async function mudarCargo(usuario: Usuario, novoCargo: Cargo) {
    if (novoCargo === usuario.cargo) return;

    setErro(null);
    setAviso(null);
    setTransferindoId(null);
    setSalvandoId(usuario.id);

    const resultado = await alterarCargo(usuario.id, novoCargo);
    setSalvandoId(null);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    setUsuarios((atuais) =>
      ordenarUsuarios(atuais.map((item) => (item.id === usuario.id ? resultado.dados : item))),
    );
    setAviso(`Cargo de ${usuario.nome} atualizado para ${ROTULO_CARGO[resultado.dados.cargo]}.`);
  }

  async function desconectar(usuario: Usuario) {
    const confirmado = window.confirm(
      `Desconectar ${usuario.nome}? A pessoa perde o acesso, mas o histórico é mantido.`,
    );
    if (!confirmado) return;

    setErro(null);
    setAviso(null);
    setTransferindoId(null);
    setDesconectandoId(usuario.id);

    const resultado = await desconectarUsuario(usuario.id);
    setDesconectandoId(null);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    setUsuarios((atuais) =>
      ordenarUsuarios(atuais.map((item) => (item.id === usuario.id ? resultado.dados : item))),
    );
    setAviso(`Acesso de ${usuario.nome} desconectado.`);
  }

  async function apagar(usuario: Usuario) {
    const confirmado = window.confirm(
      `Apagar definitivamente ${usuario.nome}? O login e o perfil serão removidos. Se a conta tiver histórico, o sistema não vai apagar. Esta ação não pode ser desfeita.`,
    );
    if (!confirmado) return;

    setErro(null);
    setAviso(null);
    setTransferindoId(null);
    setApagandoId(usuario.id);

    const resultado = await apagarUsuario(usuario.id);
    setApagandoId(null);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    setUsuarios((atuais) => atuais.filter((item) => item.id !== usuario.id));
    if (senhaGerada?.email === usuario.email) setSenhaGerada(null);
    setAviso(`Conta de ${usuario.nome} apagada definitivamente.`);
  }

  function abrirTransferencia(usuario: Usuario) {
    setErro(null);
    setAviso(null);
    setTransferindoId(usuario.id);
    setNovoNome(usuario.nome);
    setNovoEmail(usuario.email);
  }

  function cancelarTransferencia() {
    setTransferindoId(null);
    setNovoNome("");
    setNovoEmail("");
  }

  async function enviarTransferencia(
    evento: React.FormEvent<HTMLFormElement>,
    usuario: Usuario,
  ) {
    evento.preventDefault();
    setErro(null);
    setAviso(null);
    setEnviandoTransferencia(true);

    const resultado = await transferirUsuario(usuario.id, {
      nome: novoNome,
      email: novoEmail,
    });
    setEnviandoTransferencia(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    setUsuarios((atuais) =>
      ordenarUsuarios(
        atuais.map((item) => (item.id === usuario.id ? resultado.dados.perfil : item)),
      ),
    );
    setSenhaGerada({
      nome: resultado.dados.perfil.nome,
      email: resultado.dados.perfil.email,
      senha: resultado.dados.senha_provisoria,
      motivo: "transferido",
    });
    setTransferindoId(null);
    setNovoNome("");
    setNovoEmail("");
    setAviso(`Conta transferida para ${resultado.dados.perfil.nome}.`);
  }

  async function copiarSenha() {
    if (!senhaGerada) return;
    try {
      await navigator.clipboard.writeText(senhaGerada.senha);
      setCopiado(true);
    } catch {
      setErro("Não foi possível copiar automaticamente. Selecione a senha e copie.");
    }
  }

  const ativos = usuarios.filter((usuario) => usuario.cargo !== "pendente").length;
  const pendentes = usuarios.filter((usuario) => usuario.cargo === "pendente").length;

  return (
    <Pagina
      sobretitulo="Administração"
      titulo="Usuários"
      descricao="Crie o acesso de cada pessoa e defina o que ela pode fazer no sistema."
      acoes={
        <Botao
          icone={UserPlus}
          onClick={() => {
            setFormularioAberto((aberto) => !aberto);
            setErro(null);
            setAviso(null);
          }}
        >
          {formularioAberto ? "Fechar cadastro" : "Novo acesso"}
        </Botao>
      }
    >
      <div className="mb-5 grid grid-cols-2 overflow-hidden rounded-lg border-l border-t border-slate-200 bg-white sm:grid-cols-3">
        <div className="border-b border-r border-slate-200 p-4">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Acessos ativos
          </p>
          <p className="tabular mt-1 font-display text-3xl font-bold tracking-tight text-slate-900">
            {ativos}
          </p>
        </div>
        <div className="border-b border-r border-slate-200 p-4">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Pendentes
          </p>
          <p className="tabular mt-1 font-display text-3xl font-bold tracking-tight text-amber-700">
            {pendentes}
          </p>
        </div>
        <div className="col-span-2 border-b border-r border-slate-200 p-4 sm:col-span-1">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Total
          </p>
          <p className="tabular mt-1 font-display text-3xl font-bold tracking-tight text-slate-900">
            {usuarios.length}
          </p>
        </div>
      </div>

      {erro && <Alerta tom="erro" className="mb-4">{erro}</Alerta>}
      {aviso && <Alerta tom="sucesso" className="mb-4">{aviso}</Alerta>}

      {senhaGerada && (
        <Cartao
          titulo={senhaGerada.motivo === "criado" ? "Acesso criado" : "Conta transferida"}
          descricao={`Entregue a senha provisória para ${senhaGerada.nome}. Ela não será mostrada de novo.`}
          icone={Check}
          className="mb-4 border-emerald-200"
        >
          <p className="text-sm text-slate-600">{senhaGerada.email}</p>
          <div className="mt-3 flex flex-col gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 break-all font-mono text-lg font-semibold text-emerald-900">
              {senhaGerada.senha}
            </code>
            <Botao
              type="button"
              variante="secundario"
              tamanho="sm"
              icone={copiado ? Check : Copy}
              onClick={copiarSenha}
              className="shrink-0"
            >
              {copiado ? "Copiada" : "Copiar senha"}
            </Botao>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            No primeiro acesso, o sistema pede para trocar a senha provisória antes de liberar as telas.
          </p>
        </Cartao>
      )}

      {formularioAberto && (
        <div className="mb-4">
          <Cartao
            titulo="Novo acesso"
            descricao="O login já nasce liberado com o perfil escolhido. Não há cadastro público."
          >
            <form onSubmit={enviarNovo} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo
                  rotulo="Nome completo"
                  required
                  autoComplete="name"
                  value={nome}
                  onChange={(evento) => setNome(evento.target.value)}
                />
                <Campo
                  rotulo="E-mail"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                />
              </div>
              <Selecao
                rotulo="Perfil de acesso"
                value={cargo}
                onChange={(evento) => setCargo(evento.target.value as Cargo)}
                dica="O perfil define as telas e ações disponíveis."
              >
                {CARGOS_ATRIBUIVEIS.map((valor) => (
                  <option key={valor} value={valor}>
                    {ROTULO_CARGO[valor]}
                  </option>
                ))}
              </Selecao>
              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                <Botao
                  type="button"
                  variante="secundario"
                  onClick={() => setFormularioAberto(false)}
                >
                  Cancelar
                </Botao>
                <Botao type="submit" carregando={enviando} icone={UserPlus}>
                  Criar acesso
                </Botao>
              </div>
            </form>
          </Cartao>
        </div>
      )}

      {carregando ? (
        <p className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          Carregando usuários...
        </p>
      ) : usuarios.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center">
          <Users className="mx-auto size-8 text-slate-300" aria-hidden />
          <p className="mt-2 text-sm font-semibold text-slate-800">Nenhum acesso criado</p>
          <p className="mt-1 text-xs text-slate-500">
            Use “Novo acesso” para liberar a primeira pessoa.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {usuarios.map((usuario) => {
            const ehVoce = usuario.id === perfil.id;
            return (
              <article key={usuario.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                      <span className="truncate">{usuario.nome}</span>
                      {ehVoce && <Etiqueta tom="neutro">Você</Etiqueta>}
                    </p>
                    <p className="truncate text-xs text-slate-500">{usuario.email}</p>
                    <p className="mt-0.5 text-[0.6875rem] text-slate-400">
                      Criado em {formatarDataHora(usuario.criado_em)}
                    </p>
                  </div>
                  <Etiqueta tom={tomDoCargo(usuario.cargo)}>
                    {ROTULO_CARGO[usuario.cargo]}
                  </Etiqueta>
                </div>

                <div className="mt-3 max-w-xs">
                  <Selecao
                    rotulo="Perfil de acesso"
                    value={usuario.cargo}
                    disabled={
                      ehVoce ||
                      salvandoId === usuario.id ||
                      desconectandoId === usuario.id ||
                      apagandoId === usuario.id
                    }
                    onChange={(evento) => mudarCargo(usuario, evento.target.value as Cargo)}
                    dica={
                      ehVoce
                        ? "Você não pode alterar o próprio cargo."
                        : salvandoId === usuario.id
                          ? "Salvando..."
                          : usuario.cargo === "pendente"
                            ? "Escolha um perfil para liberar o acesso de novo."
                            : "Desconectar encerra; Transferir troca o titular; Apagar remove a conta sem histórico."
                    }
                  >
                    {CARGOS_DO_FILTRO.map((valor) => (
                      <option key={valor} value={valor}>
                        {ROTULO_CARGO[valor]}
                      </option>
                    ))}
                  </Selecao>

                  {!ehVoce && (
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Botao
                        variante="secundario"
                        tamanho="sm"
                        icone={ArrowLeftRight}
                        onClick={() =>
                          transferindoId === usuario.id
                            ? cancelarTransferencia()
                            : abrirTransferencia(usuario)
                        }
                        className="w-full sm:w-auto"
                      >
                        {transferindoId === usuario.id
                          ? "Cancelar transferência"
                          : "Transferir conta"}
                      </Botao>
                      {usuario.cargo !== "pendente" && (
                        <Botao
                          variante="secundario"
                          tamanho="sm"
                          icone={UserX}
                          carregando={desconectandoId === usuario.id}
                          onClick={() => desconectar(usuario)}
                          className="w-full sm:w-auto"
                        >
                          Desconectar
                        </Botao>
                      )}
                      <Botao
                        variante="perigo"
                        tamanho="sm"
                        icone={Trash2}
                        carregando={apagandoId === usuario.id}
                        onClick={() => apagar(usuario)}
                        className="w-full sm:w-auto"
                      >
                        Apagar conta
                      </Botao>
                    </div>
                  )}
                </div>

                {transferindoId === usuario.id && (
                  <form
                    onSubmit={(evento) => enviarTransferencia(evento, usuario)}
                    className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      Trocar o titular da conta
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      O perfil {ROTULO_CARGO[usuario.cargo]} e todo o histórico continuam. A
                      pessoa anterior perde o acesso e uma nova senha provisória é gerada.
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Campo
                        rotulo="Nome do novo titular"
                        required
                        autoComplete="name"
                        value={novoNome}
                        onChange={(evento) => setNovoNome(evento.target.value)}
                      />
                      <Campo
                        rotulo="E-mail do novo titular"
                        type="email"
                        required
                        autoComplete="email"
                        value={novoEmail}
                        onChange={(evento) => setNovoEmail(evento.target.value)}
                      />
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <Botao
                        type="button"
                        variante="secundario"
                        onClick={cancelarTransferencia}
                      >
                        Cancelar
                      </Botao>
                      <Botao
                        type="submit"
                        icone={ArrowLeftRight}
                        carregando={enviandoTransferencia}
                      >
                        Transferir conta
                      </Botao>
                    </div>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      )}
    </Pagina>
  );
}
