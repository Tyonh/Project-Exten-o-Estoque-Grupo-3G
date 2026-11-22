// Testes da AV3 de Teste de Software (UNIFAMETRO), sobre as regras puras do
// backend. Rodam sem banco, junto com os demais:  npm test
//
// Organização (espelha o relatório em docs/07-testes/av3-relatorio-teste-de-software.md):
//   1. Funcional: partição de equivalência e valores-limite.
//   2. Fluxo de dados: pares definição-uso de `restante` e do saldo.
//   3. Baseado em modelo: modelo de referência do estoque contra as regras.
//   4. Achados: testes que registram o comportamento ATUAL de defeitos
//      encontrados (E-01 a E-11). Quando o defeito for corrigido, o teste
//      correspondente passa a falhar de propósito: inverta a asserção.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { destinoSeguro } from "../src/destino.ts";
import { extrairProtocolo, validarPayloadDoGedoc } from "../src/servidor/documento-payload.ts";
import { calcularAjustes, lerContagem } from "../src/servidor/inventario-regras.ts";
import { sugerirRetiradas, validarRetiradas, type ItemPedido } from "../src/servidor/retiradas.ts";

const base = {
  protocolo: "O-20261029-AB12",
  tipo_documento: "ORCAMENTO",
  itens: [{ codigo: "50501", quantidade: 1 }],
};
const comItens = (itens: unknown) => validarPayloadDoGedoc({ ...base, itens });
const item = (quantidade: number, id = "v1"): ItemPedido => ({ variante_id: id, quantidade, rotulo: id });

describe("AV3 · funcional: valores-limite do documento recebido", () => {
  it("quantidade: 0 e 1.000.001 recusadas; 1 e 1.000.000 aceitas", () => {
    assert.equal(comItens([{ codigo: "A", quantidade: 0 }]).ok, false);
    assert.equal(comItens([{ codigo: "A", quantidade: 1 }]).ok, true);
    assert.equal(comItens([{ codigo: "A", quantidade: 1_000_000 }]).ok, true);
    assert.equal(comItens([{ codigo: "A", quantidade: 1_000_001 }]).ok, false);
  });

  it("número de itens: 0 e 501 recusados; 1 e 500 aceitos", () => {
    const lista = (n: number) => Array.from({ length: n }, (_, i) => ({ codigo: `C${i}`, quantidade: 1 }));
    assert.equal(comItens(lista(0)).ok, false);
    assert.equal(comItens(lista(1)).ok, true);
    assert.equal(comItens(lista(500)).ok, true);
    assert.equal(comItens(lista(501)).ok, false);
  });

  it("código: 50 caracteres aceito, 51 recusado, vazio recusado", () => {
    assert.equal(comItens([{ codigo: "A".repeat(50), quantidade: 1 }]).ok, true);
    assert.equal(comItens([{ codigo: "A".repeat(51), quantidade: 1 }]).ok, false);
    assert.equal(comItens([{ codigo: "", quantidade: 1 }]).ok, false);
  });

  it("corpo que não é objeto (null, array, texto, número) é recusado", () => {
    for (const corpo of [null, [], "texto", 7]) assert.equal(validarPayloadDoGedoc(corpo).ok, false);
  });

  it("protocolo: partes faltando, minúsculo normalizado, 13 caracteres no prefixo recusado", () => {
    assert.equal(validarPayloadDoGedoc({ ...base, protocolo: "O-20261029" }).ok, false);
    assert.equal(validarPayloadDoGedoc({ ...base, protocolo: "o-20261029-ab12" }).ok, true);
    assert.equal(validarPayloadDoGedoc({ ...base, protocolo: `${"A".repeat(13)}-20261029-AB12` }).ok, false);
  });
});

