// Testes das regras puras do backend: classificação do catálogo, recebimento
// de documento do GEDOC e baixa de documento. Rodam sem banco:
//   npm test
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classificarProduto,
  detectarMarca,
  extrairAtributos,
  lerPreco,
  limparCodigo,
} from "../src/servidor/classificacao.ts";
import { CARGOS, eAdmin, eCargo, podeConsultar, podeOperar } from "../src/cargos.ts";
import { destinoSeguro } from "../src/destino.ts";
import { extrairProtocolo, validarPayloadDoGedoc } from "../src/servidor/documento-payload.ts";
import { calcularAjustes, lerContagem } from "../src/servidor/inventario-regras.ts";
import { motivoParaNaoApagar } from "../src/servidor/locais-regras.ts";
import { sugerirRetiradas, validarRetiradas, type ItemPedido } from "../src/servidor/retiradas.ts";

describe("classificação do catálogo", () => {
  it("separa lâmpada fluorescente tubular de compacta e acha a marca", () => {
    const tubular = classificarProduto("LAMP FL TUBO T5 28W 841 CROWN");
    assert.equal(tubular.familia, "Lâmpada fluorescente tubular");
    assert.equal(tubular.categoria, "Lâmpada");
    assert.equal(tubular.marca, "Crown");

    assert.equal(
      classificarProduto("LAMP FL COMP SP 60W 220V 6500K 3G").familia,
      "Lâmpada fluorescente compacta",
    );
  });

  it("trata lâmpada de Natal como decoração, não como lâmpada", () => {
    const natal = classificarProduto("LAMP HLG NATAL 200L BCO FIO TR SEM PLUG 220V");
    assert.equal(natal.categoria, "Natal");
    assert.equal(natal.familia, "Lâmpada natalina");
  });

  it("classifica refletor, luminária e fita", () => {
    assert.equal(classificarProduto("REFL LED RGBW PARCO 9D 90x3W 220V CROWN").familia, "Refletor LED");
    assert.equal(classificarProduto("REFL AB SH03-418A 4X18W RECESSED CROWN").familia, "Refletor aberto");
    assert.equal(classificarProduto("LUM LED DOWNLIGHT SUPERSLIM 20W 8 6500K EBRON").familia, "Luminária downlight");
    assert.equal(classificarProduto("FITA LED COB 10W 3000K 24V 3G").familia, "Fita LED");
  });

  it("manda o que não conhece para Diversos", () => {
    const desconhecido = classificarProduto("BICICLETA P/ADULTO ESPORTIV TRINITY");
    assert.equal(desconhecido.categoria, "Diversos");
    assert.equal(desconhecido.marca, null);
  });

  it("não confunde siglas ambíguas com marca", () => {
    assert.equal(detectarMarca("LAMP FL 2U 9W E27 220V CR"), null);
    assert.equal(detectarMarca("LAMP LED 3U 15WE27 6500K 100-240V PC/VIDRO 3G"), "3G");
    assert.equal(detectarMarca("REFL LED MOD COB 30W BCO MORNO 85-265V Crown"), "Crown");
  });

  it("lê potência, temperatura de cor e tensão da descrição", () => {
    assert.deepEqual(extrairAtributos("LUMINARIA LED YD1510 30W 5500-6000K 85-265V BCO"), {
      potencia_w: 30,
      tensao: "bivolt",
    });
    assert.deepEqual(extrairAtributos("LAMP FL COMP SP 60W 220V 6500K 3G"), {
      potencia_w: 60,
      temperatura_cor_k: 6500,
      tensao: "220V",
    });
  });

  it("limpa preço e código do catálogo legado", () => {
    assert.equal(lerPreco("90,00"), 90);
    assert.equal(lerPreco(16.61), 16.61);
    assert.equal(lerPreco(null), null);
    assert.equal(lerPreco(0), null);
    assert.equal(limparCodigo("50508-1\r\n"), "50508-1");
  });
});

