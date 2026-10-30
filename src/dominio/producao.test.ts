import { describe, expect, it } from 'vitest';
import { colheita, evento, UNIDADES } from './fabrica.test-util';
import {
  anosComRegistros, comparar, emKg, eventosPorMes, filtrarColheitas, mapaDeUnidades, producaoAnual, producaoMensal, producaoPorCultura,
  producaoPorDestino, totaisPorUnidade, totaisSemConversao, totalKg,
} from './producao';

const U = mapaDeUnidades(UNIDADES);
const lista = [
  colheita({ id: '1', culturaId: 'jab', data: '2026-01-10', quantidade: 10, unidade: 'kg' }),
  colheita({ id: '2', culturaId: 'jab', data: '2026-01-20', quantidade: 500, unidade: 'g', destino: 'doacao' }),
  colheita({ id: '3', culturaId: 'ban', data: '2026-03-05', quantidade: 20, unidade: 'cachos', destino: 'venda' }),
  colheita({ id: '4', culturaId: 'lar', data: '2026-03-07', quantidade: 9.5, unidade: 'kg', destino: 'venda' }),
  colheita({ id: '5', culturaId: 'lar', data: '2025-07-01', quantidade: 4, unidade: 'kg' }),
  colheita({ id: '6', culturaId: 'ban', data: '2026-03-30', quantidade: 3, unidade: 'cachos' }),
];

describe('conversão para kg', () => {
  it('converte só unidades com fator; cachos nunca viram kg', () => {
    expect(emKg(lista[1]!, U)).toBe(0.5);
    expect(emKg(lista[2]!, U)).toBeNull();
    expect(emKg(colheita({ id: 'x', culturaId: 'a', data: '2026-01-01', quantidade: 1, unidade: 'desconhecida' }), U)).toBeNull();
  });

  it('total em kg não mistura unidades e conta o que ficou de fora', () => {
    expect(totalKg(lista, U)).toEqual({ kg: 24, convertidas: 4, semConversao: 2 });
  });

  it('soma sem erro de ponto flutuante', () => {
    const l = [0.1, 0.2].map((q, i) => colheita({ id: String(i), culturaId: 'a', data: '2026-01-01', quantidade: q, unidade: 'kg' }));
    expect(totalKg(l, U).kg).toBe(0.3);
  });
});

describe('totais por unidade', () => {
  it('mantém cada unidade separada (10 kg e 20 cachos não viram 30)', () => {
    expect(totaisPorUnidade(lista)).toEqual([
      { unidade: 'kg', total: 23.5, registros: 3 },
      { unidade: 'cachos', total: 23, registros: 2 },
      { unidade: 'g', total: 500, registros: 1 },
    ]);
    expect(totaisSemConversao(lista, U)).toEqual([{ unidade: 'cachos', total: 23, registros: 2 }]);
  });
});

describe('filtros', () => {
  it('período com limites inclusivos', () => {
    expect(filtrarColheitas(lista, { periodo: { de: '2026-01-20', ate: '2026-03-07' } }).map((c) => c.id)).toEqual(['2', '3', '4']);
    expect(filtrarColheitas(lista, { periodo: { de: '2026-03-01' } }).map((c) => c.id)).toEqual(['3', '4', '6']);
    expect(filtrarColheitas(lista, { periodo: { ate: '2025-12-31' } }).map((c) => c.id)).toEqual(['5']);
  });

  it('combina cultura, destino e período', () => {
    expect(filtrarColheitas(lista, { culturaId: 'lar', destino: 'venda', periodo: { de: '2026-01-01', ate: '2026-12-31' } }).map((c) => c.id)).toEqual(['4']);
    expect(filtrarColheitas(lista, {})).toHaveLength(6);
  });
});

describe('produção mensal, anual, por cultura e destino', () => {
  it('mensal: kg e número de registros do ano pedido', () => {
    const m = producaoMensal(lista, 2026, U);
    expect(m).toHaveLength(12);
    expect(m[0]).toEqual({ mes: 1, kg: 10.5, registros: 2 });
    expect(m[2]).toEqual({ mes: 3, kg: 9.5, registros: 3 });
    expect(m[6]).toEqual({ mes: 7, kg: 0, registros: 0 }); // a de 2025 não entra
  });

  it('anual, em ordem de ano', () => {
    expect(producaoAnual(lista, U)).toEqual([{ ano: 2025, kg: 4, registros: 1 }, { ano: 2026, kg: 20, registros: 5 }]);
  });

  it('por cultura: percentual sobre o total em kg; outras unidades à parte', () => {
    const p = producaoPorCultura(lista.filter((c) => c.data >= '2026'), U);
    expect(p.map((x) => [x.culturaId, x.kg, x.percentualKg])).toEqual([['jab', 10.5, 52.5], ['lar', 9.5, 47.5], ['ban', 0, 0]]);
    expect(p[2]!.outras).toEqual([{ unidade: 'cachos', total: 23, registros: 2 }]);
  });

  it('sem nada em kg, o percentual é null (não divide por zero)', () => {
    expect(producaoPorCultura([lista[2]!], U)[0]!.percentualKg).toBeNull();
  });

  it('por destino', () => {
    expect(producaoPorDestino(lista, U)).toEqual([
      { destino: 'consumo_familiar', kg: 14, registros: 3 },
      { destino: 'venda', kg: 9.5, registros: 2 },
      { destino: 'doacao', kg: 0.5, registros: 1 },
    ]);
  });
});

describe('comparação e eventos', () => {
  it('variação percentual só com base anterior', () => {
    expect(comparar(15, 10)).toEqual({ atual: 15, anterior: 10, diferenca: 5, percentual: 50 });
    expect(comparar(5, 0).percentual).toBeNull();
  });

  it('eventos por mês e anos com registros', () => {
    const ev = [evento({ id: 'a', culturaId: 'x', data: '2026-09-01' }), evento({ id: 'b', culturaId: 'x', data: '2026-09-30' }), evento({ id: 'c', culturaId: 'x', data: '2024-02-01' })];
    expect(eventosPorMes(ev, 2026)[8]).toBe(2);
    expect(eventosPorMes(ev, 2026).reduce((a, b) => a + b)).toBe(2);
    expect(anosComRegistros(lista, ev, 2026)).toEqual([2026, 2025, 2024]);
  });
});