describe("AV3 · funcional: valores-limite de contagem e destino", () => {
  it("contagem: -1 e 1.000.001 recusadas; 0 e 1.000.000 aceitas", () => {
    assert.equal(lerContagem(-1).ok, false);
    assert.deepEqual(lerContagem(0), { ok: true, quantidade: 0 });
    assert.deepEqual(lerContagem(1_000_000), { ok: true, quantidade: 1_000_000 });
    assert.equal(lerContagem(1_000_001).ok, false);
  });

  it("contagem: vazio, null e undefined limpam; 1,5 e NaN são recusados", () => {
    for (const v of ["", null, undefined]) assert.deepEqual(lerContagem(v), { ok: true, quantidade: null });
    assert.equal(lerContagem(1.5).ok, false);
    assert.equal(lerContagem(Number.NaN).ok, false);
  });

  it("destino: 300 caracteres aceito, 301 volta ao padrão", () => {
    assert.equal(destinoSeguro(`/${"a".repeat(299)}`).length, 300);
    assert.equal(destinoSeguro(`/${"a".repeat(300)}`), "/");
  });

  it("destino: redirecionamentos para fora são recusados", () => {
    for (const ruim of ["//evil.com", "http://evil.com", "/\\evil.com", "evil.com", "/a\nb"]) {
      assert.equal(destinoSeguro(ruim), "/", ruim);
    }
  });
});

describe("AV3 · fluxo de dados: `restante` e os saldos de sugerirRetiradas", () => {
  const saldos = new Map([
    ["v1", [{ local_id: "A", quantidade: 5 }, { local_id: "B", quantidade: 3 }]],
  ]);

  it("def inicial → uso no loop → uso final: pedido coberto em dois locais", () => {
    const r = sugerirRetiradas([item(7)], saldos);
    assert.deepEqual(r.retiradas.map((x) => [x.local_id, x.quantidade]), [["A", 5], ["B", 2]]);
    assert.deepEqual(r.faltas, []);
  });

  it("def inicial → uso final sem passar pelo loop: sem saldo vira falta", () => {
    const r = sugerirRetiradas([item(4, "v9")], saldos);
    assert.deepEqual(r.retiradas, []);
    assert.deepEqual(r.faltas, [{ variante_id: "v9", rotulo: "v9", faltam: 4 }]);
  });

  it("p-uso `restante <= 0` verdadeiro cedo: para de pegar de outros locais", () => {
    const r = sugerirRetiradas([item(5)], saldos);
    assert.deepEqual(r.retiradas.map((x) => x.local_id), ["A"]);
  });

  it("saldo igual em dois locais: desempate pelo código do local", () => {
    const igual = new Map([["v1", [{ local_id: "B", quantidade: 4 }, { local_id: "A", quantidade: 4 }]]]);
    assert.equal(sugerirRetiradas([item(4)], igual).retiradas[0]?.local_id, "A");
  });

  it("saldo negativo ou zero no local é ignorado", () => {
    const ruim = new Map([["v1", [{ local_id: "A", quantidade: 0 }, { local_id: "B", quantidade: -3 }]]]);
    assert.equal(sugerirRetiradas([item(1)], ruim).faltas.length, 1);
  });
});

// Modelo de referência: um estoque em memória. Para pedidos aleatórios, o que as
// regras aceitam tem de bater com o que o modelo diz ser possível.
describe("AV3 · baseado em modelo: estoque de referência × regras de baixa", () => {
  function gerador(semente: number) {
    let s = semente;
    return (max: number) => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s % max;
    };
  }

  it("500 pedidos aleatórios: sugestão cobre o pedido sem nunca passar do saldo, e a validação concorda", () => {
    const sorteio = gerador(2026);
    for (let rodada = 0; rodada < 500; rodada++) {
      const locais = ["A", "B", "C"];
      const estoque = new Map<string, Map<string, number>>();
      const pedidos: ItemPedido[] = [];
      for (let v = 0; v < 1 + sorteio(4); v++) {
        const id = `v${v}`;
        estoque.set(id, new Map(locais.map((l) => [l, sorteio(6)])));
        pedidos.push(item(1 + sorteio(12), id));
      }
      const porVariante = new Map(
        [...estoque].map(([id, m]) => [id, [...m].map(([local_id, quantidade]) => ({ local_id, quantidade }))]),
      );
      const { retiradas, faltas } = sugerirRetiradas(pedidos, porVariante);
      const saldoDe = (v: string, l: string) => estoque.get(v)?.get(l) ?? 0;

      for (const p of pedidos) {
        const total = [...(estoque.get(p.variante_id)?.values() ?? [])].reduce((a, b) => a + b, 0);
        const falta = faltas.find((f) => f.variante_id === p.variante_id);
        const retirado = retiradas.filter((r) => r.variante_id === p.variante_id).reduce((a, r) => a + r.quantidade, 0);
        assert.equal(retirado + (falta?.faltam ?? 0), p.quantidade);
        assert.equal(Boolean(falta), total < p.quantidade);
      }
      for (const r of retiradas) assert.ok(r.quantidade <= saldoDe(r.variante_id, r.local_id));

      const resultado = validarRetiradas(pedidos, retiradas, saldoDe);
      assert.equal(resultado.ok, faltas.length === 0);
    }
  });
});

