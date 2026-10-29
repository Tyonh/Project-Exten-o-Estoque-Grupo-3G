import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { validarPayloadDoGedoc } from "@estoque/backend/servidor/documento-payload";
import { registrarDocumentoRecebido } from "@estoque/backend/servidor/receber-documento";

// T8.1: o GEDOC envia aqui o documento (orçamento, amostra ou produção) com o
// protocolo e os itens. O QR code impresso no PDF abre /leitura/<protocolo>.
//
// Autenticação: segredo compartilhado no cabeçalho
//   Authorization: Bearer <GEDOC_INTEGRATION_TOKEN>
// Sem sessão de usuário: quem chama é outro servidor. Esta rota é fina; as
// regras ficam em backend/src/servidor/.

const LIMITE_DO_CORPO_EM_BYTES = 1_000_000;

function tokenConfere(recebido: string | null, esperado: string): boolean {
  if (!recebido?.startsWith("Bearer ")) return false;
  const a = Buffer.from(recebido.slice("Bearer ".length));
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

function resposta(corpo: Record<string, unknown>, status: number): NextResponse {
  return NextResponse.json(corpo, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const segredo = process.env.GEDOC_INTEGRATION_TOKEN;
  if (!segredo || segredo.length < 24) {
    console.error("[api/documentos] GEDOC_INTEGRATION_TOKEN ausente ou curto demais.");
    return resposta({ ok: false, erro: "Integração com o GEDOC não configurada." }, 503);
  }
  if (!tokenConfere(request.headers.get("authorization"), segredo)) {
    return resposta({ ok: false, erro: "Não autorizado." }, 401);
  }

  const tamanho = Number(request.headers.get("content-length") ?? 0);
  if (tamanho > LIMITE_DO_CORPO_EM_BYTES) {
    return resposta({ ok: false, erro: "Corpo da requisição grande demais." }, 413);
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return resposta({ ok: false, erro: "O corpo precisa ser um JSON válido." }, 400);
  }

  const validado = validarPayloadDoGedoc(corpo);
  if (!validado.ok) return resposta({ ok: false, erro: validado.erro }, 400);

  const registrado = await registrarDocumentoRecebido(validado.dados);
  if (!registrado.ok) {
    const conflito = registrado.erro.includes("já foi baixado");
    return resposta({ ok: false, erro: registrado.erro }, conflito ? 409 : 422);
  }

  return resposta({ ok: true, ...registrado.dados }, registrado.dados.criado ? 201 : 200);
}