describe("documento recebido do GEDOC", () => {
  const valido = {
    protocolo: "orc-20261029-ab12",
    tipo_documento: "ORCAMENTO",
    cliente_nome: "  Prefeitura   de Fortaleza ",
    solicitante_nome: "Maria",
    validado: true,
    itens: [
      { codigo: "50501", quantidade: 3 },
      { codigo: "50501", quantidade: 2 },
      { codigo: "50502-D", quantidade: "4" },
    ],
  };

  it("normaliza o protocolo, limpa os textos e soma códigos repetidos", () => {
    const resultado = validarPayloadDoGedoc(valido);
    assert.ok(resultado.ok);
    assert.equal(resultado.dados.protocolo, "ORC-20261029-AB12");
    assert.equal(resultado.dados.cliente_nome, "Prefeitura de Fortaleza");
    assert.equal(resultado.dados.origem, "GEDOC");
    assert.equal(resultado.dados.validado, true);
    assert.deepEqual(resultado.dados.itens, [
      { codigo: "50501", quantidade: 5 },
      { codigo: "50502-D", quantidade: 4 },
    ]);
  });

  it("só considera validado quando vem exatamente true", () => {
    const resultado = validarPayloadDoGedoc({ ...valido, validado: "true" });
    assert.ok(resultado.ok);
    assert.equal(resultado.dados.validado, false);
  });

  it("recusa protocolo, tipo, itens e quantidades inválidos", () => {
    assert.equal(validarPayloadDoGedoc(null).ok, false);
    assert.equal(validarPayloadDoGedoc({ ...valido, protocolo: "../etc/passwd" }).ok, false);
    assert.equal(validarPayloadDoGedoc({ ...valido, tipo_documento: "DIALUX" }).ok, false);
    assert.equal(validarPayloadDoGedoc({ ...valido, itens: [] }).ok, false);
    assert.equal(validarPayloadDoGedoc({ ...valido, itens: [{ codigo: "1", quantidade: 0 }] }).ok, false);
    assert.equal(validarPayloadDoGedoc({ ...valido, itens: [{ codigo: "1", quantidade: 1.5 }] }).ok, false);
    assert.equal(validarPayloadDoGedoc({ ...valido, itens: [{ codigo: "", quantidade: 1 }] }).ok, false);
  });
});

describe("leitura do QR code", () => {
  it("extrai o protocolo da URL do QR do GEDOC", () => {
    assert.equal(
      extrairProtocolo("https://estoque.grupo3g.com.br/leitura/ORC-20261029-AB12"),
      "ORC-20261029-AB12",
    );
    assert.equal(
      extrairProtocolo("http://localhost:3000/leitura/orc-20261029-ab12?x=1"),
      "ORC-20261029-AB12",
    );
  });

  it("aceita os protocolos reais do GEDOC, de prefixo com 1 ou 2 letras", () => {
    for (const real of ["O-20260819-PZ7R", "A-20260819-PP2A", "P-20260819-0K9X", "PX-20260819-AB12"]) {
      assert.equal(extrairProtocolo(real), real);
      assert.equal(extrairProtocolo(`https://estoque.exemplo.com.br/leitura/${real}`), real);
    }
  });

  it("aceita o protocolo puro, com espaços e em minúsculas", () => {
    assert.equal(extrairProtocolo("  amo-20261029-zz99 "), "AMO-20261029-ZZ99");
  });

  it("recusa texto que não é protocolo", () => {
    assert.equal(extrairProtocolo(""), null);
    assert.equal(extrairProtocolo("https://exemplo.com/outra/coisa"), null);
    assert.equal(extrairProtocolo("javascript:alert(1)"), null);
    assert.equal(extrairProtocolo("7891234567890"), null);
  });
});

describe("destino depois do login", () => {
  it("aceita só caminhos do próprio sistema", () => {
    assert.equal(destinoSeguro("/leitura/ORC-20261029-AB12"), "/leitura/ORC-20261029-AB12");
    assert.equal(destinoSeguro("/documentos?aba=baixado"), "/documentos?aba=baixado");
  });

  it("recusa redirecionamento para fora ou para o próprio login", () => {
    for (const ruim of ["https://malicioso.com", "//malicioso.com", "/\\malicioso.com", "javascript:alert(1)", "/login", "/login?next=/", "", null, undefined]) {
      assert.equal(destinoSeguro(ruim), "/");
    }
    assert.equal(destinoSeguro("//x.com", "/inicio"), "/inicio");
  });
});