describe("AV3 · achados (comportamento atual dos defeitos)", () => {
  it("E-01: quantidade aceita por coerção de tipo (true, '0x10', '1e3', [7])", () => {
    const q = (quantidade: unknown) => {
      const r = comItens([{ codigo: "A", quantidade }]);
      return r.ok ? r.dados.itens[0]?.quantidade : null;
    };
    assert.equal(q(true), 1);
    assert.equal(q("0x10"), 16);
    assert.equal(q("1e3"), 1000);
    assert.equal(q([7]), 7);
  });

  it("E-02: a soma de códigos repetidos passa do limite de 1.000.000", () => {
    const r = comItens([{ codigo: "A", quantidade: 1_000_000 }, { codigo: "A", quantidade: 1_000_000 }]);
    assert.equal(r.ok && r.dados.itens[0]?.quantidade, 2_000_000);
  });

  it("E-03: a data do protocolo não é validada (mês 13 e 00000000)", () => {
    assert.equal(validarPayloadDoGedoc({ ...base, protocolo: "O-20261399-AB12" }).ok, true);
    assert.equal(validarPayloadDoGedoc({ ...base, protocolo: "O-00000000-AB12" }).ok, true);
  });

  it("E-04: espaços dentro do código são apagados em silêncio ('50 501' vira '50501')", () => {
    const r = comItens([{ codigo: "50 501", quantidade: 1 }]);
    assert.equal(r.ok && r.dados.itens[0]?.codigo, "50501");
  });

  it("E-05: códigos que só diferem em maiúsculas/minúsculas não são somados (o banco tem unique por variante)", () => {
    const r = comItens([{ codigo: "abc", quantidade: 1 }, { codigo: "ABC", quantidade: 1 }]);
    assert.equal(r.ok && r.dados.itens.length, 2);
  });

  it("E-06: contagem de inventário em branco, true e [] viram número", () => {
    assert.deepEqual(lerContagem(" "), { ok: true, quantidade: 0 });
    assert.deepEqual(lerContagem(true), { ok: true, quantidade: 1 });
    assert.deepEqual(lerContagem([]), { ok: true, quantidade: 0 });
  });

  it("E-07: pedido com a mesma variante em duas linhas retira duas vezes do mesmo saldo", () => {
    const r = sugerirRetiradas([item(5), item(5)], new Map([["v1", [{ local_id: "A", quantidade: 5 }]]]));
    assert.equal(r.retiradas.reduce((a, x) => a + x.quantidade, 0), 10);
    assert.deepEqual(r.faltas, []);
  });

  it("E-08: saldo desconhecido (NaN/undefined) passa na validação da baixa", () => {
    const retirada = [{ variante_id: "v1", local_id: "A", quantidade: 5 }];
    assert.equal(validarRetiradas([item(5)], retirada, () => Number.NaN).ok, true);
    assert.equal(validarRetiradas([item(5)], retirada, () => undefined as unknown as number).ok, true);
  });

  it("E-09: destinoSeguro não trata /login#x, /LOGIN e /a/../login como a tela de login", () => {
    assert.equal(destinoSeguro("/login#x"), "/login#x");
    assert.equal(destinoSeguro("/LOGIN"), "/LOGIN");
    assert.equal(destinoSeguro("/a/../login"), "/a/../login");
  });

  it("E-10: QR de qualquer endereço é aceito se o último trecho for um protocolo", () => {
    assert.equal(extrairProtocolo("https://outro-site.example/leitura/O-20261029-AB12"), "O-20261029-AB12");
    assert.equal(extrairProtocolo("https://outro-site.example/qualquer/O-20261029-AB12"), "O-20261029-AB12");
  });

  it("E-11: saldo negativo vindo do banco gera ajuste de entrada em vez de erro", () => {
    const [ajuste] = calcularAjustes([{ variante_id: "a", quantidade_contada: 0 }], () => -2);
    assert.equal(ajuste?.tipo, "entrada");
    assert.equal(ajuste?.saldo_atual, -2);
  });
});
