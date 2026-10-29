import { Alerta } from "@/components/ui/alerta";

interface AguardandoBackendProps {
  funcoes: string[];
}

/** Aviso nas telas cuja função do backend ainda não existe (docs/03-specifications/roteiro.md). */
export function AguardandoBackend({ funcoes }: AguardandoBackendProps) {
  return (
    <Alerta tom="info" titulo="Aguardando o backend">
      Esta tela está estruturada, mas ainda não grava nem lê dados. Depende de{" "}
      {funcoes.map((funcao, indice) => (
        <span key={funcao}>
          {indice > 0 && ", "}
          <code className="rounded bg-white/70 px-1 text-xs">{funcao}</code>
        </span>
      ))}
      .
    </Alerta>
  );
}