describe("permissões por cargo", () => {
  it("só gerente de estoque e admin operam; os demais consultam ou nada", () => {
    for (const cargo of CARGOS) {
      assert.equal(podeOperar(cargo), cargo === "gerente_estoque" || cargo === "admin", `operar: ${cargo}`);
    }
    assert.equal(podeConsultar("pendente"), false);
    for (const cargo of ["estoquista", "gerente", "gerente_estoque", "admin"] as const) {
      assert.equal(podeConsultar(cargo), true, `consultar: ${cargo}`);
    }
  });

  it("só o admin administra acessos, e valor desconhecido não vira cargo", () => {
    assert.equal(eAdmin("admin"), true);
    assert.equal(eAdmin("gerente_estoque"), false);
    assert.equal(eCargo("admin"), true);
    assert.equal(eCargo("Admin"), false);
    assert.equal(eCargo(undefined), false);
    assert.equal(eCargo("superusuario"), false);
  });
});

describe("apagar local", () => {
  const vazio = { sublocais: 0, temSaldo: false, movimentacoes: 0, inventarios: 0 };

  it("deixa apagar um local criado por engano (sem nada ligado a ele)", () => {
    assert.equal(motivoParaNaoApagar(vazio), null);
  });

  it("recusa local com sublocais, mercadoria ou histórico, e explica o que fazer", () => {
    assert.match(motivoParaNaoApagar({ ...vazio, sublocais: 2 }) ?? "", /sublocais/);
    assert.match(motivoParaNaoApagar({ ...vazio, temSaldo: true }) ?? "", /mercadoria/);
    assert.match(motivoParaNaoApagar({ ...vazio, movimentacoes: 1 }) ?? "", /Desativar/);
    assert.match(motivoParaNaoApagar({ ...vazio, inventarios: 1 }) ?? "", /Desativar/);
  });

  it("a ordem das mensagens leva a pessoa pelo caminho certo: sublocais, depois mercadoria, depois histórico", () => {
    const tudo = { sublocais: 1, temSaldo: true, movimentacoes: 3, inventarios: 1 };
    assert.match(motivoParaNaoApagar(tudo) ?? "", /sublocais/);
    assert.match(motivoParaNaoApagar({ ...tudo, sublocais: 0 }) ?? "", /mercadoria/);
    assert.match(motivoParaNaoApagar({ ...tudo, sublocais: 0, temSaldo: false }) ?? "", /histórico/);
  });
});

describe("inventário", () => {
  const saldos = new Map([["v1", 10], ["v2", 5], ["v3", 0]]);
  const saldoAtual = (v: string): number => saldos.get(v) ?? 0;

  it("gera entrada quando contou mais e saída quando contou menos", () => {
    const ajustes = calcularAjustes(
      [
        { variante_id: "v1", quantidade_contada: 7 },
        { variante_id: "v3", quantidade_contada: 4 },
      ],
      saldoAtual,
    );
    assert.deepEqual(ajustes, [
      { variante_id: "v1", tipo: "saida", quantidade: 3, saldo_atual: 10, saldo_novo: 7 },
      { variante_id: "v3", tipo: "entrada", quantidade: 4, saldo_atual: 0, saldo_novo: 4 },
    ]);
  });

  it("ignora item não contado e contagem igual ao saldo", () => {
    assert.deepEqual(
      calcularAjustes(
        [
          { variante_id: "v1", quantidade_contada: null },
          { variante_id: "v2", quantidade_contada: 5 },
        ],
        saldoAtual,
      ),
      [],
    );
  });

  it("compara com o saldo do momento da conclusão, não com o da abertura", () => {
    // Abriu com 10; alguém deu baixa de 4 no meio; contou 6 → nenhuma diferença.
    const depoisDaBaixa = (): number => 6;
    assert.deepEqual(calcularAjustes([{ variante_id: "v1", quantidade_contada: 6 }], depoisDaBaixa), []);
  });

  it("aceita contagem zero e limpar a contagem; recusa negativo e fracionado", () => {
    assert.deepEqual(lerContagem(0), { ok: true, quantidade: 0 });
    assert.deepEqual(lerContagem(""), { ok: true, quantidade: null });
    assert.deepEqual(lerContagem(null), { ok: true, quantidade: null });
    assert.deepEqual(lerContagem("12"), { ok: true, quantidade: 12 });
    assert.equal(lerContagem(-1).ok, false);
    assert.equal(lerContagem(2.5).ok, false);
    assert.equal(lerContagem("abc").ok, false);
  });
});

describe("baixa de documento", () => {
  const itens: ItemPedido[] = [
    { variante_id: "v1", quantidade: 10, rotulo: "50501 · Refletor 100W" },
    { variante_id: "v2", quantidade: 2, rotulo: "50502 · Fita LED" },
  ];
  const saldos = new Map([
    ["v1|A", 8],
    ["v1|B", 5],
    ["v2|A", 1],
  ]);
  const saldoDe = (v: string, l: string): number => saldos.get(`${v}|${l}`) ?? 0;

  it("sugere tirar do maior saldo e completar com outro local", () => {
    const { retiradas, faltas } = sugerirRetiradas(
      [itens[0]],
      new Map([["v1", [{ local_id: "B", quantidade: 5 }, { local_id: "A", quantidade: 8 }]]]),
    );
    assert.deepEqual(retiradas, [
      { variante_id: "v1", local_id: "A", quantidade: 8 },
      { variante_id: "v1", local_id: "B", quantidade: 2 },
    ]);
    assert.deepEqual(faltas, []);
  });

  it("informa a falta quando o saldo total não cobre o pedido", () => {
    const { faltas } = sugerirRetiradas(itens, new Map([["v2", [{ local_id: "A", quantidade: 1 }]]]));
    assert.deepEqual(
      faltas.map((f) => [f.variante_id, f.faltam]),
      [["v1", 10], ["v2", 1]],
    );
  });

  it("aceita um item saindo de dois locais", () => {
    const resultado = validarRetiradas(
      itens,
      [
        { variante_id: "v1", local_id: "A", quantidade: 6 },
        { variante_id: "v1", local_id: "B", quantidade: 4 },
        { variante_id: "v2", local_id: "A", quantidade: 1 },
        { variante_id: "v2", local_id: "A", quantidade: 1 },
      ],
      (v, l) => (v === "v2" ? 2 : saldoDe(v, l)),
    );
    assert.ok(resultado.ok);
    assert.equal(resultado.retiradas.length, 3);
  });

  it("recusa baixa parcial e quantidade a mais", () => {
    const parcial = validarRetiradas(itens, [{ variante_id: "v1", local_id: "A", quantidade: 8 }], saldoDe);
    assert.equal(parcial.ok, false);

    const demais = validarRetiradas(
      itens,
      [
        { variante_id: "v1", local_id: "A", quantidade: 8 },
        { variante_id: "v1", local_id: "B", quantidade: 5 },
        { variante_id: "v2", local_id: "A", quantidade: 2 },
      ],
      saldoDe,
    );
    assert.equal(demais.ok, false);
  });

  it("diz qual item não tem saldo e não baixa nada", () => {
    const resultado = validarRetiradas(
      itens,
      [
        { variante_id: "v1", local_id: "A", quantidade: 10 },
        { variante_id: "v2", local_id: "A", quantidade: 2 },
      ],
      saldoDe,
    );
    assert.equal(resultado.ok, false);
    assert.match(resultado.ok ? "" : resultado.erro, /50501 · Refletor 100W.*disponível: 8/);
  });

  it("recusa variante de fora do documento e quantidade inválida", () => {
    assert.equal(
      validarRetiradas(itens, [{ variante_id: "vX", local_id: "A", quantidade: 1 }], saldoDe).ok,
      false,
    );
    assert.equal(
      validarRetiradas(itens, [{ variante_id: "v1", local_id: "A", quantidade: -1 }], saldoDe).ok,
      false,
    );
  });
});
